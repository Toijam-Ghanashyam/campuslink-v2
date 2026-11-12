'use server';

import { createClient as createServerUserClient, createAdminClient } from '@/lib/supabase/server';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';
import {
  validateStudentAgainstDataset,
  normalizeBranchName,
  normalizeRoll,
  DatasetStudentRow,
} from '@/lib/dataset-validator';
import { revalidatePath } from 'next/cache';

export async function registerNewUser(data: {
  email: string;
  password: string;
  role: 'STUDENT' | 'RECRUITER' | 'TPO_ADMIN';
  firstName?: string;
  lastName?: string;
  collegeId?: string;
  companyName?: string;
  designation?: string;
  rollNumber?: string;
  branch?: string;
  batchYear?: number;
  cgpa?: number;
  activeBacklogs?: number;
  resumeUrl?: string;
  skills?: string[];
}): Promise<{
  success: boolean;
  userId?: string;
  error?: string;
  mismatches?: string[];
  mismatchSummary?: string;
  autoVerified?: boolean;
}> {
  const supabase = createAdminClient();

  const {
    email,
    password,
    role,
    firstName,
    lastName,
    collegeId = AFFILIATED_COLLEGES[0].id,
    companyName,
    designation,
    rollNumber,
    branch,
    batchYear = 2026,
    cgpa = 7.50,
    activeBacklogs = 0,
    resumeUrl,
  } = data;

  const fName = (firstName || email.split('@')[0]).trim();
  const lName = (lastName || (role === 'RECRUITER' ? 'Recruiter' : role === 'TPO_ADMIN' ? 'Admin' : 'User')).trim();
  const fullName = `${fName} ${lName}`.trim();
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check if user already exists in auth.users or public.users
  const { data: userList } = await supabase.auth.admin.listUsers();
  const existingUser = userList?.users?.find(
    (u) => u.email?.toLowerCase() === cleanEmail
  );

  const { data: existingPubUser } = await supabase
    .from('users')
    .select('id, email')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (existingUser || existingPubUser) {
    return {
      success: false,
      error: 'An account with this email address already exists. Please sign in instead.',
    };
  }

  // 2. DATASET REGISTRY CHECK FOR STUDENTS
  // When a student registers for the first time:
  // Check the student registry uploaded by the admin (college_student_registry).
  // If it is a perfect match, auto-verify and unlock the profile.
  // If NOT a match, block registration and return the exact mismatching fields!
  let isAutoVerified = false;
  let finalRoll = '';
  let finalBranch = '';
  let finalBatchYear = Number(batchYear) || 2026;
  let finalCgpa = Number(cgpa);
  let finalBacklogs = Number(activeBacklogs) || 0;
  let effectiveCollegeId = collegeId;

  if (role === 'STUDENT') {
    finalRoll = normalizeRoll(rollNumber || '');
    finalBranch = normalizeBranchName(branch || 'Computer Science & Engineering');

    // Query official dataset uploaded by TPO Admin for this college
    let { data: registryRows } = await supabase
      .from('college_student_registry')
      .select('*')
      .eq('tenant_id', collegeId);

    // If not found in selected college, check across all college registries by roll number
    if ((!registryRows || registryRows.length === 0) && finalRoll) {
      const { data: globalMatch } = await supabase
        .from('college_student_registry')
        .select('*')
        .eq('roll_number', finalRoll);
      if (globalMatch && globalMatch.length > 0) {
        registryRows = globalMatch;
        if (globalMatch[0].tenant_id) {
          effectiveCollegeId = globalMatch[0].tenant_id;
        }
      }
    }

    if (registryRows && registryRows.length > 0) {
      const validation = validateStudentAgainstDataset(
        {
          roll_number: finalRoll,
          full_name: fullName,
          email: cleanEmail,
          branch: finalBranch,
          batch_year: finalBatchYear,
          cgpa: finalCgpa,
          active_backlogs: finalBacklogs,
        },
        registryRows as DatasetStudentRow[]
      );

      // If NOT a match, block registration and show mismatch error with exact mismatch fields!
      if (!validation.matched) {
        return {
          success: false,
          error: 'DATASET_MISMATCH',
          mismatches: validation.mismatches,
          mismatchSummary: validation.mismatchSummary || 'Your details do not match the official college placement registry.',
        };
      }

      // If perfect match: unlock student profile automatically!
      isAutoVerified = true;
      if (validation.officialRecord) {
        // Sync verified details from official record
        finalCgpa = Number(validation.officialRecord.cgpa);
        finalBacklogs = Number(validation.officialRecord.active_backlogs);
        finalBatchYear = Number(validation.officialRecord.batch_year);
      }
    }
  }

  // 3. Create brand new and auto-confirm user in auth.users
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      first_name: fName,
      last_name: lName,
      full_name: fullName,
      college_id: role === 'RECRUITER' ? null : effectiveCollegeId,
      company_name: companyName || (role === 'RECRUITER' ? 'Corporate Partner' : undefined),
      designation: designation || (role === 'TPO_ADMIN' ? 'Training & Placement Officer' : role === 'RECRUITER' ? 'Talent Acquisition' : undefined),
      skills: data.skills || [],
    },
  });

  if (authErr || !authData?.user) {
    if (authErr?.message?.toLowerCase().includes('already')) {
      return {
        success: false,
        error: 'An account with this email address already exists. Please sign in instead.',
      };
    }
    return { success: false, error: authErr?.message || 'Failed to create user account' };
  }

  const userId = authData.user.id;

  // 4. Ensure public.users entry exists with college_id / tenant_id
  try {
    await supabase.from('users').upsert({
      id: userId,
      tenant_id: role === 'RECRUITER' ? null : effectiveCollegeId,
      college_id: role === 'RECRUITER' ? null : effectiveCollegeId,
      email: cleanEmail,
      role,
      first_name: fName,
      last_name: lName,
    });
  } catch (err) {
    console.warn('Users upsert warning:', err);
  }

  // 5. If student, create student_profiles entry
  if (role === 'STUDENT') {
    const isLocked = isAutoVerified; // In PEP Rule 1: is_locked = true means verified & unlocked for drives!
    const verificationStatus = isAutoVerified ? 'VERIFIED' : 'PENDING_VERIFICATION';
    const verificationSource = 'ADMIN_MANUAL';

    try {
      const { data: existingSp } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const profilePayload: Record<string, any> = {
        user_id: userId,
        tenant_id: effectiveCollegeId,
        college_id: effectiveCollegeId,
        full_name: fullName,
        roll_number: finalRoll || ('220101' + Math.floor(100 + Math.random() * 900)),
        branch: finalBranch,
        batch_year: finalBatchYear,
        verified_cgpa: finalCgpa,
        active_backlogs: finalBacklogs,
        placement_status: 'UNPLACED',
        current_highest_ctc: 0,
        verification_source: verificationSource,
        verification_status: verificationStatus,
        rejection_reason: null,
        is_locked: isLocked,
        resume_url: resumeUrl || null,
      };

      if (existingSp) {
        const updateRes = await supabase
          .from('student_profiles')
          .update(profilePayload)
          .eq('id', existingSp.id);
        if (updateRes.error) {
          console.error('[auth] student_profiles update error:', updateRes.error);
        }
      } else {
        const insertRes = await supabase.from('student_profiles').insert(profilePayload);
        if (insertRes.error) {
          console.error('[auth] student_profiles insert error:', insertRes.error);
        }
      }
    } catch (err) {
      console.warn('Student profile upsert warning:', err);
    }

    return {
      success: true,
      userId,
      autoVerified: isAutoVerified,
    };
  }

  return { success: true, userId };
}

/**
 * Allows a student whose profile is MISMATCH_LOCKED (or PENDING_VERIFICATION)
 * to fix their wrong details and automatically re-verify against the college dataset.
 */
export async function updateAndReverifyStudentProfile(input: {
  full_name: string;
  roll_number: string;
  branch: string;
  batch_year: number;
  verified_cgpa: number;
  active_backlogs: number;
}) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Please sign in first.' };
  }

  const supabase = createAdminClient();

  const { data: profile, error: profErr } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profErr || !profile) {
    return { success: false, error: 'Student profile not found.' };
  }

  const collegeId = profile.tenant_id || profile.college_id || AFFILIATED_COLLEGES[0].id;
  const cleanRoll = normalizeRoll(input.roll_number);
  const cleanBranch = normalizeBranchName(input.branch);
  const cleanName = input.full_name.trim();
  const cleanBatch = Number(input.batch_year) || 2026;
  const cleanCgpa = Number(input.verified_cgpa);
  const cleanBacklogs = Number(input.active_backlogs) || 0;

  // Fetch college dataset
  const { data: registryRows } = await supabase
    .from('college_student_registry')
    .select('*')
    .eq('tenant_id', collegeId);

  let isLocked = false;
  let verificationStatus = 'PENDING_VERIFICATION';
  let verificationSource = 'ADMIN_MANUAL';
  let rejectionReason: string | null = null;

  if (registryRows && registryRows.length > 0) {
    const validation = validateStudentAgainstDataset(
      {
        roll_number: cleanRoll,
        full_name: cleanName,
        email: user.email || '',
        branch: cleanBranch,
        batch_year: cleanBatch,
        cgpa: cleanCgpa,
        active_backlogs: cleanBacklogs,
      },
      registryRows as DatasetStudentRow[]
    );

    if (validation.matched) {
      isLocked = true;
      verificationStatus = 'VERIFIED';
      verificationSource = 'ADMIN_MANUAL';
      rejectionReason = null;
    } else {
      isLocked = false;
      verificationStatus = 'MISMATCH_LOCKED';
      verificationSource = 'ADMIN_MANUAL';
      rejectionReason = validation.mismatchSummary;
    }
  }

  const { error: updateErr } = await supabase
    .from('student_profiles')
    .update({
      full_name: cleanName,
      roll_number: cleanRoll,
      branch: cleanBranch,
      batch_year: cleanBatch,
      verified_cgpa: cleanCgpa,
      active_backlogs: cleanBacklogs,
      is_locked: isLocked,
      verification_status: verificationStatus,
      verification_source: 'ADMIN_MANUAL',
      rejection_reason: rejectionReason,
    })
    .eq('id', profile.id);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  revalidatePath('/student');
  revalidatePath('/student/drives');
  revalidatePath('/admin');

  return {
    success: true,
    matched: isLocked,
    verificationStatus,
    rejectionReason,
    message: isLocked
      ? 'All details matched the official college dataset! Your profile is now verified and unlocked for placement drives.'
      : 'Some details still do not match the official college dataset. Please check the highlighted reasons.',
  };
}

export async function ensureStudentProfile(userId: string, email: string, collegeId?: string) {
  const supabase = createAdminClient();
  const tenantId = collegeId || AFFILIATED_COLLEGES[0].id;

  try {
    const { data: existingSp } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingSp) {
      // Fetch user metadata
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const meta = userData?.user?.user_metadata || {};
      const fName = meta.first_name || email.split('@')[0];
      const lName = meta.last_name || '';
      const fullName = (meta.full_name || `${fName} ${lName}`).trim();
      const cleanEmail = email.trim().toLowerCase();

      // Check if this student is in college_student_registry
      let { data: regRows } = await supabase
        .from('college_student_registry')
        .select('*')
        .or(`email.ilike.${cleanEmail},full_name.ilike.${fullName}`);

      if (regRows && regRows.length > 0) {
        const reg = regRows[0];
        await supabase.from('student_profiles').insert({
          user_id: userId,
          tenant_id: reg.tenant_id || tenantId,
          college_id: reg.tenant_id || tenantId,
          full_name: reg.full_name,
          roll_number: reg.roll_number,
          branch: reg.branch,
          batch_year: Number(reg.batch_year) || 2026,
          verified_cgpa: Number(reg.cgpa) || 7.50,
          active_backlogs: Number(reg.active_backlogs) || 0,
          placement_status: 'UNPLACED',
          current_highest_ctc: 0,
          verification_source: 'ADMIN_MANUAL',
          verification_status: 'VERIFIED',
          is_locked: true,
        });
        return;
      }

      const randomRoll = '220101' + Math.floor(100 + Math.random() * 900);
      await supabase.from('student_profiles').insert({
        user_id: userId,
        tenant_id: tenantId,
        college_id: tenantId,
        full_name: fullName,
        roll_number: randomRoll,
        branch: 'Computer Science & Engineering',
        batch_year: 2026,
        verified_cgpa: 7.80,
        active_backlogs: 0,
        placement_status: 'UNPLACED',
        current_highest_ctc: 0,
        verification_source: 'ADMIN_MANUAL',
        verification_status: 'PENDING_VERIFICATION',
        is_locked: false,
      });
    }
  } catch (err) {
    console.warn('Student profile ensure warning:', err);
  }
}

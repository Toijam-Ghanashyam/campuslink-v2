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
  rollNumber?: string;
  branch?: string;
  batchYear?: number;
  cgpa?: number;
  activeBacklogs?: number;
  resumeUrl?: string;
}) {
  const supabase = createAdminClient();

  const {
    email,
    password,
    role,
    firstName,
    lastName,
    collegeId = AFFILIATED_COLLEGES[0].id,
    rollNumber,
    branch,
    batchYear = 2026,
    cgpa = 7.50,
    activeBacklogs = 0,
    resumeUrl,
  } = data;

  const fName = (firstName || email.split('@')[0]).trim();
  const lName = (lastName || '').trim();
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

  // 2. Create brand new and auto-confirm user in auth.users
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: {
      role,
      first_name: fName,
      last_name: lName,
      full_name: fullName,
      college_id: collegeId,
      company_name: data.companyName || undefined,
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

  // 3. Ensure public.users entry exists with college_id / tenant_id
  try {
    await supabase.from('users').upsert({
      id: userId,
      tenant_id: collegeId,
      college_id: collegeId,
      email: cleanEmail,
      role,
      first_name: fName,
      last_name: lName,
    });
  } catch (err) {
    console.warn('Users upsert warning:', err);
  }

  // 4. If student, automatically check against Admin's uploaded college_student_registry dataset
  if (role === 'STUDENT') {
    const finalRoll = normalizeRoll(rollNumber || ('220101' + Math.floor(100 + Math.random() * 900)));
    const finalBranch = normalizeBranchName(branch || 'Computer Science & Engineering');
    const finalBatchYear = Number(batchYear) || 2026;
    const finalCgpa = Number(cgpa);
    const finalBacklogs = Number(activeBacklogs) || 0;

    let isLocked = false;
    let verificationStatus = 'PENDING_VERIFICATION';
    let verificationSource = 'ADMIN_MANUAL';
    let rejectionReason: string | null = null;

    try {
      // Fetch master dataset for this student's college
      const { data: registryRows } = await supabase
        .from('college_student_registry')
        .select('*')
        .eq('tenant_id', collegeId);

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

        if (validation.matched) {
          isLocked = true; // Auto-verified and PEP Rule 1 unlocked for drives
          verificationStatus = 'VERIFIED';
          verificationSource = 'DATASET_AUTO';
          rejectionReason = null;
        } else {
          isLocked = false; // Locked from drives until student fixes mismatched data
          verificationStatus = 'MISMATCH_LOCKED';
          verificationSource = 'DATASET_MISMATCH';
          rejectionReason = validation.mismatchSummary;
        }
      }
    } catch (datasetErr) {
      console.warn('Dataset auto-check warning:', datasetErr);
    }

    try {
      const { data: existingSp } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      const profilePayload: Record<string, any> = {
        user_id: userId,
        tenant_id: collegeId,
        college_id: collegeId,
        full_name: fullName,
        roll_number: finalRoll,
        branch: finalBranch,
        batch_year: finalBatchYear,
        verified_cgpa: finalCgpa,
        active_backlogs: finalBacklogs,
        placement_status: 'UNPLACED',
        current_highest_ctc: 0,
        verification_source: verificationSource,
        verification_status: verificationStatus,
        rejection_reason: rejectionReason,
        is_locked: isLocked,
        resume_url: resumeUrl || null,
      };

      if (existingSp) {
        await supabase
          .from('student_profiles')
          .update(profilePayload)
          .eq('id', existingSp.id);
      } else {
        await supabase.from('student_profiles').insert(profilePayload);
      }
    } catch (err) {
      console.warn('Student profile upsert warning:', err);
    }

    return {
      success: true,
      userId,
      verificationStatus,
      rejectionReason,
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
      verificationSource = 'DATASET_AUTO';
      rejectionReason = null;
    } else {
      isLocked = false;
      verificationStatus = 'MISMATCH_LOCKED';
      verificationSource = 'DATASET_MISMATCH';
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
      verification_source: verificationSource,
      rejection_reason: rejectionReason,
      updated_at: new Date().toISOString(),
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
      const randomRoll = '220101' + Math.floor(100 + Math.random() * 900);
      await supabase.from('student_profiles').insert({
        user_id: userId,
        tenant_id: tenantId,
        college_id: tenantId,
        full_name: email.split('@')[0],
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

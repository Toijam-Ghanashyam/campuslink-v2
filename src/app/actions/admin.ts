'use server';

import { createClient as createServerUserClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlacementTier, PlacementStatus } from '@/types/pep';
import {
  DatasetStudentRow,
  validateStudentAgainstDataset,
  normalizeRoll,
  normalizeBranchName,
} from '@/lib/dataset-validator';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';

async function resolveAdminCollegeId(user: any, supabase: any): Promise<string> {
  if (user.user_metadata?.college_id) return user.user_metadata.college_id;
  const { data: pubUser } = await supabase
    .from('users')
    .select('tenant_id')
    .eq('id', user.id)
    .maybeSingle();
  return pubUser?.tenant_id || AFFILIATED_COLLEGES[0].id;
}

/**
 * Uploads/upserts the official college student dataset and retroactively
 * verifies or mismatch-locks all existing student profiles in that college.
 */
export async function uploadCollegeDataset(rows: DatasetStudentRow[]) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  if (!rows || rows.length === 0) {
    return { success: false, error: 'Dataset is empty. Please provide valid student rows.' };
  }

  const supabase = createAdminClient();
  const adminCollegeId = await resolveAdminCollegeId(user, supabase);

  // 1. Prepare clean upsert payload scoped strictly to adminCollegeId
  const upsertPayload = rows.map((r) => ({
    tenant_id: adminCollegeId,
    roll_number: normalizeRoll(r.roll_number),
    full_name: (r.full_name || 'Student Candidate').trim(),
    email: r.email ? r.email.trim().toLowerCase() : null,
    branch: normalizeBranchName(r.branch || 'Computer Science & Engineering'),
    batch_year: Number(r.batch_year) || 2026,
    cgpa: Number(Number(r.cgpa || 0).toFixed(2)),
    active_backlogs: Number(r.active_backlogs || 0),
    uploaded_by: user.id,
    updated_at: new Date().toISOString(),
  }));

  const { error: upsertErr } = await supabase
    .from('college_student_registry')
    .upsert(upsertPayload, { onConflict: 'tenant_id,roll_number' });

  if (upsertErr) {
    return { success: false, error: `Failed to save college dataset: ${upsertErr.message}` };
  }

  // 2. Fetch full updated dataset for this college
  const { data: allRegistryRows } = await supabase
    .from('college_student_registry')
    .select('*')
    .eq('tenant_id', adminCollegeId);

  // 3. Retroactively check all existing student_profiles in this college
  const { data: existingStudents } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('tenant_id', adminCollegeId);

  let autoVerifiedCount = 0;
  let mismatchLockedCount = 0;

  if (existingStudents && allRegistryRows && allRegistryRows.length > 0) {
    for (const st of existingStudents) {
      // Look up student's email from users table if needed
      const { data: uRow } = await supabase
        .from('users')
        .select('email')
        .eq('id', st.user_id)
        .maybeSingle();

      const validation = validateStudentAgainstDataset(
        {
          roll_number: st.roll_number || '',
          full_name: st.full_name || '',
          email: uRow?.email || '',
          branch: st.branch || 'Computer Science & Engineering',
          batch_year: Number(st.batch_year) || 2026,
          cgpa: Number(st.verified_cgpa) || 0,
          active_backlogs: Number(st.active_backlogs) || 0,
        },
        allRegistryRows as DatasetStudentRow[]
      );

      if (validation.matched) {
        autoVerifiedCount++;
        await supabase
          .from('student_profiles')
          .update({
            is_locked: true,
            verification_status: 'VERIFIED',
            verification_source: 'DATASET_AUTO',
            rejection_reason: null,
          })
          .eq('id', st.id);
      } else {
        mismatchLockedCount++;
        await supabase
          .from('student_profiles')
          .update({
            is_locked: false,
            verification_status: 'MISMATCH_LOCKED',
            verification_source: 'DATASET_MISMATCH',
            rejection_reason: validation.mismatchSummary,
          })
          .eq('id', st.id);
      }
    }
  }

  revalidatePath('/admin');
  revalidatePath('/student');
  revalidatePath('/student/drives');

  return {
    success: true,
    totalUploaded: upsertPayload.length,
    autoVerifiedCount,
    mismatchLockedCount,
    message: `Uploaded ${upsertPayload.length} student records. Auto-verified: ${autoVerifiedCount}, Locked due to mismatch: ${mismatchLockedCount}.`,
  };
}

/**
 * Deletes a single record from the college dataset registry
 */
export async function deleteDatasetRegistryRow(registryId: string) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  const supabase = createAdminClient();
  const adminCollegeId = await resolveAdminCollegeId(user, supabase);

  const { error } = await supabase
    .from('college_student_registry')
    .delete()
    .eq('id', registryId)
    .eq('tenant_id', adminCollegeId);

  if (error) return { success: false, error: error.message };
  revalidatePath('/admin');
  return { success: true };
}

/**
 * Toggles academic verification lock for a student profile with strict college isolation
 */
export async function toggleStudentLock(studentId: string, isLocked: boolean) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  const { data: targetStudent, error: findErr } = await supabase
    .from('student_profiles')
    .select('id, tenant_id')
    .eq('id', studentId)
    .single();

  if (findErr || !targetStudent) {
    return { success: false, error: 'Student profile not found.' };
  }

  const adminCollegeId = await resolveAdminCollegeId(user, supabase);
  if (adminCollegeId && targetStudent.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You are not authorized to modify students outside your designated college.',
    };
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({
      is_locked: isLocked,
      verification_status: isLocked ? 'VERIFIED' : 'PENDING_VERIFICATION',
      rejection_reason: isLocked ? null : undefined,
      verification_source: 'ADMIN_MANUAL',
    })
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/student');
  return {
    success: true,
    message: `Student profile ${isLocked ? 'verified & locked' : 'unlocked for editing'}.`,
  };
}

/**
 * Approves and verifies student academic record with confirmed CGPA & Backlogs
 */
export async function verifyStudentProfile(
  studentId: string,
  isApproved: boolean,
  confirmedCgpa?: number,
  confirmedBacklogs?: number,
  customRejectionReason?: string
) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  const { data: targetStudent, error: findErr } = await supabase
    .from('student_profiles')
    .select('id, tenant_id')
    .eq('id', studentId)
    .single();

  if (findErr || !targetStudent) {
    return { success: false, error: 'Student profile not found.' };
  }

  const adminCollegeId = await resolveAdminCollegeId(user, supabase);
  if (adminCollegeId && targetStudent.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You are not authorized to verify or approve students outside your designated college.',
    };
  }

  const updateData: Record<string, any> = {
    is_locked: isApproved,
    verification_status: isApproved ? 'VERIFIED' : 'MISMATCH_LOCKED',
    rejection_reason: isApproved
      ? null
      : customRejectionReason || 'Academic record rejected by TPO Admin. Please verify and fix your submitted details.',
    verification_source: 'ADMIN_MANUAL',
  };

  if (confirmedCgpa !== undefined) {
    updateData.verified_cgpa = Number(confirmedCgpa);
  }
  if (confirmedBacklogs !== undefined) {
    updateData.active_backlogs = Number(confirmedBacklogs);
  }

  const { error } = await supabase
    .from('student_profiles')
    .update(updateData)
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/student');
  return {
    success: true,
    message: isApproved
      ? 'Student record verified and locked for placement drives!'
      : 'Student record marked as locked with mismatch reason.',
  };
}

/**
 * Updates academic records (CGPA, Backlogs, Status)
 */
export async function updateStudentAcademicRecord(
  studentId: string,
  cgpa: number,
  backlogs: number,
  status: PlacementStatus
) {
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  const { data: targetStudent } = await supabase
    .from('student_profiles')
    .select('tenant_id')
    .eq('id', studentId)
    .single();

  const adminCollegeId = await resolveAdminCollegeId(user, supabase);
  if (adminCollegeId && targetStudent?.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You cannot edit records of students belonging to another college.',
    };
  }

  const { error } = await supabase
    .from('student_profiles')
    .update({
      verified_cgpa: cgpa,
      active_backlogs: backlogs,
      placement_status: status,
    })
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true, message: 'Student record updated successfully.' };
}

/**
 * Creates a new placement drive
 */
export async function createPlacementDrive(data: {
  company_name: string;
  role_title: string;
  tier: PlacementTier;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  status: string;
  drive_date?: string;
  deadline?: string;
  description?: string;
}) {
  const supabase = createAdminClient();

  const safeParseDate = (dateStr?: string, defaultDaysAhead: number = 7) => {
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        return d.toISOString();
      }
    }
    return new Date(Date.now() + defaultDaysAhead * 86400000).toISOString();
  };

  const parsedDriveDate = safeParseDate(data.drive_date, 7);
  const parsedDeadline = safeParseDate(data.deadline, 5);

  const insertPayload: Record<string, any> = {
    company_name: data.company_name,
    role_title: data.role_title,
    tier: data.tier,
    min_ctc: data.min_ctc,
    max_ctc: data.max_ctc,
    cgpa_cutoff: data.cgpa_cutoff,
    status: data.status || 'SCHEDULED',
    drive_date: parsedDriveDate,
    deadline: parsedDeadline,
    description: data.description || '',
  };

  let { error } = await supabase.from('placement_drives').insert(insertPayload);

  if (error && (error.message.includes('deadline') || error.message.includes('description') || error.message.includes('schema cache'))) {
    delete insertPayload.deadline;
    delete insertPayload.description;
    const retry = await supabase.from('placement_drives').insert(insertPayload);
    error = retry.error;
  }

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/recruiter');
  revalidatePath('/student/drives');
  return { success: true, message: 'Placement drive published successfully!' };
}

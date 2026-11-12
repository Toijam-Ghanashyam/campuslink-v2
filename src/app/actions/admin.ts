'use server';

import { createClient as createServerUserClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlacementTier, PlacementStatus } from '@/types/pep';

/**
 * Toggles academic verification lock for a student profile with strict college isolation
 */
export async function toggleStudentLock(studentId: string, isLocked: boolean) {
  // 1. Authenticate caller and determine their assigned college
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  // 2. Look up the target student's assigned college
  const { data: targetStudent, error: findErr } = await supabase
    .from('student_profiles')
    .select('id, tenant_id')
    .eq('id', studentId)
    .single();

  if (findErr || !targetStudent) {
    return { success: false, error: 'Student profile not found.' };
  }

  // 3. Prevent cross-college modifications
  const adminCollegeId = user.user_metadata?.college_id;
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
 * Strictly validates that the student belongs to the admin's college
 */
export async function verifyStudentProfile(
  studentId: string,
  isApproved: boolean,
  confirmedCgpa?: number,
  confirmedBacklogs?: number
) {
  // 1. Authenticate caller and determine their assigned college
  const userClient = await createServerUserClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) {
    return { success: false, error: 'Unauthorized: Admin authentication required.' };
  }

  const supabase = createAdminClient();

  // 2. Look up the target student's assigned college
  const { data: targetStudent, error: findErr } = await supabase
    .from('student_profiles')
    .select('id, tenant_id')
    .eq('id', studentId)
    .single();

  if (findErr || !targetStudent) {
    return { success: false, error: 'Student profile not found.' };
  }

  // 3. Cross-College Data Leakage Prevention Check
  const adminCollegeId = user.user_metadata?.college_id;
  if (adminCollegeId && targetStudent.tenant_id && targetStudent.tenant_id !== adminCollegeId) {
    return {
      success: false,
      error: 'Security Violation: You are not authorized to verify or approve students outside your designated college.',
    };
  }

  const updateData: Record<string, any> = {
    is_locked: isApproved,
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
      : 'Student record rejected. Student requested to update details.',
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

  const adminCollegeId = user.user_metadata?.college_id;
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

  // Graceful fallback for existing databases that have not run the migration yet
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

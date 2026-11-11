'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlacementTier, PlacementStatus, DriveApprovalStatus } from '@/types/pep';

/**
 * Toggles academic verification lock for a student profile
 */
export async function toggleStudentLock(studentId: string, isLocked: boolean) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('student_profiles')
    .update({ is_locked: isLocked })
    .eq('id', studentId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  return { success: true, message: `Student profile ${isLocked ? 'locked & verified' : 'unlocked'}.` };
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
  const supabase = createAdminClient();

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
 * Recruiter drives default strictly to PENDING approval status.
 * TPO Admins can publish directly as APPROVED.
 */
export async function createPlacementDrive(data: {
  company_name: string;
  role_title: string;
  tier: PlacementTier;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  status?: string;
  drive_date?: string;
  description?: string;
  approval_status?: DriveApprovalStatus;
}) {
  const userClient = await createClient();
  const { data: { user }, error: authErr } = await userClient.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'User session not found. Please log in.' };
  }

  const userRole = (user.user_metadata?.role as string | undefined)?.toUpperCase();
  const isRecruiter = userRole === 'RECRUITER';
  const isAdmin = userRole === 'TPO_ADMIN';

  if (!isRecruiter && !isAdmin) {
    return { success: false, error: 'Unauthorized: Only Recruiters and TPO Admins can create placement drives.' };
  }

  // Enforce approval status rule: Recruiters are always PENDING; Admins default to APPROVED
  const approvalStatus: DriveApprovalStatus = isRecruiter ? 'PENDING' : (data.approval_status || 'APPROVED');
  const createdBy = user.id;

  const supabase = createAdminClient();

  const { error } = await supabase.from('placement_drives').insert({
    company_name: data.company_name,
    role_title: data.role_title,
    tier: data.tier,
    min_ctc: data.min_ctc,
    max_ctc: data.max_ctc,
    cgpa_cutoff: data.cgpa_cutoff,
    status: data.status || 'SCHEDULED',
    approval_status: approvalStatus,
    created_by: createdBy,
    drive_date: data.drive_date || new Date(Date.now() + 7 * 86400000).toISOString(),
    description: data.description || '',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/calendar');
  revalidatePath('/recruiter');
  revalidatePath('/recruiter/calendar');
  revalidatePath('/student/drives');
  revalidatePath('/student/calendar');

  return {
    success: true,
    message: isRecruiter
      ? 'Drive proposal submitted to Placement Cell. Current status: Pending Approval.'
      : 'Placement drive published and scheduled successfully!',
  };
}

/**
 * Approves a placement drive (TPO_ADMIN only)
 */
export async function approvePlacementDrive(driveId: string) {
  const userClient = await createClient();
  const { data: { user }, error: authErr } = await userClient.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'Authentication required.' };
  }

  const userRole = (user.user_metadata?.role as string | undefined)?.toUpperCase();
  if (userRole !== 'TPO_ADMIN') {
    return { success: false, error: 'Unauthorized: Only TPO Administrators can approve placement drives.' };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('placement_drives')
    .update({
      approval_status: 'APPROVED',
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', driveId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/calendar');
  revalidatePath('/recruiter');
  revalidatePath('/recruiter/calendar');
  revalidatePath('/student/drives');
  revalidatePath('/student/calendar');

  return { success: true, message: 'Drive approved successfully and published to students.' };
}

/**
 * Rejects a placement drive with an optional reason (TPO_ADMIN only)
 */
export async function rejectPlacementDrive(driveId: string, reason?: string) {
  const userClient = await createClient();
  const { data: { user }, error: authErr } = await userClient.auth.getUser();

  if (authErr || !user) {
    return { success: false, error: 'Authentication required.' };
  }

  const userRole = (user.user_metadata?.role as string | undefined)?.toUpperCase();
  if (userRole !== 'TPO_ADMIN') {
    return { success: false, error: 'Unauthorized: Only TPO Administrators can reject placement drives.' };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from('placement_drives')
    .update({
      approval_status: 'REJECTED',
      rejection_reason: reason?.trim() || 'Drive rejected by TPO Administration.',
      updated_at: new Date().toISOString(),
    })
    .eq('id', driveId);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/admin/calendar');
  revalidatePath('/recruiter');
  revalidatePath('/recruiter/calendar');
  revalidatePath('/student/drives');
  revalidatePath('/student/calendar');

  return { success: true, message: 'Drive rejected and hidden from students.' };
}


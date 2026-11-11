'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { PlacementTier, PlacementStatus } from '@/types/pep';

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
  description?: string;
}) {
  const supabase = createAdminClient();

  const { error } = await supabase.from('placement_drives').insert({
    company_name: data.company_name,
    role_title: data.role_title,
    tier: data.tier,
    min_ctc: data.min_ctc,
    max_ctc: data.max_ctc,
    cgpa_cutoff: data.cgpa_cutoff,
    status: data.status || 'SCHEDULED',
    drive_date: data.drive_date || new Date(Date.now() + 7 * 86400000).toISOString(),
    description: data.description || '',
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/admin');
  revalidatePath('/recruiter');
  revalidatePath('/student/drives');
  return { success: true, message: 'Placement drive published successfully!' };
}

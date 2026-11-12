'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { evaluateEligibility } from '@/lib/pep-engine';
import { normalizeSkills } from '@/lib/compatibility-matcher';
import { revalidatePath } from 'next/cache';

/**
 * Validates eligibility against PEP engine and registers student for drive
 */
export async function applyToPlacementDrive(driveId: string) {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: 'User must be authenticated.' };
  }

  // 2. Fetch student profile
  const { data: student, error: studentError } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (studentError || !student) {
    return { success: false, error: 'Student profile not found or incomplete.' };
  }

  // 3. Fetch drive details
  const { data: drive, error: driveError } = await supabase
    .from('placement_drives')
    .select('*')
    .eq('id', driveId)
    .single();

  if (driveError || !drive) {
    return { success: false, error: 'Placement drive not found.' };
  }

  // 4. Check if already applied
  const { data: existingApp } = await supabase
    .from('drive_applications')
    .select('id')
    .eq('drive_id', driveId)
    .eq('student_id', student.id)
    .maybeSingle();

  if (existingApp) {
    return { success: false, error: 'You have already applied to this drive.' };
  }

  // 5. Evaluate with PEP Engine
  const evaluation = evaluateEligibility(student, drive);
  if (!evaluation.eligible) {
    return {
      success: false,
      error: evaluation.reasons.join(' | '),
    };
  }

  // 6. Insert Application
  const { error: insertError } = await supabase
    .from('drive_applications')
    .insert({
      drive_id: drive.id,
      student_id: student.id,
      stage: 'APPLIED',
      offer_status: 'PENDING',
    });

  if (insertError) {
    return { success: false, error: insertError.message };
  }

  revalidatePath('/student/drives');
  return { success: true, message: 'Application submitted successfully!' };
}

/**
 * Handles Offer Acceptance and auto-revocation of lower/equal applications
 */
export async function acceptOffer(applicationId: string) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized.' };

  // 1. Fetch Application with Drive info
  const { data: application, error: appError } = await supabase
    .from('drive_applications')
    .select('id, student_id, offer_ctc, placement_drives ( tier )')
    .eq('id', applicationId)
    .single();

  if (appError || !application) {
    return { success: false, error: 'Application record not found.' };
  }

  const driveTier = (application.placement_drives as any).tier;
  const newStatus = 
    driveTier === 'TIER_1' ? 'PLACED_TIER_1' :
    driveTier === 'TIER_2' ? 'PLACED_TIER_2' : 'PLACED_TIER_3';

  // 2. Mark this application accepted
  const { error: updateAppErr } = await supabase
    .from('drive_applications')
    .update({ offer_status: 'ACCEPTED' })
    .eq('id', applicationId);

  if (updateAppErr) return { success: false, error: updateAppErr.message };

  // 3. Update student profile status & CTC
  await supabase
    .from('student_profiles')
    .update({
      placement_status: newStatus,
      current_highest_ctc: application.offer_ctc || 0,
    })
    .eq('id', application.student_id);

  // 4. Revoke active applications if student hit Tier 1 or debarred
  if (newStatus === 'PLACED_TIER_1') {
    await supabase
      .from('drive_applications')
      .update({ offer_status: 'AUTO_REVOKED', stage: 'REJECTED' })
      .eq('student_id', application.student_id)
      .neq('id', applicationId)
      .in('offer_status', ['PENDING']);
  }

  revalidatePath('/student/drives');
  return { success: true, message: `Offer accepted! Status upgraded to ${newStatus}.` };
}

/**
 * Updates a student's resume skills in student_profiles and auth metadata
 */
export async function updateStudentSkills(newSkills: string[]) {
  const supabase = await createClient();
  const adminSupabase = createAdminClient();

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) {
    return { success: false, error: 'User must be authenticated.' };
  }

  const normalized = normalizeSkills(newSkills);

  // 1. Update user_metadata in auth.users
  try {
    await adminSupabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        skills: normalized,
      },
    });
  } catch (err) {
    console.warn('Failed to update auth user_metadata skills:', err);
  }

  // 2. Update student_profiles if table column exists
  try {
    const { error: profileErr } = await supabase
      .from('student_profiles')
      .update({ skills: normalized })
      .eq('user_id', user.id);

    if (profileErr && !profileErr.message.includes('skills')) {
      console.warn('Profile skills update error:', profileErr);
    }
  } catch (err) {
    console.warn('Student profiles table update warning:', err);
  }

  revalidatePath('/student');
  revalidatePath('/student/drives');
  return { success: true, skills: normalized };
}



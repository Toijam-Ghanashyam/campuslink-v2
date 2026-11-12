'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { synthesizeRoadmapAI } from '@/lib/roadmap-generator';
import { revalidatePath } from 'next/cache';

export async function pregenerateRoadmapOnRejection(applicationId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Check if roadmap already exists
    const { data: existing } = await supabase
      .from('candidate_roadmaps')
      .select('id')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (existing) return;

    // 2. Fetch application with drive and student info
    const { data: app } = await supabase
      .from('drive_applications')
      .select('id, student_id, ai_feedback_summary, placement_drives(company_name, role_title), student_profiles(verified_cgpa, branch)')
      .eq('id', applicationId)
      .maybeSingle();

    if (!app || !app.placement_drives) return;

    const drives: any = app.placement_drives;
    const profiles: any = app.student_profiles;

    // 3. Synthesize via ultra-fast Gemini chain (<4s)
    const parsed = await synthesizeRoadmapAI({
      targetCompany: drives.company_name || 'Enterprise Campus Partner',
      targetRole: drives.role_title || 'Software Development Engineer',
      feedback: app.ai_feedback_summary || 'Screening evaluated core CS fundamentals and practical depth.',
      verifiedCgpa: profiles?.verified_cgpa || 7.5,
      branch: profiles?.branch || 'Computer Science & Engineering',
    });

    if (parsed && parsed.milestones) {
      await supabase.from('candidate_roadmaps').insert({
        student_id: app.student_id,
        application_id: applicationId,
        company_name: drives.company_name || 'Enterprise Campus Partner',
        role_title: drives.role_title || 'Software Development Engineer',
        target_role: drives.role_title || 'Software Development Engineer',
        total_duration_weeks: parsed.totalDurationWeeks || 8,
        missing_skills: parsed.missingSkills || [],
        milestones: parsed.milestones || [],
      });
    }
  } catch (err) {
    console.warn('[WarRoom] Background roadmap pre-generation non-critical notice:', err);
  }
}

export async function advanceCandidateStage(
  applicationId: string,
  newStage: string,
  panelRoom?: string,
  offeredCtc?: number
) {
  const supabase = createAdminClient();

  const updatePayload: Record<string, any> = {
    stage: newStage,
  };

  if (offeredCtc !== undefined && offeredCtc > 0) {
    updatePayload.offer_ctc = offeredCtc;
    updatePayload.offer_status = 'PENDING';
  }

  // If a room/panel instruction is provided, prefix or store in feedback summary
  if (panelRoom) {
    updatePayload.ai_feedback_summary = `[DISPATCH ALERT]: Please report immediately to ${panelRoom}.`;
  }

  const { error } = await supabase
    .from('drive_applications')
    .update(updatePayload)
    .eq('id', applicationId);

  if (error) {
    return { success: false, error: error.message };
  }

  // When rejected, pre-generate remediation roadmap in background for 0-second student load
  if (newStage === 'REJECTED') {
    pregenerateRoadmapOnRejection(applicationId);
  }

  revalidatePath('/recruiter/war-room');
  return { success: true };
}

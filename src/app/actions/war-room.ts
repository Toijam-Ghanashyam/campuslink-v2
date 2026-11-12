'use server';

import { createAdminClient } from '@/lib/supabase/server';
import { synthesizeRoadmapAI } from '@/lib/roadmap-generator';
import { revalidatePath } from 'next/cache';

async function pregenerateRoadmapOnRejection(applicationId: string) {
  try {
    const supabase = createAdminClient();

    // 1. Check if roadmap already exists
    const { data: existing } = await supabase
      .from('candidate_roadmaps')
      .select('id')
      .eq('application_id', applicationId)
      .maybeSingle();

    if (existing) return;

    // 2. Fetch application with drive, student info, and PRI vector deltas
    const { data: app } = await supabase
      .from('drive_applications')
      .select(`
        id,
        student_id,
        ai_feedback_summary,
        pri_score,
        e_academic,
        e_practical,
        e_eval,
        cosine_similarity,
        student_skill_vector,
        skill_gap_delta,
        placement_drives (
          company_name,
          role_title,
          pri_threshold,
          role_skill_vector
        ),
        student_profiles (
          verified_cgpa,
          branch
        )
      `)
      .eq('id', applicationId)
      .maybeSingle();

    if (!app || !app.placement_drives) return;

    const drives: any = app.placement_drives;
    const profiles: any = app.student_profiles;

    // 3. Synthesize via ultra-fast Gemini chain (<4s) informed by PRI skill gap vectors
    const parsed = await synthesizeRoadmapAI({
      targetCompany: drives.company_name || 'Enterprise Campus Partner',
      targetRole: drives.role_title || 'Software Development Engineer',
      feedback: app.ai_feedback_summary || 'Screening evaluated core CS fundamentals and practical depth.',
      verifiedCgpa: profiles?.verified_cgpa || 7.5,
      branch: profiles?.branch || 'Computer Science & Engineering',
      skillGapDelta: app.skill_gap_delta || undefined,
      priScore: app.pri_score !== undefined && app.pri_score !== null ? Number(app.pri_score) : undefined,
    });

    if (parsed && parsed.milestones) {
      const priSnapshot = {
        priScore: app.pri_score,
        threshold: drives?.pri_threshold || 70,
        belowThreshold: (app.pri_score || 0) < (drives?.pri_threshold || 70),
        eAcademic: app.e_academic,
        ePractical: app.e_practical,
        eEval: app.e_eval,
        cosineSimilarity: app.cosine_similarity,
        studentVector: app.student_skill_vector,
        roleVector: drives?.role_skill_vector,
        vectorDelta: app.skill_gap_delta,
      };

      const roadmapPayload: Record<string, any> = {
        student_id: app.student_id,
        application_id: applicationId,
        company_name: drives.company_name || 'Enterprise Campus Partner',
        role_title: drives.role_title || 'Software Development Engineer',
        target_role: drives.role_title || 'Software Development Engineer',
        total_duration_weeks: parsed.totalDurationWeeks || 8,
        missing_skills: parsed.missingSkills || [],
        milestones: parsed.milestones || [],
        pri_snapshot: priSnapshot,
      };

      const { error: insertErr } = await supabase.from('candidate_roadmaps').insert(roadmapPayload);
      if (insertErr && insertErr.message.includes('pri_snapshot')) {
        delete roadmapPayload.pri_snapshot;
        await supabase.from('candidate_roadmaps').insert(roadmapPayload);
      }
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

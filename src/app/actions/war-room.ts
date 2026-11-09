'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function advanceCandidateStage(
  applicationId: string,
  newStage: string,
  panelRoom?: string,
  offeredCtc?: number
) {
  const supabase = await createClient();

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

  revalidatePath('/recruiter/war-room');
  return { success: true };
}


import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import {
  gradeParagraphAnswers,
  calculateIntegrityScore,
  computeReadinessStatus,
} from '@/lib/readiness-evaluator';
import {
  AssessmentPayload,
  MCQReviewItem,
  AssessmentResult,
} from '@/types/readiness';
import { IN_MEMORY_ASSESSMENT_CACHE } from '../start/route';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Authentication required. Please sign in.' }, { status: 401 });
    }

    const body = await req.json();
    const {
      assessmentId,
      mcqAnswers = {},
      paragraphAnswers = {},
      keystrokeTelemetry = {},
      proctoringLogs = [],
      snapshots = [],
    } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required for submission.' }, { status: 400 });
    }

    // 1. Fetch Assessment record from DB or in-memory cache
    let assessmentRecord: any = null;
    try {
      const { data: dbData } = await adminSupabase
        .from('readiness_assessments')
        .select('*')
        .eq('id', assessmentId)
        .maybeSingle();
      if (dbData) {
        assessmentRecord = dbData;
      }
    } catch (e) {
      console.warn('[readiness/submit] DB fetch warning:', e);
    }

    if (!assessmentRecord && IN_MEMORY_ASSESSMENT_CACHE.has(assessmentId)) {
      assessmentRecord = IN_MEMORY_ASSESSMENT_CACHE.get(assessmentId);
    }

    if (!assessmentRecord) {
      return NextResponse.json(
        { error: 'Assessment session not found or expired. Please re-take the readiness test.' },
        { status: 404 }
      );
    }

    const questionsPayload: AssessmentPayload = assessmentRecord.questions_payload;
    const mcqs = questionsPayload.mcqs || [];
    const paragraphs = questionsPayload.paragraphs || [];

    // 2. Deterministic Grading for 8 MCQs (10 points each = 80 points)
    let mcqScore = 0;
    const mcqReview: MCQReviewItem[] = mcqs.map((m) => {
      const selected = mcqAnswers[m.id] !== undefined ? Number(mcqAnswers[m.id]) : null;
      const correct = typeof m.correctOptionIndex === 'number' ? m.correctOptionIndex : 0;
      const isCorrect = selected === correct;

      if (isCorrect) {
        mcqScore += m.points || 10;
      }

      return {
        id: m.id,
        question: m.question,
        options: m.options,
        selectedOption: selected,
        correctOption: correct,
        isCorrect,
        explanation: m.explanation || 'Evaluated based on standard engineering specifications.',
        skill: m.skill,
      };
    });

    // 3. AI Grading for 2 Scenario Paragraph Questions (10 points each = 20 points)
    const {
      score: paragraphScore,
      items: paragraphFeedback,
      aiSummary,
    } = await gradeParagraphAnswers({
      questions: paragraphs,
      answers: paragraphAnswers,
      telemetry: keystrokeTelemetry,
    });

    // 4. Calculate Proctoring Integrity Score (0 - 100%)
    const { integrityScore, penalties } = calculateIntegrityScore(proctoringLogs, keystrokeTelemetry);

    // 5. Total Readiness Score (0 - 100)
    const totalScore = Math.min(100, Math.max(0, Math.round(mcqScore + paragraphScore)));
    const readinessStatus = computeReadinessStatus(totalScore);

    // 6. Handle Snapshots (upload to Supabase Storage if bucket exists, or keep base64 data)
    let savedSnapshotUrls: string[] = [];
    if (Array.isArray(snapshots) && snapshots.length > 0) {
      for (let i = 0; i < snapshots.length; i++) {
        const snap = snapshots[i];
        if (typeof snap === 'string' && snap.startsWith('data:image')) {
          try {
            const base64Data = snap.replace(/^data:image\/\w+;base64,/, '');
            const buffer = Buffer.from(base64Data, 'base64');
            const filePath = `${user.id}/${assessmentId}_snapshot_${i + 1}.jpg`;

            const { data: uploadData, error: uploadErr } = await adminSupabase.storage
              .from('proctoring-snapshots')
              .upload(filePath, buffer, {
                contentType: 'image/jpeg',
                upsert: true,
              });

            if (!uploadErr && uploadData?.path) {
              const { data: publicUrlData } = adminSupabase.storage
                .from('proctoring-snapshots')
                .getPublicUrl(uploadData.path);
              savedSnapshotUrls.push(publicUrlData.publicUrl);
            } else {
              savedSnapshotUrls.push(snap); // fallback to raw data
            }
          } catch (snapErr) {
            savedSnapshotUrls.push(snap);
          }
        } else if (typeof snap === 'string') {
          savedSnapshotUrls.push(snap);
        }
      }
    }

    const completedAt = new Date().toISOString();

    // 7. Update Readiness Assessment Record in DB
    try {
      await adminSupabase
        .from('readiness_assessments')
        .update({
          mcq_score: mcqScore,
          paragraph_score: paragraphScore,
          total_score: totalScore,
          integrity_score: integrityScore,
          student_answers: { mcqAnswers, paragraphAnswers },
          keystroke_telemetry: keystrokeTelemetry,
          proctoring_logs: proctoringLogs,
          snapshot_urls: savedSnapshotUrls,
          ai_evaluation_summary: aiSummary,
          status: 'COMPLETED',
          completed_at: completedAt,
        })
        .eq('id', assessmentId);
    } catch (err) {
      console.warn('[readiness/submit] Assessment update warning:', err);
    }

    // 8. Update student_profiles record with the latest scores
    try {
      await adminSupabase
        .from('student_profiles')
        .update({
          readiness_score: totalScore,
          readiness_integrity_score: integrityScore,
          readiness_status: readinessStatus,
          last_readiness_test_at: completedAt,
        })
        .eq('user_id', user.id);
    } catch (profErr) {
      console.warn('[readiness/submit] Student profiles update warning:', profErr);
    }

    const resultPayload: AssessmentResult = {
      assessmentId,
      mcqScore,
      paragraphScore,
      totalScore,
      integrityScore,
      readinessStatus,
      summary: aiSummary,
      paragraphFeedback,
      mcqReview,
      penalties,
      completedAt,
    };

    return NextResponse.json({
      success: true,
      result: resultPayload,
    });
  } catch (err: any) {
    console.error('Error in /api/readiness/submit:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to submit and grade readiness assessment' },
      { status: 500 }
    );
  }
}


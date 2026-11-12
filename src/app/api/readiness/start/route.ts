import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { generateReadinessQuestions } from '@/lib/readiness-evaluator';
import { MCQQuestion, ParagraphQuestion } from '@/types/readiness';

// Global in-memory fallback cache to ensure assessment sessions are shared across Next.js worker evaluations
const globalForAssessment = globalThis as unknown as {
  campuslinkAssessmentCache?: Map<string, any>;
};

export const IN_MEMORY_ASSESSMENT_CACHE =
  globalForAssessment.campuslinkAssessmentCache ?? new Map<string, any>();

globalForAssessment.campuslinkAssessmentCache = IN_MEMORY_ASSESSMENT_CACHE;

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

    // 1. Fetch student's profile and skills
    const { data: student } = await adminSupabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    let studentSkills: string[] = [];
    if (user.user_metadata?.skills && Array.isArray(user.user_metadata.skills) && user.user_metadata.skills.length > 0) {
      studentSkills = user.user_metadata.skills;
    }

    const branch = student?.branch || 'Computer Science & Engineering';

    // 2. Generate 8 MCQs (80 pts) + 2 Scenario Paragraph Questions (20 pts)
    const questionsPayload = await generateReadinessQuestions(studentSkills, branch);

    // 3. Save full assessment record in DB
    const assessmentId = crypto.randomUUID();
    const skillsTested = studentSkills.length > 0 ? studentSkills : ['Algorithms', 'Databases', 'System Design', 'Networks'];

    const dbRecord = {
      id: assessmentId,
      student_id: user.id,
      skills_tested: skillsTested,
      questions_payload: questionsPayload,
      student_answers: {},
      keystroke_telemetry: {},
      mcq_score: 0,
      paragraph_score: 0,
      total_score: 0,
      integrity_score: 100,
      proctoring_logs: [],
      snapshot_urls: [],
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
    };

    try {
      const { error: insertErr } = await adminSupabase
        .from('readiness_assessments')
        .insert(dbRecord);

      if (insertErr) {
        console.warn('[readiness/start] DB insert warning (table may be pending migration):', insertErr.message);
      }
    } catch (dbErr) {
      console.warn('[readiness/start] DB insert caught:', dbErr);
    }

    // Cache record in memory for ultra-fast validation during submission
    IN_MEMORY_ASSESSMENT_CACHE.set(assessmentId, dbRecord);

    // 4. Sanitize payload for client: strip out correct answers and explanations
    const sanitizedMcqs = questionsPayload.mcqs.map((m: MCQQuestion) => ({
      id: m.id,
      question: m.question,
      options: m.options,
      skill: m.skill,
      points: m.points || 10,
    }));

    const sanitizedParagraphs = questionsPayload.paragraphs.map((p: ParagraphQuestion) => ({
      id: p.id,
      question: p.question,
      scenarioContext: p.scenarioContext,
      skill: p.skill,
      points: p.points || 10,
    }));

    // Generate signed/base64 session token so submission grading never fails even across server restarts
    const sessionToken = Buffer.from(
      JSON.stringify({
        assessmentId,
        studentId: user.id,
        questionsPayload,
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      assessmentId,
      sessionToken,
      skillsTested,
      studentName: student?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0],
      mcqs: sanitizedMcqs,
      paragraphs: sanitizedParagraphs,
      totalAvailablePoints: 100,
    });
  } catch (err: any) {
    console.error('Error in /api/readiness/start:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to initialize proctored assessment session' },
      { status: 500 }
    );
  }
}



import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { synthesizeRoadmapAI } from '@/lib/roadmap-generator';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    const { data: student } = await supabase
      .from('student_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!student) {
      return NextResponse.json({ roadmaps: [] });
    }

    let query = supabase
      .from('candidate_roadmaps')
      .select('*')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });

    if (applicationId) {
      query = query.eq('application_id', applicationId);
    }

    const { data: roadmaps, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ roadmaps: roadmaps || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Authenticate user
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Fetch student profile
    const { data: student, error: studentErr } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (studentErr || !student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    const body = await req.json();
    const { applicationId, companyName, roleTitle, feedbackSummary, missingSkills, forceRegenerate } = body;

    let targetCompany = companyName || 'Technology Enterprise';
    let targetRole = roleTitle || 'Software Development Engineer';
    let feedback = feedbackSummary || '';

    let parsedMissingSkills: string[] = [];
    if (Array.isArray(missingSkills)) {
      parsedMissingSkills = missingSkills.map((s: any) => String(s).trim()).filter(Boolean);
    } else if (typeof missingSkills === 'string' && missingSkills.trim()) {
      parsedMissingSkills = missingSkills.split(',').map((s: string) => s.trim()).filter(Boolean);
    }

    // 3. Multi-Level Database Cache Lookup (Instant 0-second hit)
    if (!forceRegenerate && parsedMissingSkills.length === 0) {
      // Level A: Exact Application ID match (only if not requesting a different custom company/role)
      if (applicationId && !companyName) {
        const { data: existingAppRoadmap } = await supabase
          .from('candidate_roadmaps')
          .select('*')
          .eq('application_id', applicationId)
          .eq('student_id', student.id)
          .maybeSingle();

        if (existingAppRoadmap) {
          return NextResponse.json({ success: true, roadmap: existingAppRoadmap, cached: true });
        }

        // Fetch application details if not passed explicitly
        const { data: appData } = await supabase
          .from('drive_applications')
          .select('*, placement_drives(*)')
          .eq('id', applicationId)
          .maybeSingle();

        if (appData) {
          if (appData.placement_drives) {
            targetCompany = appData.placement_drives.company_name;
            targetRole = appData.placement_drives.role_title;
          }
          if (appData.ai_feedback_summary) {
            feedback = appData.ai_feedback_summary;
          }
        }
      }

      // Level B: Target Company + Role match created recently for this student
      const { data: existingRoleRoadmap } = await supabase
        .from('candidate_roadmaps')
        .select('*')
        .eq('student_id', student.id)
        .eq('company_name', targetCompany)
        .eq('role_title', targetRole)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (existingRoleRoadmap) {
        return NextResponse.json({ success: true, roadmap: existingRoleRoadmap, cached: true });
      }
    }

    // 4. Synthesize via high-speed Gemini chain (gemini-3.1-flash-lite: ~3.8s)
    const parsedResponse = await synthesizeRoadmapAI({
      targetCompany,
      targetRole,
      feedback,
      missingSkills: parsedMissingSkills,
      verifiedCgpa: student.verified_cgpa || 7.5,
      branch: student.branch || 'Computer Science & Engineering',
    });

    if (!parsedResponse || !parsedResponse.milestones) {
      return NextResponse.json({ error: 'Failed to generate roadmap content from AI engine' }, { status: 500 });
    }

    const finalMissingSkills =
      parsedMissingSkills.length > 0
        ? parsedMissingSkills
        : parsedResponse.missingSkills || [];

    // 5. Persist generated roadmap into candidate_roadmaps table
    const { data: insertedRoadmap, error: insertErr } = await supabase
      .from('candidate_roadmaps')
      .insert({
        student_id: student.id,
        application_id: applicationId || null,
        company_name: targetCompany,
        role_title: targetRole,
        target_role: targetRole,
        total_duration_weeks: parsedResponse.totalDurationWeeks || 8,
        missing_skills: finalMissingSkills,
        milestones: parsedResponse.milestones || [],
      })
      .select('*')
      .single();

    if (insertErr) {
      console.error('Failed to persist candidate roadmap:', insertErr);
      return NextResponse.json({
        success: true,
        roadmap: {
          id: 'temp-' + Date.now(),
          studentId: student.id,
          applicationId,
          companyName: targetCompany,
          roleTitle: targetRole,
          targetRole,
          totalDurationWeeks: parsedResponse.totalDurationWeeks,
          missingSkills: parsedResponse.missingSkills,
          milestones: parsedResponse.milestones,
          createdAt: new Date().toISOString(),
        },
        cached: false,
      });
    }

    return NextResponse.json({
      success: true,
      roadmap: insertedRoadmap,
      cached: false,
    });
  } catch (error: any) {
    console.error('Roadmap Generation Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error while generating roadmap' },
      { status: 500 }
    );
  }
}

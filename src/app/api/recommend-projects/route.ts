import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { calculateJobCompatibility } from '@/lib/compatibility-matcher';
import { generateTailoredProjects } from '@/lib/project-recommender';
import { evaluatePortfolioSuitabilityForDrive } from '@/lib/portfolio-matcher';
import { StudentProject } from '@/types/projects';

// In-memory fallback cache in case Supabase drive_project_recommendations table is pending migration
const globalForRecs = globalThis as unknown as {
  campuslinkProjectRecsCache?: Map<string, any>;
};
const IN_MEMORY_RECS_CACHE =
  globalForRecs.campuslinkProjectRecsCache ?? new Map<string, any>();
globalForRecs.campuslinkProjectRecsCache = IN_MEMORY_RECS_CACHE;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Authenticate student
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json(
        { error: 'Authentication required. Please sign in.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { driveId } = body;

    if (!driveId) {
      return NextResponse.json(
        { error: 'driveId is required to generate project recommendations.' },
        { status: 400 }
      );
    }

    // 2. Fetch student profile and placement drive
    const [profileRes, driveRes] = await Promise.all([
      adminSupabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle(),
      adminSupabase
        .from('placement_drives')
        .select('*')
        .eq('id', driveId)
        .single(),
    ]);

    const profile = profileRes.data;
    const drive = driveRes.data;

    if (!drive) {
      return NextResponse.json(
        { error: 'Placement drive not found.' },
        { status: 404 }
      );
    }

    // 3. Extract skills and projects (supporting user_metadata fallback)
    const userMeta = user.user_metadata || {};
    let studentSkills: string[] = [];
    if (Array.isArray(profile?.skills) && profile.skills.length > 0) {
      studentSkills = profile.skills;
    } else if (Array.isArray(userMeta.skills) && userMeta.skills.length > 0) {
      studentSkills = userMeta.skills;
    }

    let existingProjects: StudentProject[] = [];
    if (Array.isArray(profile?.projects) && profile.projects.length > 0) {
      existingProjects = profile.projects;
    } else if (Array.isArray(userMeta.projects) && userMeta.projects.length > 0) {
      existingProjects = userMeta.projects;
    }

    // 4. Calculate Job Compatibility to determine matched & missing skills
    const compatibility = calculateJobCompatibility(
      drive,
      studentSkills,
      profile?.verified_cgpa ?? 7.5,
      profile?.active_backlogs ?? 0
    );

    const matchedSkills = compatibility.matchedSkills;
    const missingSkills = compatibility.missingSkills;

    // 5. Evaluate portfolio suitability for this specific drive
    const portfolioSuitability = evaluatePortfolioSuitabilityForDrive(
      existingProjects,
      drive,
      compatibility
    );

    // 6. Generate cache hash based on driveId + sorted missing skills
    const sortedMissing = [...missingSkills].sort().map((s) => s.toLowerCase()).join('|');
    const skillGapHash = crypto
      .createHash('sha256')
      .update(`${driveId}::${sortedMissing}`)
      .digest('hex')
      .slice(0, 24);

    const memoryKey = `${driveId}_${skillGapHash}`;

    // Check PostgreSQL cache table
    try {
      const { data: cachedRow } = await adminSupabase
        .from('drive_project_recommendations')
        .select('*')
        .eq('drive_id', driveId)
        .eq('skill_gap_hash', skillGapHash)
        .maybeSingle();

      if (cachedRow?.recommendations) {
        const payload = cachedRow.recommendations;
        const projects = Array.isArray(payload.recommendedProjects)
          ? payload.recommendedProjects
          : Array.isArray(payload)
          ? payload
          : [];

        return NextResponse.json({
          success: true,
          portfolioSuitability,
          hasProjects: existingProjects.length > 0,
          existingProjects,
          matchedSkills,
          missingSkills,
          projects,
          reasoning: payload.skillGapReasoning || '',
          cached: true,
        });
      }
    } catch (dbErr) {
      console.warn('[recommend-projects] DB cache read notice:', dbErr);
    }

    // Check in-memory cache
    if (IN_MEMORY_RECS_CACHE.has(memoryKey)) {
      const cachedPayload = IN_MEMORY_RECS_CACHE.get(memoryKey);
      return NextResponse.json({
        success: true,
        portfolioSuitability,
        hasProjects: existingProjects.length > 0,
        existingProjects,
        matchedSkills,
        missingSkills,
        projects: cachedPayload.recommendedProjects || [],
        reasoning: cachedPayload.skillGapReasoning || '',
        cached: true,
      });
    }

    // 7. Generate tailored project blueprints using Groq Open-Weight LLMs
    const aiResult = await generateTailoredProjects({
      companyName: drive.company_name,
      roleTitle: drive.role_title,
      jobDescription: drive.description || '',
      matchedSkills,
      missingSkills,
      existingProjects,
    });

    // Store in memory cache
    IN_MEMORY_RECS_CACHE.set(memoryKey, aiResult);

    // Persist in DB cache table if it exists
    try {
      await adminSupabase.from('drive_project_recommendations').upsert(
        {
          drive_id: driveId,
          skill_gap_hash: skillGapHash,
          recommendations: aiResult,
        },
        { onConflict: 'drive_id,skill_gap_hash' }
      );
    } catch (cacheErr) {
      console.warn('[recommend-projects] DB cache write notice (table may be pending migration):', cacheErr);
    }

    return NextResponse.json({
      success: true,
      portfolioSuitability,
      hasProjects: existingProjects.length > 0,
      existingProjects,
      matchedSkills,
      missingSkills,
      projects: aiResult.recommendedProjects,
      reasoning: aiResult.skillGapReasoning,
      cached: false,
    });
  } catch (err: any) {
    console.error('Error in /api/recommend-projects:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate tailored project blueprints.' },
      { status: 500 }
    );
  }
}


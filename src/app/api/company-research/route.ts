import { NextRequest, NextResponse } from 'next/server';
import { fetchCompanyResearch } from '@/api/companyResearch';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { companyName, role = 'Software Engineer', studentSkills = [], requiredSkills = [], forceRefresh = false } = body;

    if (!companyName) {
      return NextResponse.json(
        { error: 'Company name is required.' },
        { status: 400 }
      );
    }

    const dossier = await fetchCompanyResearch(companyName, role, {
      forceRefresh,
      studentSkills,
      requiredSkills,
    });

    return NextResponse.json({
      success: true,
      dossier,
    });
  } catch (error: any) {
    console.error('Error in /api/company-research route:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch company research.' },
      { status: 500 }
    );
  }
}

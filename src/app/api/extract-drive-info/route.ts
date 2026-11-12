import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleGenAI } from '@google/genai';
import { sanitizeResumeText } from '@/lib/sanitizer';
import { PlacementTier } from '@/types/pep';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface ExtractedDriveInfo {
  company_name: string;
  role_title: string;
  tier: PlacementTier;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  drive_date: string;
  deadline: string;
  required_skills: string[];
  eligible_branches: string[];
  description: string;
}

function inferTierFromCtc(maxCtc: number): PlacementTier {
  if (maxCtc >= 15) return 'TIER_1';
  if (maxCtc >= 7) return 'TIER_2';
  return 'TIER_3';
}

function regexFallbackExtract(
  text: string,
  targetRoleHint: string,
  companyHint: string
): ExtractedDriveInfo {
  const cgpaMatch = text.match(/(?:cgpa|gpa|cutoff)[^0-9]{0,15}([0-9](?:\.[0-9]{1,2})?)/i);
  const ctcMatches = [...text.matchAll(/([0-9]{1,2}(?:\.[0-9]{1,2})?)\s*(?:lpa|lakhs)/gi)].map((m) =>
    parseFloat(m[1])
  );

  const minCtc = ctcMatches.length > 0 ? Math.min(...ctcMatches) : 8;
  const maxCtc = ctcMatches.length > 1 ? Math.max(...ctcMatches) : minCtc > 0 ? minCtc : 12;
  const cgpa = cgpaMatch ? Math.min(10, Math.max(0, parseFloat(cgpaMatch[1]))) : 7.0;

  const defaultDriveDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const defaultDeadline = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

  return {
    company_name: companyHint || 'Enterprise Hiring Partner',
    role_title: targetRoleHint || 'Software Development Engineer',
    tier: inferTierFromCtc(maxCtc),
    min_ctc: minCtc,
    max_ctc: maxCtc,
    cgpa_cutoff: cgpa,
    drive_date: defaultDriveDate,
    deadline: defaultDeadline,
    required_skills: ['Data Structures & Algorithms', 'Problem Solving', 'Full-Stack / Backend'],
    eligible_branches: ['CSE', 'IT', 'ECE'],
    description: text.slice(0, 350).replace(/\s+/g, ' ').trim(),
  };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated user
    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();
    if (authErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const targetRole = ((formData.get('target_role') as string) || '').trim();
    const companyHint = ((formData.get('company_name') as string) || '').trim();

    if (!file || typeof file === 'string') {
      return NextResponse.json(
        { error: 'Please upload a valid JD file (.pdf, .txt, or .md).' },
        { status: 400 }
      );
    }

    const fileName = file.name ? file.name.toLowerCase() : '';
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');

    const defaultDriveDate = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
    const defaultDeadline = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    // 2. Structured Prompt for Gemini extraction
    const prompt = `You are an enterprise campus placement coordinator AI.
Extract structured placement drive details from the provided Job Description / Recruitment Notification document.
${targetRole ? `IMPORTANT ROLE FILTER: The recruiter specifically wants to extract information for the role: "${targetRole}". Focus on the eligibility, CTC, skills, and description for "${targetRole}" if multiple roles exist in the document.` : 'Extract the primary engineering/graduate hiring role described in the document.'}
${companyHint ? `Company Name Hint: "${companyHint}"` : ''}

Classification Rules:
- "tier":
  - "TIER_1" if max_ctc >= 15 LPA or top tier product/dream company
  - "TIER_2" if max_ctc is between 7 and 14.99 LPA
  - "TIER_3" if max_ctc < 7 LPA
- "min_ctc" and "max_ctc": numeric values in LPA (Lakhs Per Annum). If only a single CTC is mentioned (e.g., 12 LPA), set both min_ctc and max_ctc to 12. If stipend/monthly is given, convert to annual LPA. Default to 8 and 12 if unspecified.
- "cgpa_cutoff": numeric value on a 10-point scale (e.g. 7.0, 7.5, 8.0). If percentage is given (e.g. 70%), convert to CGPA (7.0). Default to 7.0 if unspecified.
- "drive_date": YYYY-MM-DD format if mentioned, otherwise "${defaultDriveDate}".
- "deadline": YYYY-MM-DD format if mentioned, otherwise "${defaultDeadline}".
- "description": A crisp, professional 2-3 sentence summary covering key responsibilities, hiring rounds, and core stack.

Respond ONLY with a valid JSON object matching this schema without markdown fences:
{
  "company_name": "string",
  "role_title": "string",
  "tier": "TIER_1" | "TIER_2" | "TIER_3",
  "min_ctc": number,
  "max_ctc": number,
  "cgpa_cutoff": number,
  "drive_date": "YYYY-MM-DD",
  "deadline": "YYYY-MM-DD",
  "required_skills": ["string"],
  "eligible_branches": ["string"],
  "description": "string"
}`;

    const geminiModels = [
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.8-flash',
    ];
    let parsedData: Partial<ExtractedDriveInfo> | null = null;
    let fallbackText = '';

    if (isPdf) {
      // Ingest PDF natively via base64 - 100% reliable in Next.js without fake worker bugs
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Pdf = buffer.toString('base64');

      for (const modelName of geminiModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Pdf,
                },
              },
              prompt,
            ],
          });

          if (response?.text) {
            const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleaned);
            if (parsedData && (parsedData.company_name || parsedData.role_title)) {
              break;
            }
          }
        } catch (err) {
          console.warn(`[ExtractDriveInfo PDF] Model ${modelName} failed, switching to backup:`, err);
        }
      }
    } else {
      // Plain text or Markdown file
      const rawText = await file.text();
      fallbackText = sanitizeResumeText(rawText);

      const textPrompt = `${prompt}\n\nDocument Text:\n"""\n${fallbackText}\n"""`;

      for (const modelName of geminiModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: textPrompt,
          });

          if (response?.text) {
            const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleaned);
            if (parsedData && (parsedData.company_name || parsedData.role_title)) {
              break;
            }
          }
        } catch (err) {
          console.warn(`[ExtractDriveInfo Text] Model ${modelName} failed, switching to backup:`, err);
        }
      }
    }

    const fallback = regexFallbackExtract(fallbackText || targetRole || companyHint, targetRole, companyHint);

    const minCtc = Number(parsedData?.min_ctc) > 0 ? Number(parsedData?.min_ctc) : fallback.min_ctc;
    const maxCtc =
      Number(parsedData?.max_ctc) >= minCtc
        ? Number(parsedData?.max_ctc)
        : Math.max(minCtc, fallback.max_ctc);

    const validTier: PlacementTier =
      parsedData?.tier === 'TIER_1' || parsedData?.tier === 'TIER_2' || parsedData?.tier === 'TIER_3'
        ? parsedData.tier
        : inferTierFromCtc(maxCtc);

    const skills =
      Array.isArray(parsedData?.required_skills) && parsedData!.required_skills.length > 0
        ? parsedData!.required_skills.slice(0, 10)
        : fallback.required_skills;

    const branches =
      Array.isArray(parsedData?.eligible_branches) && parsedData!.eligible_branches.length > 0
        ? parsedData!.eligible_branches
        : fallback.eligible_branches;

    const baseDesc = (parsedData?.description || fallback.description).trim();
    const enrichedDescription =
      skills.length > 0 && !baseDesc.toLowerCase().includes('skills:')
        ? `${baseDesc} | Key Skills: ${skills.join(', ')}${branches.length ? ` | Eligible: ${branches.join(', ')}` : ''}`
        : baseDesc;

    const result: ExtractedDriveInfo = {
      company_name: (parsedData?.company_name || companyHint || fallback.company_name).trim(),
      role_title: (parsedData?.role_title || targetRole || fallback.role_title).trim(),
      tier: validTier,
      min_ctc: Number(minCtc.toFixed(2)),
      max_ctc: Number(maxCtc.toFixed(2)),
      cgpa_cutoff:
        Number(parsedData?.cgpa_cutoff) > 0 && Number(parsedData?.cgpa_cutoff) <= 10
          ? Number(Number(parsedData?.cgpa_cutoff).toFixed(2))
          : fallback.cgpa_cutoff,
      drive_date: parsedData?.drive_date || fallback.drive_date,
      deadline: parsedData?.deadline || fallback.deadline,
      required_skills: skills,
      eligible_branches: branches,
      description: enrichedDescription,
    };

    return NextResponse.json({
      success: true,
      extracted: result,
    });
  } catch (error: any) {
    console.error('Drive JD Extraction Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to extract drive details from file.' },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FAST_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

async function generateWithTimeout(model: string, contents: any, timeoutMs = 8000) {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms on model ${model}`)), timeoutMs)
  );
  const genPromise = ai.models.generateContent({
    model,
    contents,
    config: {
      responseMimeType: 'application/json',
    },
  });
  return Promise.race([genPromise, timeoutPromise]);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 });
    }

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Please upload a valid PDF document.' }, { status: 400 });
    }

    // 1. Convert PDF buffer to Base64 for native Gemini document ingestion
    // This completely avoids pdf-parse/pdfjs fake worker missing module bugs in Next.js Turbopack
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString('base64');

    if (!base64Pdf || base64Pdf.length < 50) {
      return NextResponse.json({
        error: 'The uploaded PDF file is empty or unreadable.',
      }, { status: 400 });
    }

    // 2. Structured Prompt for Gemini extraction
    const prompt = `You are an automated resume extraction parser for campus placement registration.
Analyze this attached student resume PDF document and extract academic, institutional, and biographical details.

MATCHING RULES:
1. Available colleges in our university network:
   - "BPUT_CAMPUS": BPUT Central University Campus, Rourkela
   - "OUTR": Odisha University of Technology and Research (OUTR / CET), Bhubaneswar
   - "PMEC": Parala Maharaja Engineering College (PMEC), Berhampur
   - "GCEK": Government College of Engineering (GCEK), Kalahandi
   - "VSSUT": Veer Surendra Sai University of Technology (VSSUT), Burla
   - "SILICON": Silicon Institute of Technology, Bhubaneswar
   - "CVRCE": C. V. Raman Global University (CVRCE), Bhubaneswar
   - "IGIT": Indira Gandhi Institute of Technology (IGIT), Sarang
   If the student's college mentions any of these, set "collegeCode" to the matching key. If not listed, set null.

2. Available engineering branches:
   - "Computer Science & Engineering"
   - "Information Technology"
   - "Electronics & Telecommunication"
   - "Electrical Engineering"
   - "Mechanical Engineering"
   - "Civil Engineering"
   - "Chemical Engineering"
   Map to the closest matching branch name above.

3. CGPA / Percentage: Extract their current/graduation CGPA as a number out of 10.0 (e.g. 8.42). If given in percentage, convert to 10-point scale (divide by 10 or 9.5).
4. Batch Year: The expected year of graduation (e.g. 2026, 2025, 2027).
5. Technical Skills: Extract all technical skills, programming languages (Python, Java, C++, JS/TS), frameworks (React, Next.js, Spring, Django), databases (SQL, Postgres, MongoDB), cloud tools (AWS, Docker, Git), and CS fundamentals mentioned. Standardize names cleanly.
6. Academic & Engineering Projects: Extract all notable technical/software projects mentioned. For each project, extract its title, technologies/libraries used (techStack array), and a 1-2 sentence description. If no projects are explicitly present, return an empty array [].

Return ONLY raw JSON without markdown backticks or extra text:
{
  "firstName": "string or null",
  "lastName": "string or null",
  "email": "string or null",
  "phone": "string or null",
  "rollNumber": "string or null",
  "collegeCode": "BPUT_CAMPUS" | "OUTR" | "PMEC" | "GCEK" | "VSSUT" | "SILICON" | "CVRCE" | "IGIT" | null,
  "collegeName": "string or null",
  "branch": "string or null",
  "cgpa": number or null,
  "batchYear": number or null,
  "activeBacklogs": number or 0,
  "skills": ["string"],
  "projects": [
    {
      "title": "string",
      "techStack": ["string"],
      "description": "string"
    }
  ]
}`;

    let parsed: any = null;
    let lastError: any = null;

    for (const model of FAST_MODELS) {
      try {
        const response = await generateWithTimeout(
          model,
          [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf,
              },
            },
            prompt,
          ],
          12000
        );
        if (response?.text) {
          let cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const firstBrace = cleaned.indexOf('{');
          const lastBrace = cleaned.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
            cleaned = cleaned.substring(firstBrace, lastBrace + 1);
          }
          parsed = JSON.parse(cleaned);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Parse Resume] Model ${model} failed, trying next:`, err?.message || err);
      }
    }

    if (!parsed) {
      return NextResponse.json({
        error: lastError?.message || 'Failed to parse resume content with AI',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: parsed,
      fileName: file.name,
    });
  } catch (err: any) {
    console.error('Resume Parsing Route Error:', err);
    return NextResponse.json({
      error: err.message || 'Internal server error while parsing resume',
    }, { status: 500 });
  }
}

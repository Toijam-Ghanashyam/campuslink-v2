import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { normalizeBranchName, normalizeRoll, DatasetStudentRow } from '@/lib/dataset-validator';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODELS = [
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
  });
  return Promise.race([genPromise, timeoutPromise]);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No PDF dataset file provided' }, { status: 400 });
    }

    const fileName = file.name ? file.name.toLowerCase() : '';
    if (file.type !== 'application/pdf' && !fileName.endsWith('.pdf')) {
      return NextResponse.json({ error: 'Please upload a valid PDF document.' }, { status: 400 });
    }

    // 1. Convert PDF buffer to Base64 for native Gemini document ingestion
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Pdf = buffer.toString('base64');

    if (!base64Pdf || base64Pdf.length < 50) {
      return NextResponse.json({
        error: 'The uploaded PDF file is empty or unreadable.',
      }, { status: 400 });
    }

    // 2. Structured Prompt for Gemini dataset extraction
    const prompt = `You are an expert institutional academic data extractor for college placement administration.
Analyze this official college student dataset / result gazette / merit list / roll list PDF document.
Extract every student record into a clean JSON array of objects.

REQUIRED SCHEMA for each student object in the array:
- "roll_number": string (official registration or roll number, e.g. "2101289001", "220101045")
- "full_name": string (student's full legal name, e.g. "Aarav Sharma")
- "email": string or null (if listed, otherwise null)
- "branch": string (e.g. "Computer Science & Engineering", "Information Technology", "Electronics & Telecommunication", "Electrical Engineering", "Mechanical Engineering", "Civil Engineering". Convert abbreviations like CSE, IT, ECE, ETC, EE, ME, CE to their full names)
- "batch_year": integer (expected graduation batch year, e.g. 2026, 2025, 2027)
- "cgpa": number (numeric CGPA on a 10-point scale, e.g. 8.45. If percentage is shown, convert by dividing by 10)
- "active_backlogs": integer (count of active backlogs/arrears, default 0 if marked passed or clean)

Return ONLY a valid JSON array of objects without markdown backticks, extra commentary, or wrapping:
[
  {
    "roll_number": "2101289001",
    "full_name": "Aarav Sharma",
    "email": "aarav.sharma@example.com",
    "branch": "Computer Science & Engineering",
    "batch_year": 2026,
    "cgpa": 8.75,
    "active_backlogs": 0
  }
]`;

    let extractedRaw: any[] | null = null;
    let lastError: any = null;

    for (const modelName of GEMINI_MODELS) {
      try {
        const response = await generateWithTimeout(
          modelName,
          [
            {
              inlineData: {
                mimeType: 'application/pdf',
                data: base64Pdf,
              },
            },
            prompt,
          ],
          15000
        );

        if (response?.text) {
          const cleaned = response.text
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();

          const json = JSON.parse(cleaned);
          if (Array.isArray(json) && json.length > 0) {
            extractedRaw = json;
            break;
          } else if (json && Array.isArray(json.students)) {
            extractedRaw = json.students;
            break;
          }
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[Dataset PDF Parser] Model ${modelName} failed:`, err?.message || err);
      }
    }

    if (!extractedRaw || extractedRaw.length === 0) {
      return NextResponse.json(
        {
          error:
            lastError?.message ||
            'Could not extract structured student records from this PDF. Please ensure the PDF contains legible student tables or upload as CSV.',
        },
        { status: 422 }
      );
    }

    // 3. Normalize and validate extracted records
    const normalizedRows: DatasetStudentRow[] = extractedRaw
      .map((item: any) => {
        const roll = normalizeRoll(String(item.roll_number || item.rollNumber || item.id || ''));
        const name = String(item.full_name || item.fullName || item.name || '').trim();
        const branch = normalizeBranchName(String(item.branch || 'Computer Science & Engineering'));
        const batch = parseInt(String(item.batch_year || item.batchYear || 2026), 10) || 2026;
        const cgpa = Math.min(10, Math.max(0, parseFloat(String(item.cgpa || item.verified_cgpa || 0)) || 0));
        const backlogs = Math.max(0, parseInt(String(item.active_backlogs ?? item.activeBacklogs ?? 0), 10) || 0);

        return {
          roll_number: roll,
          full_name: name,
          email: item.email ? String(item.email).trim().toLowerCase() : undefined,
          branch,
          batch_year: batch,
          cgpa: Number(cgpa.toFixed(2)),
          active_backlogs: backlogs,
        };
      })
      .filter((r) => r.roll_number && r.full_name);

    if (normalizedRows.length === 0) {
      return NextResponse.json(
        {
          error: 'No valid student records (with roll number and name) could be parsed from the PDF.',
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      count: normalizedRows.length,
      rows: normalizedRows,
    });
  } catch (err: any) {
    console.error('[parse-dataset-pdf] Fatal error:', err);
    return NextResponse.json(
      { error: err?.message || 'Internal server error processing PDF dataset' },
      { status: 500 }
    );
  }
}


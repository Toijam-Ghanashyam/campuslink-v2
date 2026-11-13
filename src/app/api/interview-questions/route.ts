import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getCuratedQuestionsForCompany, CuratedInterviewQuestion } from '@/lib/curated-interview-questions';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FAST_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      companyName = 'Google',
      roleTitle = 'Software Development Engineer',
      jobDescription = '',
      studentSkills = [],
      branch = 'Computer Science & Engineering',
    } = body;

    const fallbackQuestions = getCuratedQuestionsForCompany(companyName, roleTitle, jobDescription);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        success: true,
        source: 'curated-fallback',
        companyName,
        roleTitle,
        questions: fallbackQuestions,
      });
    }

    const prompt = `You are the Principal Technical Interviewer at ${companyName}.
You are conducting an official 5-question AI video technical interview for the role of "${roleTitle}".
Company: ${companyName}
Role Title: ${roleTitle}
Job Description: ${jobDescription || `Standard industry requirements for ${roleTitle} at ${companyName}.`}
Candidate Engineering Discipline: ${branch}
Candidate Verified Skills: ${studentSkills.length > 0 ? studentSkills.join(', ') : 'Core Technical Competencies'}

CRITICAL MANDATE:
Generate exactly 5 technical interview questions DEEPLY TAILORED to ${companyName} and this specific ${roleTitle} job description. Do NOT produce generic or random questions. Each question must reflect ${companyName}'s actual technical stack, engineering scale, and interview standards.

Include exactly 5 questions following this rigorous structure:
- Question 1 (Experience & Complex Systems): Walk through their technical background and the most complex system built relevant to ${companyName}'s engineering domain.
- Question 2 (Core Algorithms / Data Structures / Analytical Depth): Algorithmic or data structure problem testing Big-O efficiency matching ${companyName}'s screening bar.
- Question 3 (Domain Framework & Architecture): Technical architectural question aligned with the tools/technologies mentioned in the job description.
- Question 4 (Production Reliability, Concurrency & Database Indexing): High-scale failure scenario, deadlock prevention, indexing strategy, or query optimization relevant to ${companyName}.
- Question 5 (High-Scale System Design): Designing a high-concurrency service or data pipeline at the scale handled by ${companyName}.

Respond ONLY with a valid JSON array of 5 objects matching this schema:
[
  {
    "id": 1,
    "questionNumber": 1,
    "category": "Concise Category Name (e.g. ${companyName} Architecture)",
    "prompt": "The exact spoken question prompt to ask the candidate",
    "companyFocus": "One sentence explaining why this question is critical for ${companyName} and ${roleTitle}",
    "idealKeywords": ["Keyword 1", "Keyword 2", "Keyword 3"],
    "sampleAnswer": "A comprehensive, high-scoring technical candidate response"
  }
]`;

    let generatedQuestions: CuratedInterviewQuestion[] | null = null;

    for (const model of FAST_MODELS) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout after 4000ms on model ${model}`)), 4000)
        );
        const genPromise = ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const res: any = await Promise.race([genPromise, timeoutPromise]);
        const text = res?.text;

        if (text) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed) && parsed.length >= 5) {
            generatedQuestions = parsed.slice(0, 5).map((q, idx) => ({
              id: q.id || idx + 1,
              questionNumber: idx + 1,
              category: q.category || `${companyName} Assessment`,
              prompt: q.prompt,
              companyFocus: q.companyFocus || `Tailored to ${companyName} requirements`,
              idealKeywords: q.idealKeywords || [],
              sampleAnswer: q.sampleAnswer || `Spoken response for ${q.prompt}`,
            }));
            break;
          }
        }
      } catch (err: any) {
        console.warn(`[InterviewQuestions] Model ${model} generation notice:`, err?.message);
      }
    }

    if (generatedQuestions && generatedQuestions.length === 5) {
      return NextResponse.json({
        success: true,
        source: 'ai-generated',
        companyName,
        roleTitle,
        questions: generatedQuestions,
      });
    }

    return NextResponse.json({
      success: true,
      source: 'curated-fallback',
      companyName,
      roleTitle,
      questions: fallbackQuestions,
    });
  } catch (err: any) {
    console.error('[InterviewQuestions] Endpoint error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Failed to generate interview questions',
        questions: getCuratedQuestionsForCompany(),
      },
      { status: 500 }
    );
  }
}


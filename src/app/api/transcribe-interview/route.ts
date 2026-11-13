import { NextRequest, NextResponse } from 'next/server';
import { Groq, toFile } from 'groq-sdk';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const questionNumber = formData.get('questionNumber')?.toString() || '1';
    const questionId = formData.get('questionId')?.toString() || '1';
    const questionPrompt = formData.get('questionPrompt')?.toString() || '';
    const category = formData.get('category')?.toString() || 'Technical';

    if (!file) {
      return NextResponse.json(
        { error: 'No audio or video clip provided for transcription.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      console.warn('[Transcribe API] GROQ_API_KEY is not set in environment.');
      return NextResponse.json({
        success: true,
        questionNumber: Number(questionNumber),
        questionId: Number(questionId),
        questionPrompt,
        category,
        transcript: `[Candidate completed answer for Question ${questionNumber} (${category}): "${questionPrompt}". Audio captured.]`,
        model: 'whisper-large-v3-turbo',
        provider: 'Groq API (Mocked - Key Not Configured)',
        transcribedAt: new Date().toISOString(),
      });
    }

    const groq = new Groq({ apiKey });

    // Convert file to Buffer and create Uploadable with Groq's toFile helper
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileName = file.name || `question-${questionNumber}.webm`;
    const mimeType = file.type || 'video/webm';
    const uploadable = await toFile(buffer, fileName, { type: mimeType });

    const promptContext = `Technical computer science interview answer for candidate assessment. Category: ${category}. Question: ${questionPrompt}`;

    const transcription = await groq.audio.transcriptions.create({
      file: uploadable,
      model: 'whisper-large-v3-turbo',
      response_format: 'verbose_json',
      language: 'en',
      prompt: promptContext,
      temperature: 0.0,
    });

    const transcriptText = transcription.text?.trim() || '[No audible speech detected in this recording clip]';

    return NextResponse.json({
      success: true,
      questionNumber: Number(questionNumber),
      questionId: Number(questionId),
      questionPrompt,
      category,
      transcript: transcriptText,
      duration: (transcription as any).duration || null,
      model: 'whisper-large-v3-turbo',
      provider: 'Groq API',
      transcribedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Transcribe API] Error during Groq whisper-large-v3-turbo transcription:', error);

    // Provide a resilient fallback response so student completion is never blocked
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Groq transcription error',
        fallbackTranscript: '[Transcription service temporarily busy. Spoken response preserved in video clip.]',
        model: 'whisper-large-v3-turbo',
      },
      { status: 200 }
    );
  }
}

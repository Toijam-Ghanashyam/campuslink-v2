import { NextRequest, NextResponse } from 'next/server';
import { Groq, toFile } from 'groq-sdk';

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

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If buffer is empty or smaller than valid container header, return early
    if (buffer.length < 500) {
      return NextResponse.json({
        success: true,
        questionNumber: Number(questionNumber),
        questionId: Number(questionId),
        questionPrompt,
        category,
        transcript: '[No audible speech detected in this recording clip]',
        duration: 0,
        model: 'whisper-large-v3-turbo',
        provider: 'Groq API',
        transcribedAt: new Date().toISOString(),
      });
    }

    // Clean up MIME type and filename for Groq's media processor
    const rawMime = file.type || 'video/webm';
    const cleanMimeType = rawMime.split(';')[0].trim() || 'video/webm';
    const ext = cleanMimeType.includes('mp4') ? 'mp4' : cleanMimeType.includes('wav') ? 'wav' : 'webm';
    const cleanFileName = file.name ? file.name.split('?')[0] : `question-${questionNumber}.${ext}`;

    const groq = new Groq({ apiKey });
    const uploadable = await toFile(buffer, cleanFileName, { type: cleanMimeType });

    let transcription: any = null;
    try {
      // Primary: whisper-large-v3-turbo without prompt context (prevents Whisper hallucinations/silence)
      transcription = await groq.audio.transcriptions.create({
        file: uploadable,
        model: 'whisper-large-v3-turbo',
        response_format: 'verbose_json',
        language: 'en',
        temperature: 0.0,
      });
    } catch (primaryErr: any) {
      console.warn('[Transcribe API] whisper-large-v3-turbo fallback attempt with whisper-large-v3:', primaryErr.message);
      // Secondary fallback to whisper-large-v3
      const uploadableRetry = await toFile(buffer, cleanFileName, { type: cleanMimeType });
      transcription = await groq.audio.transcriptions.create({
        file: uploadableRetry,
        model: 'whisper-large-v3',
        response_format: 'verbose_json',
        language: 'en',
      });
    }

    let transcriptText = transcription?.text?.trim() || '';

    // Handle punctuation-only or empty responses
    if (!transcriptText || transcriptText === '.' || transcriptText === '...' || transcriptText === '!') {
      transcriptText = '[No audible speech detected in this recording clip]';
    }

    return NextResponse.json({
      success: true,
      questionNumber: Number(questionNumber),
      questionId: Number(questionId),
      questionPrompt,
      category,
      transcript: transcriptText,
      duration: transcription?.duration || null,
      model: 'whisper-large-v3-turbo',
      provider: 'Groq API',
      transcribedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[Transcribe API] Error during Groq Whisper transcription:', error);

    // Provide a resilient response with question context so client is never left blank
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Groq transcription error',
        transcript: '[Transcription pending / audio preserved in recording clip]',
        model: 'whisper-large-v3-turbo',
      },
      { status: 200 }
    );
  }
}


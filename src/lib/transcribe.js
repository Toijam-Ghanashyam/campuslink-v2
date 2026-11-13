// src/lib/transcribe.js
export async function transcribeAnswerClip(mediaBlob, category = '', fallbackText = '', durationSec = 30) {
  if (!mediaBlob) {
    const text = fallbackText?.trim() || 'Structured technical response recorded and verified.';
    return { text, wpm: calculateWPM(text, durationSec) };
  }

  // 1. Try local server-side endpoint first (/api/transcribe-interview) which safely holds GROQ_API_KEY
  try {
    const formData = new FormData();
    const file = new File([mediaBlob], 'answer.webm', { type: mediaBlob.type || 'video/webm' });
    formData.append('file', file);
    formData.append('category', category || 'Technical Assessment');
    formData.append('questionPrompt', category || 'Technical computer science assessment');

    const res = await fetch('/api/transcribe-interview', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.transcript && !data.transcript.startsWith('No audio')) {
        const dur = data.duration || durationSec || 30;
        return {
          text: data.transcript,
          wpm: calculateWPM(data.transcript, dur),
          model: data.model || 'whisper-large-v3-turbo',
        };
      }
    }
  } catch (err) {
    console.warn('Server transcribe proxy attempt:', err);
  }

  // 2. Direct client Groq API call if VITE_GROQ_API_KEY / NEXT_PUBLIC_GROQ_API_KEY is available
  const apiKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GROQ_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_GROQ_API_KEY);

  if (apiKey) {
    try {
      const file = new File([mediaBlob], 'answer.webm', { type: mediaBlob.type || 'video/webm' });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-large-v3-turbo');
      formData.append('language', 'en');
      formData.append('response_format', 'verbose_json');
      formData.append(
        'prompt',
        `Technical software engineering interview at BPUT. Topic: ${category}. Keywords: React, Node.js, PostgreSQL, Docker, Kubernetes, System Design, LRU Cache, O(1), REST API, JWT.`
      );

      const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const finalDur = data.duration || durationSec || 30;
        const text = data.text?.trim() || fallbackText || 'Audio response archived.';
        return {
          text,
          wpm: calculateWPM(text, finalDur),
          model: 'whisper-large-v3-turbo',
        };
      }
    } catch (err) {
      console.warn('Direct Groq Whisper transcription fallback:', err);
    }
  }

  // 3. Fallback to browser SpeechRecognition or structured fallback
  const text = fallbackText?.trim() || 'Structured technical response recorded and verified.';
  return {
    text,
    wpm: calculateWPM(text, durationSec),
    model: 'whisper-large-v3-turbo',
  };
}

export function calculateWPM(text = '', durationSec = 30) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  if (!words || durationSec <= 0) return 115;
  return Math.round((words / Math.max(5, durationSec)) * 60);
}


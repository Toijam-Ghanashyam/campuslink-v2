import { GoogleGenAI } from '@google/genai';
import {
  MCQQuestion,
  ParagraphQuestion,
  AssessmentPayload,
  KeystrokeTelemetry,
  ProctoringLogEntry,
  ParagraphFeedbackItem,
  MCQReviewItem,
  ReadinessStatus,
} from '@/types/readiness';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const FAST_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
];

async function generateWithTimeout(model: string, contents: any, timeoutMs = 16000) {
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

/**
 * Generate 8 MCQs (80 pts) + 2 Scenario Paragraph questions (20 pts)
 * dynamically from student's resume skills.
 */
export async function generateReadinessQuestions(
  skills: string[],
  branch: string = 'Computer Science & Engineering'
): Promise<AssessmentPayload> {
  const targetSkills = skills && skills.length > 0
    ? skills.slice(0, 8)
    : ['Data Structures & Algorithms', 'SQL & Database Systems', 'System Design & APIs', 'Operating Systems & Concurrency'];

  const prompt = `You are a Principal Technical Interviewer and Campus Placement Readiness Architect.
Generate a rigorous, industry-grade technical assessment tailored specifically to this student's skills and engineering discipline.

Student Skills: [${targetSkills.join(', ')}]
Student Discipline: "${branch}"

ASSESSMENT REQUIREMENTS:
1. Exactly 8 Technical MCQs (Multiple Choice Questions):
   - Each MCQ must target a practical engineering concept, real code behavior, database optimization, or algorithmic edge-case related to the student's skills: ${targetSkills.join(', ')}.
   - Provide exactly 4 realistic, distinct options (A, B, C, D) without obvious giveaways.
   - "correctOptionIndex": integer 0, 1, 2, or 3 pointing to the exact correct answer.
   - "explanation": concise explanation of why the correct option is right and the others are suboptimal.
   - "points": 10.
   - "skill": the specific skill tested.

2. Exactly 2 Scenario / Deep-Dive Paragraph Questions:
   - Provide realistic enterprise production scenarios (e.g. debugging a latency spike, architecting a distributed cache invalidation, diagnosing a database deadlock, designing a fault-tolerant async workflow, or resolving a memory leak).
   - "question": clear, multi-part prompt requiring technical reasoning and specific architecture or implementation choices.
   - "scenarioContext": the realistic background context (traffic, stack, failure mode).
   - "expectedKeyPoints": array of 3-5 specific concepts, keywords, or trade-offs a strong candidate should mention.
   - "points": 10.
   - "skill": the primary skill tested.

Output strictly valid JSON matching this schema:
{
  "mcqs": [
    {
      "id": "mcq-1",
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "correctOptionIndex": 0,
      "skill": "string",
      "explanation": "string",
      "points": 10
    }
  ],
  "paragraphs": [
    {
      "id": "para-1",
      "question": "string",
      "scenarioContext": "string",
      "skill": "string",
      "expectedKeyPoints": ["string"],
      "points": 10
    }
  ]
}`;

  let parsed: AssessmentPayload | null = null;
  let lastError: any = null;

  for (const model of FAST_MODELS) {
    try {
      const response = await generateWithTimeout(model, prompt, 18000);
      if (response?.text) {
        let cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          cleaned = cleaned.substring(first, last + 1);
        }
        const data = JSON.parse(cleaned);
        if (Array.isArray(data.mcqs) && data.mcqs.length > 0 && Array.isArray(data.paragraphs)) {
          // Normalize IDs and points
          data.mcqs = data.mcqs.slice(0, 8).map((m: any, idx: number) => ({
            ...m,
            id: m.id || `mcq-${idx + 1}`,
            points: 10,
            options: Array.isArray(m.options) ? m.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
            correctOptionIndex: typeof m.correctOptionIndex === 'number' && m.correctOptionIndex >= 0 && m.correctOptionIndex < 4 ? m.correctOptionIndex : 0,
          }));
          data.paragraphs = data.paragraphs.slice(0, 2).map((p: any, idx: number) => ({
            ...p,
            id: p.id || `para-${idx + 1}`,
            points: 10,
          }));
          parsed = data;
          break;
        }
      }
    } catch (err: any) {
      lastError = err;
      console.warn(`[Readiness Gen] Model ${model} failed, trying fallback:`, err?.message || err);
    }
  }

  if (parsed && parsed.mcqs.length >= 6 && parsed.paragraphs.length >= 2) {
    return parsed;
  }

  // Robust deterministic fallback if all external models are slow or unreachable
  return getFallbackAssessment(targetSkills);
}

/**
 * Grade the 2 paragraph answers using Gemini + Keystroke Telemetry
 */
export async function gradeParagraphAnswers(params: {
  questions: ParagraphQuestion[];
  answers: Record<string, string>;
  telemetry: Record<string, KeystrokeTelemetry>;
}): Promise<{
  score: number;
  items: ParagraphFeedbackItem[];
  aiSummary: string;
}> {
  const { questions, answers, telemetry } = params;

  const evaluationPayload = questions.map((q) => {
    const studentAnswer = answers[q.id] || answers[q.question] || '';
    const qTelemetry = telemetry[q.id] || {
      totalKeystrokes: studentAnswer.length,
      backspaceCount: 0,
      maxCharsInsertedAtOnce: studentAnswer.length,
      averageTypingIntervalMs: 150,
      pasteAttempts: 0,
      durationSeconds: 60,
    };

    return {
      questionId: q.id,
      skill: q.skill,
      question: q.question,
      scenarioContext: q.scenarioContext,
      expectedKeyPoints: q.expectedKeyPoints || [],
      studentAnswer: studentAnswer.trim(),
      telemetry: qTelemetry,
    };
  });

  const prompt = `You are a Principal Software Engineering Evaluator.
Evaluate these 2 student scenario responses for a proctored technical readiness test.
Each question is worth up to 10 points (total 20 points).

SCORING CRITERIA FOR EACH QUESTION (0 to 10):
- 8 to 10: Outstanding, technically specific, addresses the scenario with concrete architecture/debugging steps, mentions key engineering trade-offs.
- 5 to 7: Competent, correct conceptual direction but lacks depth or specific implementation nuances.
- 2 to 4: Vague, superficial buzzwords, or partially incorrect.
- 0 to 1: Empty, irrelevant, or purely non-technical.

ANTI-CHEAT & TELEMETRY OBSERVATIONS:
- Look at "telemetry": if "pasteAttempts" > 0 or "maxCharsInsertedAtOnce" > 150, or if the text exhibits hallmark generic LLM conversational phrasing ("In conclusion...", "As an AI...", "Here are the key points..."), flag "flaggedForSuspicion": true and deduct up to 2 points for authenticity failure.

QUESTIONS & ANSWERS:
${JSON.stringify(evaluationPayload, null, 2)}

Return strictly JSON:
{
  "totalParagraphScore": number,
  "aiSummary": "string summarizing overall candidate technical depth and clarity",
  "items": [
    {
      "questionId": "string",
      "skill": "string",
      "score": number,
      "maxScore": 10,
      "feedback": "string constructive feedback",
      "flaggedForSuspicion": boolean
    }
  ]
}`;

  for (const model of FAST_MODELS) {
    try {
      const response = await generateWithTimeout(model, prompt, 18000);
      if (response?.text) {
        let cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          cleaned = cleaned.substring(first, last + 1);
        }
        const parsed = JSON.parse(cleaned);
        if (Array.isArray(parsed.items) && typeof parsed.totalParagraphScore === 'number') {
          return {
            score: Math.min(20, Math.max(0, Number(parsed.totalParagraphScore))),
            items: parsed.items,
            aiSummary: parsed.aiSummary || 'Evaluation completed based on technical depth and architectural reasoning.',
          };
        }
      }
    } catch (e: any) {
      console.warn(`[Paragraph Grade] Model ${model} failed, trying fallback:`, e?.message || e);
    }
  }

  // Graceful deterministic fallback grading based on expected keywords and response length
  return getFallbackParagraphGrading(evaluationPayload);
}

/**
 * Calculates integrity score based on proctoring logs and telemetry
 * Starting at 100%, deducting penalties.
 */
export function calculateIntegrityScore(
  proctoringLogs: ProctoringLogEntry[] = [],
  telemetry: Record<string, KeystrokeTelemetry> = {}
): {
  integrityScore: number;
  penalties: { reason: string; penalty: number }[];
} {
  let score = 100;
  const penalties: { reason: string; penalty: number }[] = [];

  // 1. Tab switches / window blur / fullscreen exit: -15% per incident
  const tabSwitches = proctoringLogs.filter(
    (l) => l.type === 'TAB_SWITCH' || l.type === 'FULLSCREEN_EXIT'
  ).length;
  if (tabSwitches > 0) {
    const penalty = Math.min(45, tabSwitches * 15);
    score -= penalty;
    penalties.push({
      reason: `${tabSwitches} Tab Switch / Fullscreen Exit violation(s)`,
      penalty,
    });
  }

  // 2. Multiple faces detected: -25% (indicates another person in frame)
  const multiFaces = proctoringLogs.filter((l) => l.type === 'MULTIPLE_FACES_DETECTED').length;
  if (multiFaces > 0) {
    const penalty = Math.min(35, multiFaces * 20);
    score -= penalty;
    penalties.push({
      reason: `Multiple faces detected in camera frame (${multiFaces} time(s))`,
      penalty,
    });
  }

  // 3. No face detected >3s: -10% per incident
  const noFace = proctoringLogs.filter((l) => l.type === 'NO_FACE_DETECTED').length;
  if (noFace > 0) {
    const penalty = Math.min(25, noFace * 10);
    score -= penalty;
    penalties.push({
      reason: `Absence from webcam screen (${noFace} incident(s))`,
      penalty,
    });
  }

  // 4. Looking away from screen >4s: -10%
  const lookingAway = proctoringLogs.filter((l) => l.type === 'LOOKING_AWAY').length;
  if (lookingAway > 0) {
    const penalty = Math.min(20, lookingAway * 10);
    score -= penalty;
    penalties.push({
      reason: `Gaze away from screen detected (${lookingAway} time(s))`,
      penalty,
    });
  }

  // 5. Sustained background voice detected: -10%
  const voice = proctoringLogs.filter((l) => l.type === 'BACKGROUND_VOICE_DETECTED').length;
  if (voice > 0) {
    const penalty = Math.min(20, voice * 10);
    score -= penalty;
    penalties.push({
      reason: `Background voice / external speech detected (${voice} instance(s))`,
      penalty,
    });
  }

  // 6. Paste attempts & sudden text dumps
  let pasteAttemptsTotal = 0;
  let burstTypingTotal = 0;
  Object.values(telemetry).forEach((t) => {
    pasteAttemptsTotal += t.pasteAttempts || 0;
    if (t.maxCharsInsertedAtOnce > 180) {
      burstTypingTotal++;
    }
  });

  if (pasteAttemptsTotal > 0) {
    const penalty = Math.min(25, pasteAttemptsTotal * 15);
    score -= penalty;
    penalties.push({
      reason: `${pasteAttemptsTotal} prohibited clipboard paste attempt(s)`,
      penalty,
    });
  }

  if (burstTypingTotal > 0) {
    const penalty = 15;
    score -= penalty;
    penalties.push({
      reason: `Abnormal instantaneous text insertion detected (Automated typing tool suspected)`,
      penalty,
    });
  }

  return {
    integrityScore: Math.max(0, Math.min(100, score)),
    penalties,
  };
}

export function computeReadinessStatus(totalScore: number): ReadinessStatus {
  if (totalScore >= 75) return 'HIGHLY_READY';
  if (totalScore >= 50) return 'INTERVIEW_READY';
  return 'NEEDS_IMPROVEMENT';
}

function getFallbackAssessment(skills: string[]): AssessmentPayload {
  const primarySkill = skills[0] || 'Software Engineering';
  const secondarySkill = skills[1] || 'Databases';

  return {
    mcqs: [
      {
        id: 'mcq-1',
        question: `In a high-throughput microservice using ${primarySkill}, what is the primary benefit of applying the Circuit Breaker pattern with exponential backoff?`,
        options: [
          'It completely eliminates network latency across all RPC calls',
          'It prevents cascading service failures and gives struggling downstream dependencies time to recover',
          'It converts all synchronous HTTP requests into immediate websocket connections',
          'It automatically increases database connection pool limits during high traffic',
        ],
        correctOptionIndex: 1,
        skill: primarySkill,
        explanation: 'Circuit breakers fail fast when a downstream dependency is degraded, preventing resource starvation (threads, sockets) and giving downstream services breathing room.',
        points: 10,
      },
      {
        id: 'mcq-2',
        question: `When querying large relational tables in ${secondarySkill}, what happens when an index is created on a column with very low cardinality (e.g. a boolean flag)?`,
        options: [
          'The query planner will almost always perform a full table scan instead of using the index',
          'Query execution speed increases by exactly 50%',
          'The table lock becomes permanent for all subsequent write operations',
          'Database memory usage decreases automatically by 50%',
        ],
        correctOptionIndex: 0,
        skill: secondarySkill,
        explanation: 'Low-cardinality indexes offer poor selectivity; the cost of traversing index B-trees and random page lookups exceeds that of a sequential page scan.',
        points: 10,
      },
      {
        id: 'mcq-3',
        question: 'What is the key difference between optimistic locking and pessimistic locking in concurrent transaction handling?',
        options: [
          'Optimistic locking locks the row at the start of read; pessimistic locks upon commit',
          'Optimistic locking checks for version/timestamp conflicts at commit time; pessimistic locks rows upon access',
          'Optimistic locking only works in NoSQL; pessimistic only works in PostgreSQL',
          'Optimistic locking avoids database indexes completely',
        ],
        correctOptionIndex: 1,
        skill: 'Database Systems & Concurrency',
        explanation: 'Optimistic concurrency control assumes conflicts are rare and verifies row versions before write, while pessimistic concurrency holds locks throughout the transaction.',
        points: 10,
      },
      {
        id: 'mcq-4',
        question: 'Which garbage collection symptom most commonly causes sudden latency spikes (p99 latency) in managed runtimes (JVM/Node.js)?',
        options: [
          'Frequent generational Young-Gen allocation',
          'Stop-the-world Full GC pauses triggered by heap fragmentation or memory exhaustion',
          'Fast inline cache invalidation',
          'TCP socket buffer reuse',
        ],
        correctOptionIndex: 1,
        skill: 'Runtime Performance & Memory',
        explanation: 'Stop-the-world garbage collection pauses execution of all application threads, causing immediate spikes in p99 and p99.9 response latencies.',
        points: 10,
      },
      {
        id: 'mcq-5',
        question: 'In distributed system caching, what issue does Consistent Hashing directly mitigate when nodes are added or removed?',
        options: [
          'Massive key cache invalidation across the entire cluster',
          'Database query deadlocks',
          'TLS handshake overhead',
          'JSON serialization CPU costs',
        ],
        correctOptionIndex: 0,
        skill: 'Distributed Systems',
        explanation: 'Consistent hashing ensures that when a cache node leaves or joins, only K/N keys need to be remapped on average, avoiding cache stampedes.',
        points: 10,
      },
      {
        id: 'mcq-6',
        question: 'Why is an asynchronous non-blocking I/O model (Event Loop) advantageous for I/O-heavy web servers compared to thread-per-request models?',
        options: [
          'It executes CPU-intensive matrix calculations faster than multi-threading',
          'It can handle tens of thousands of concurrent idle connections with minimal memory overhead per socket',
          'It automatically encrypts network packets with zero latency overhead',
          'It eliminates the need for database connection pools',
        ],
        correctOptionIndex: 1,
        skill: 'Network & Concurrency',
        explanation: 'Thread-per-request stacks consume 1-2MB of stack memory per thread. Event-driven I/O multiplexing handles thousands of open sockets with low memory overhead.',
        points: 10,
      },
      {
        id: 'mcq-7',
        question: 'Which HTTP header combination is required to protect web APIs against Cross-Site Request Forgery (CSRF) in browser environments?',
        options: [
          'Cache-Control: no-cache and Content-Type: application/json',
          'Strict-Transport-Security and X-Frame-Options only',
          'SameSite=Lax/Strict cookie attributes combined with custom anti-CSRF token verification',
          'Access-Control-Allow-Origin: *',
        ],
        correctOptionIndex: 2,
        skill: 'Web Security',
        explanation: 'SameSite cookie flags restrict cross-origin ambient credential transmission, and unique CSRF tokens verify that requests originated from authentic client state.',
        points: 10,
      },
      {
        id: 'mcq-8',
        question: 'In modern REST/RPC API design, what is an Idempotent HTTP method?',
        options: [
          'A method that cannot accept request body payloads',
          'A method where making multiple identical requests has the same outcome on server state as making a single request',
          'A method that only returns HTTP 200 OK responses',
          'A method that can only be invoked by administrator roles',
        ],
        correctOptionIndex: 1,
        skill: 'API Architecture',
        explanation: 'Idempotent methods (GET, PUT, DELETE) guarantee that retrying an operation upon network failure does not cause unintended duplicate state changes.',
        points: 10,
      },
    ],
    paragraphs: [
      {
        id: 'para-1',
        question: 'Explain how you would diagnose and resolve an intermittent 504 Gateway Timeout occurring during peak checkout traffic in a distributed web application.',
        scenarioContext: 'An enterprise shopping cart service experiences sudden 504 timeouts when traffic surges past 5,000 requests/sec. Application servers show normal CPU, but the API gateway reports timeouts.',
        skill: 'System Debugging & Distributed Systems',
        expectedKeyPoints: [
          'Distributed tracing (e.g. OpenTelemetry) to identify the slow downstream microservice',
          'Database connection pool exhaustion or unindexed lock contention',
          'Implementing circuit breakers, rate limiting, and read replicas',
          'Connection keep-alive and gateway timeout tuning',
        ],
        points: 10,
      },
      {
        id: 'para-2',
        question: 'Design a resilient, asynchronous file/media processing pipeline that can ingest thousands of uploaded resumes or assets without degrading web user response times.',
        scenarioContext: 'Users upload large PDFs and multimedia. Synchronous processing currently blocks web server workers, causing request queuing.',
        skill: 'System Architecture & Async Queues',
        expectedKeyPoints: [
          'Direct client upload to cloud object storage (S3/GCS presigned URLs)',
          'Asynchronous event emission to a message queue (Kafka, RabbitMQ, or SQS)',
          'Decoupled worker consumers scaling horizontally with Dead Letter Queues (DLQ)',
          'WebSocket or webhook notification to the client upon completion',
        ],
        points: 10,
      },
    ],
  };
}

function getFallbackParagraphGrading(evaluationPayload: any[]): {
  score: number;
  items: ParagraphFeedbackItem[];
  aiSummary: string;
} {
  let totalScore = 0;
  const items: ParagraphFeedbackItem[] = evaluationPayload.map((item) => {
    const text = (item.studentAnswer || '').toLowerCase();
    const len = text.length;

    let qScore = 0;
    if (len > 350) qScore += 5;
    else if (len > 150) qScore += 3;
    else if (len > 50) qScore += 2;

    const keywords = ['queue', 'database', 'trace', 'cache', 'timeout', 'async', 'pool', 'index', 'replica', 'worker', 'circuit', 'latency', 'lock'];
    const matchedKws = keywords.filter((kw) => text.includes(kw));
    qScore += Math.min(5, matchedKws.length);

    // Telemetry penalty
    const flagged = (item.telemetry?.pasteAttempts || 0) > 0 || (item.telemetry?.maxCharsInsertedAtOnce || 0) > 200;
    if (flagged) {
      qScore = Math.max(0, qScore - 2);
    }

    qScore = Math.min(10, Math.max(0, qScore));
    totalScore += qScore;

    return {
      questionId: item.questionId,
      skill: item.skill,
      score: qScore,
      maxScore: 10,
      feedback: len > 100
        ? `Detailed answer addressing key architectural elements including: ${matchedKws.join(', ') || 'core principles'}.`
        : 'Answer is brief; in interview settings, expand on specific trade-offs, metrics, and failure modes.',
      flaggedForSuspicion: flagged,
    };
  });

  return {
    score: totalScore,
    items,
    aiSummary: 'Evaluated technical depth, keyword specificity, and candidate architectural reasoning.',
  };
}


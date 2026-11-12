export type ReadinessStatus = 
  | 'NOT_TESTED' 
  | 'NEEDS_IMPROVEMENT' 
  | 'INTERVIEW_READY' 
  | 'HIGHLY_READY';

export interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex?: number;
  skill: string;
  explanation?: string;
  points: number;
}

export interface ParagraphQuestion {
  id: string;
  question: string;
  scenarioContext: string;
  skill: string;
  expectedKeyPoints?: string[];
  points: number;
}

export interface AssessmentPayload {
  mcqs: MCQQuestion[];
  paragraphs: ParagraphQuestion[];
}

export interface KeystrokeTelemetry {
  totalKeystrokes: number;
  backspaceCount: number;
  maxCharsInsertedAtOnce: number;
  averageTypingIntervalMs: number;
  pasteAttempts: number;
  durationSeconds: number;
}

export interface ProctoringLogEntry {
  timestamp: number;
  type: 
    | 'TAB_SWITCH' 
    | 'FULLSCREEN_EXIT' 
    | 'NO_FACE_DETECTED' 
    | 'MULTIPLE_FACES_DETECTED' 
    | 'LOOKING_AWAY' 
    | 'BACKGROUND_VOICE_DETECTED' 
    | 'PASTE_ATTEMPT' 
    | 'EXTREME_BURST_TYPING';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  snapshotIndex?: number;
}

export interface AssessmentSubmission {
  assessmentId: string;
  mcqAnswers: Record<string, number>;
  paragraphAnswers: Record<string, string>;
  keystrokeTelemetry: Record<string, KeystrokeTelemetry>;
  proctoringLogs: ProctoringLogEntry[];
  snapshots: string[];
}

export interface ParagraphFeedbackItem {
  questionId: string;
  skill: string;
  score: number;
  maxScore: number;
  feedback: string;
  flaggedForSuspicion?: boolean;
}

export interface MCQReviewItem {
  id: string;
  question: string;
  options: string[];
  selectedOption: number | null;
  correctOption: number;
  isCorrect: boolean;
  explanation: string;
  skill: string;
}

export interface AssessmentResult {
  assessmentId: string;
  mcqScore: number;
  paragraphScore: number;
  totalScore: number;
  integrityScore: number;
  readinessStatus: ReadinessStatus;
  summary: string;
  paragraphFeedback: ParagraphFeedbackItem[];
  mcqReview: MCQReviewItem[];
  penalties: { reason: string; penalty: number }[];
  completedAt: string;
}


'use client';

import { useState, useRef, useEffect } from 'react';
import { KeystrokeTelemetry } from '@/types/readiness';

interface ProctoredParagraphEditorProps {
  questionId: string;
  question: string;
  scenarioContext: string;
  skill: string;
  value: string;
  onChange: (val: string, telemetry: KeystrokeTelemetry) => void;
  onViolationLog?: (type: 'PASTE_ATTEMPT' | 'EXTREME_BURST_TYPING', message: string) => void;
  disabled?: boolean;
}

export function ProctoredParagraphEditor({
  questionId,
  question,
  scenarioContext,
  skill,
  value,
  onChange,
  onViolationLog,
  disabled = false,
}: ProctoredParagraphEditorProps) {
  const [pasteBlockedNotice, setPasteBlockedNotice] = useState(false);
  const [charCount, setCharCount] = useState(value.length);

  // Telemetry refs
  const totalKeystrokesRef = useRef<number>(value.length);
  const backspaceCountRef = useRef<number>(0);
  const maxCharsInsertedAtOnceRef = useRef<number>(0);
  const keyTimestampsRef = useRef<number[]>([]);
  const pasteAttemptsRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const prevValueLengthRef = useRef<number>(value.length);

  const getTelemetry = (): KeystrokeTelemetry => {
    const timestamps = keyTimestampsRef.current;
    let avgInterval = 120;
    if (timestamps.length >= 2) {
      let totalDiff = 0;
      for (let i = 1; i < timestamps.length; i++) {
        totalDiff += timestamps[i] - timestamps[i - 1];
      }
      avgInterval = Math.round(totalDiff / (timestamps.length - 1));
    }

    return {
      totalKeystrokes: totalKeystrokesRef.current,
      backspaceCount: backspaceCountRef.current,
      maxCharsInsertedAtOnce: maxCharsInsertedAtOnceRef.current,
      averageTypingIntervalMs: avgInterval,
      pasteAttempts: pasteAttemptsRef.current,
      durationSeconds: Math.round((Date.now() - startTimeRef.current) / 1000),
    };
  };

  const handleBlockedAction = (e: React.SyntheticEvent, actionName: string) => {
    e.preventDefault();
    pasteAttemptsRef.current += 1;
    setPasteBlockedNotice(true);
    onViolationLog?.('PASTE_ATTEMPT', `Prohibited ${actionName} event blocked on question ${questionId}.`);
    onChange(value, getTelemetry());

    setTimeout(() => {
      setPasteBlockedNotice(false);
    }, 2800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Intercept keyboard shortcuts (Ctrl+V, Cmd+V, Ctrl+C, Cmd+C, Ctrl+X, Cmd+X)
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      handleBlockedAction(e, 'Ctrl+V Paste');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) {
      handleBlockedAction(e, 'Ctrl+C Copy');
      return;
    }
    if ((e.ctrlKey || e.metaKey) && (e.key === 'x' || e.key === 'X')) {
      handleBlockedAction(e, 'Ctrl+X Cut');
      return;
    }

    // Telemetry tracking
    totalKeystrokesRef.current += 1;
    if (e.key === 'Backspace' || e.key === 'Delete') {
      backspaceCountRef.current += 1;
    }

    const now = Date.now();
    keyTimestampsRef.current.push(now);
    if (keyTimestampsRef.current.length > 30) {
      keyTimestampsRef.current.shift(); // keep sliding window
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextVal = e.target.value;
    const insertedChars = nextVal.length - prevValueLengthRef.current;

    if (insertedChars > maxCharsInsertedAtOnceRef.current) {
      maxCharsInsertedAtOnceRef.current = insertedChars;
    }

    // Detect abnormal automated bulk typing / macro dumping
    if (insertedChars > 80) {
      onViolationLog?.(
        'EXTREME_BURST_TYPING',
        `Sudden insertion of ${insertedChars} characters at once detected on question ${questionId}.`
      );
    }

    prevValueLengthRef.current = nextVal.length;
    setCharCount(nextVal.length);
    onChange(nextVal, getTelemetry());
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-900/90 p-5 shadow-lg space-y-3 transition-all hover:border-indigo-500/50">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
            ✍️
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
            Scenario Architecture &amp; Debugging
          </span>
          <span className="rounded bg-indigo-950/80 px-2 py-0.5 text-[11px] font-medium text-indigo-300 border border-indigo-800/40">
            {skill}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-800/40">
            10 Points
          </span>
          <span className="text-[11px] text-slate-500 font-mono">
            {charCount} chars
          </span>
        </div>
      </div>

      {/* Scenario Context Box */}
      {scenarioContext && (
        <div className="rounded-lg bg-indigo-950/30 border border-indigo-900/40 p-3 text-xs text-indigo-200/90 leading-relaxed">
          <span className="font-semibold text-indigo-300 block mb-1">Production Scenario:</span>
          {scenarioContext}
        </div>
      )}

      {/* Question Prompt */}
      <h4 className="text-sm font-semibold text-slate-100 leading-snug">
        {question}
      </h4>

      {/* Proctored Lock Notice */}
      <div className="relative">
        <div className="flex items-center justify-between pb-1.5 text-[10px] text-slate-400">
          <span className="flex items-center gap-1 text-slate-400">
            🔒 Clipboard Paste, Copy &amp; Context Menu Disabled • Keystroke Telemetry Monitored
          </span>
          {pasteBlockedNotice && (
            <span className="text-rose-400 font-bold animate-pulse bg-rose-950/80 px-2 py-0.5 rounded border border-rose-800/60">
              🚫 Paste Blocked (Proctoring Violation Logged)
            </span>
          )}
        </div>

        <textarea
          rows={6}
          disabled={disabled}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onPaste={(e) => handleBlockedAction(e, 'Paste')}
          onCopy={(e) => handleBlockedAction(e, 'Copy')}
          onCut={(e) => handleBlockedAction(e, 'Cut')}
          onDrop={(e) => handleBlockedAction(e, 'Drag-and-Drop')}
          onContextMenu={(e) => handleBlockedAction(e, 'Right-Click Context Menu')}
          placeholder="Provide your technical reasoning, specific implementation choices, architectural components, and trade-offs. Type your answer directly..."
          className="w-full rounded-lg border border-slate-700 bg-slate-950 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors font-sans leading-relaxed select-none"
        />
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
        <span>Recommended response length: 150 - 450 characters</span>
        <span className="font-mono">
          Keystrokes: {totalKeystrokesRef.current} • Edits: {backspaceCountRef.current}
        </span>
      </div>
    </div>
  );
}


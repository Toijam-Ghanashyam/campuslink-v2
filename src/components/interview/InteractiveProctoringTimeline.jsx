'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  Eye,
  Users,
  Compass,
  ExternalLink,
} from 'lucide-react';

export function InteractiveProctoringTimeline({
  videoRef,
  totalDurationSec = 180,
  questionClips = [],
  proctoringEvents = [],
  className = '',
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [activePin, setActivePin] = useState(null);

  // Sync playhead with video element currentTime
  useEffect(() => {
    const video = videoRef?.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoRef]);

  const duration = Math.max(totalDurationSec || 0, 1);

  const formatTime = (sec = 0) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(Math.floor(sec % 60)).padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleJumpTo = (timestampSec, event = null) => {
    const video = videoRef?.current;
    if (video) {
      video.currentTime = Math.min(Math.max(timestampSec, 0), video.duration || totalDurationSec);
      video.play().catch(() => {});
      setActivePin(event || { timestampSec });
    }
  };

  const handleTimelineClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPct = Math.max(0, Math.min(clickX / rect.width, 1));
    const targetSec = clickPct * duration;
    handleJumpTo(targetSec);
  };

  const violations = proctoringEvents.filter((e) => e.status === 'violation');
  const warnings = proctoringEvents.filter((e) => e.status === 'warning');

  const getEventIcon = (type) => {
    switch (type) {
      case 'MULTIPLE_FACES_DETECTED':
        return Users;
      case 'HEAD_TURNED_AWAY':
        return Compass;
      case 'EYE_GAZE_OFF_SCREEN':
        return Eye;
      case 'NO_FACE_DETECTED':
      case 'TAB_SWITCH_OR_FOCUS_LOSS':
      default:
        return AlertTriangle;
    }
  };

  const currentPlayheadPct = Math.min(Math.max((currentTime / duration) * 100, 0), 100);

  return (
    <div className={`space-y-3 rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl ${className}`}>
      {/* Header & Stats */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              PROCTORING SCRUBBER ENGINE
            </span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-xs text-slate-300 font-semibold">
              Current: <strong className="text-white">{formatTime(currentTime)}</strong> / {formatTime(duration)}
            </span>
          </div>
          <h4 className="font-display text-sm font-bold text-white flex items-center gap-1.5">
            Interactive Timeline &amp; "Jump-to-Violation" Pins
          </h4>
        </div>

        {/* Violations Count Badges */}
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-950/80 border border-rose-600/60 font-mono text-[11px] font-bold text-rose-300">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            {violations.length} Violations
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 border border-amber-600/60 font-mono text-[11px] font-bold text-amber-300">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            {warnings.length} Warnings
          </span>
        </div>
      </div>

      {/* Main Timeline Bar */}
      <div className="relative pt-2 pb-1">
        {/* Track Container */}
        <div
          onClick={handleTimelineClick}
          className="relative h-10 w-full rounded-lg bg-slate-950 border border-slate-800 overflow-hidden cursor-pointer shadow-inner select-none group"
          title="Click anywhere to scrub playback"
        >
          {/* Neutral Blocks (Base track is neutral/slate-950 representing reading gaps) */}
          <div className="absolute inset-0 bg-slate-950/90 flex items-center justify-center opacity-40">
            <span className="font-mono text-[9px] uppercase tracking-widest text-slate-600 select-none">
              Reading / Thinking Gaps (Neutral)
            </span>
          </div>

          {/* Jade Blocks (Answer Recording active for Q1 - Q10) */}
          {questionClips.map((clip) => {
            const startSec = clip.startedAtSessionSec || 0;
            const clipDur = clip.durationSec || 1;
            const leftPct = Math.min(Math.max((startSec / duration) * 100, 0), 100);
            const widthPct = Math.min(Math.max((clipDur / duration) * 100, 0.5), 100 - leftPct);

            return (
              <div
                key={clip.questionId || clip.questionNumber}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpTo(startSec);
                }}
                style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                className="absolute top-0 bottom-0 bg-emerald-500/70 border-x border-emerald-400/80 hover:bg-emerald-400/90 transition-colors flex items-center justify-center overflow-hidden z-10 group/clip"
                title={`Q${clip.questionNumber}: ${clip.category} (${formatTime(startSec)} - ${formatTime(startSec + clipDur)}) · Click to jump`}
              >
                <span className="font-mono text-[10px] font-black text-slate-950 px-1 truncate select-none">
                  Q{clip.questionNumber}
                </span>
              </div>
            );
          })}

          {/* Current Video Playhead Line */}
          <div
            style={{ left: `${currentPlayheadPct}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg shadow-white z-30 pointer-events-none transition-all duration-75"
          >
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-white rounded-full shadow" />
          </div>

          {/* Brick-Red & Amber Pins (Jump-to-Violation) */}
          {proctoringEvents.map((event, idx) => {
            const pinPct = Math.min(Math.max((event.timestampSec / duration) * 100, 0), 99.5);
            const isViolation = event.status === 'violation';

            return (
              <button
                key={event.id || `${event.type}-${event.timestampSec}-${idx}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleJumpTo(event.timestampSec, event);
                }}
                style={{ left: `${pinPct}%` }}
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 group/pin p-1 transition-transform hover:scale-135 focus:outline-hidden`}
                title={`[${formatTime(event.timestampSec)}] ${event.type}: ${event.reason || event.type} (Click to jump)`}
              >
                <span
                  className={`block rounded-full border-2 border-white shadow-md ${
                    isViolation
                      ? 'w-3.5 h-3.5 bg-rose-500 animate-pulse shadow-rose-900/80'
                      : 'w-3 h-3 bg-amber-400 shadow-amber-900/80'
                  }`}
                />
                {/* Pin Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/pin:flex flex-col items-center pointer-events-none z-50">
                  <div className="px-2 py-1 rounded bg-slate-950 border border-slate-700 text-white font-mono text-[10px] whitespace-nowrap shadow-xl">
                    <span className={isViolation ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                      {formatTime(event.timestampSec)} · {event.type}
                    </span>
                    <span className="block text-[9px] text-slate-400">Click to jump in video</span>
                  </div>
                  <div className="w-1.5 h-1.5 bg-slate-950 border-r border-b border-slate-700 rotate-45 -mt-1" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Timeline Axis Time Markers */}
        <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 pt-1">
          <span>00:00 (Start)</span>
          <span>{formatTime(duration * 0.25)}</span>
          <span>{formatTime(duration * 0.5)} (Midpoint)</span>
          <span>{formatTime(duration * 0.75)}</span>
          <span>{formatTime(duration)} (End)</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-slate-800/80 text-xs text-slate-300">
        <div className="flex flex-wrap items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400" />
            <span className="text-emerald-400 font-semibold">Jade Blocks:</span> Question Answers (Q1–Q10)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-800 border border-slate-700" />
            <span className="text-slate-400">Neutral:</span> Reading &amp; Thinking Gaps
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-white animate-pulse" />
            <span className="text-rose-400 font-semibold">Red Pins:</span> Violations (Face / Tab Loss)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-slate-900" />
            <span className="text-amber-400 font-semibold">Amber Pins:</span> Warnings (Head Yaw / Gaze)
          </span>
        </div>
      </div>

      {/* Jump-to-Violation Incident Quick Buttons */}
      {proctoringEvents.length > 0 ? (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span className="flex items-center gap-1.5 text-indigo-300">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              Jump to Specific Violation (Click pill to verify in 2 seconds):
            </span>
            <span className="font-mono text-[11px] text-slate-400 font-normal">
              {proctoringEvents.length} flagged timestamps
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 max-h-36 overflow-y-auto pr-1">
            {proctoringEvents.map((evt, idx) => {
              const isViolation = evt.status === 'violation';
              const Icon = getEventIcon(evt.type);
              const isActive = Math.abs(currentTime - evt.timestampSec) < 2.5;

              return (
                <button
                  key={evt.id || idx}
                  onClick={() => handleJumpTo(evt.timestampSec, evt)}
                  className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all border ${
                    isActive
                      ? 'ring-2 ring-indigo-400 bg-slate-800 text-white border-indigo-500 scale-102'
                      : isViolation
                      ? 'bg-rose-950/60 border-rose-700/60 text-rose-300 hover:bg-rose-900/60 hover:border-rose-500'
                      : 'bg-amber-950/60 border-amber-700/60 text-amber-300 hover:bg-amber-900/60 hover:border-amber-500'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isViolation ? 'text-rose-400' : 'text-amber-400'}`} />
                  <span className="font-bold underline decoration-dotted underline-offset-2">
                    {formatTime(evt.timestampSec)}
                  </span>
                  <span className="text-[11px]">{evt.type}</span>
                  <Play className="w-3 h-3 text-white/80 shrink-0 ml-0.5" />
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>100% Integrity: No face movement, gaze, or tab switch violations detected.</span>
        </div>
      )}
    </div>
  );
}

export default InteractiveProctoringTimeline;


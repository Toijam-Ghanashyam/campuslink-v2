'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Video, Bell, X, ArrowRight, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

export interface LiveAssessmentAlert {
  appId?: string;
  driveId?: string;
  companyName: string;
  roleTitle?: string;
  message: string;
  timestamp: number;
}

interface LiveAssessmentNotifierProps {
  studentId?: string;
  onNotificationReceived?: (alert: LiveAssessmentAlert) => void;
}

export function playLiveChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
    osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.35); // C6

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.6);
  } catch (e) {
    console.log('[LiveNotifier] Audio chime skipped:', e);
  }
}

export function broadcastLiveAssessmentCall(data: {
  applicationId?: string;
  driveId?: string;
  studentId?: string;
  companyName?: string;
  roleTitle?: string;
}) {
  const alertPayload: LiveAssessmentAlert = {
    appId: data.applicationId,
    driveId: data.driveId,
    companyName: data.companyName || 'Enterprise Partner',
    roleTitle: data.roleTitle || 'Software Engineer',
    message: `Recruiter called you for the Live AI Technical Video Assessment for ${data.companyName || 'Enterprise Partner'}!`,
    timestamp: Date.now(),
  };

  // 1. BroadcastChannel for active browser tabs (0ms latency)
  try {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const bc = new BroadcastChannel('campuslink_live_dispatch');
      bc.postMessage(alertPayload);
      bc.close();
    }
  } catch (e) {}

  // 2. localStorage storage event for cross-tab sync
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('campuslink_live_alert', JSON.stringify(alertPayload));
      // Trigger a custom local window event so the origin tab also receives it if applicable
      window.dispatchEvent(new CustomEvent('campuslink_live_event', { detail: alertPayload }));
    }
  } catch (e) {}
}

export function LiveAssessmentNotifier({
  studentId,
  onNotificationReceived,
}: LiveAssessmentNotifierProps) {
  const [activeAlert, setActiveAlert] = useState<LiveAssessmentAlert | null>(null);
  const supabase = createClient();
  const alertTimeoutRef = useRef<any>(null);

  const handleTriggerAlert = (alert: LiveAssessmentAlert) => {
    setActiveAlert(alert);
    playLiveChime();
    onNotificationReceived?.(alert);

    // Auto-dismiss after 25 seconds if not clicked
    if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    alertTimeoutRef.current = setTimeout(() => {
      setActiveAlert(null);
    }, 25000);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Listen via BroadcastChannel (instant inter-tab event)
    let bc: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        bc = new BroadcastChannel('campuslink_live_dispatch');
        bc.onmessage = (event) => {
          if (event.data && event.data.companyName) {
            handleTriggerAlert(event.data);
          }
        };
      }
    } catch (e) {}

    // 2. Listen via localStorage storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'campuslink_live_alert' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && parsed.companyName) {
            handleTriggerAlert(parsed);
          }
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    // 3. Listen via CustomEvent
    const handleCustomEvent = (e: any) => {
      if (e.detail && e.detail.companyName) {
        handleTriggerAlert(e.detail);
      }
    };
    window.addEventListener('campuslink_live_event', handleCustomEvent);

    // 4. Listen via Supabase Real-Time Channel
    const channel = supabase
      .channel('candidate-live-assessment-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drive_applications',
        },
        async (payload: any) => {
          const newRow = payload.new;
          if (
            newRow &&
            (newRow.stage === 'VIDEO_ASSESSMENT' ||
              newRow.stage === 'VIDEO_ASSESSMENT_CALLED' ||
              newRow.ai_feedback_summary?.includes('Video Assessment') ||
              newRow.ai_feedback_summary?.includes('[ACTION REQUIRED]'))
          ) {
            // Fetch drive company name
            let company = 'Enterprise Partner';
            let role = 'Software Engineer';
            try {
              if (newRow.drive_id) {
                const { data: drive } = await supabase
                  .from('placement_drives')
                  .select('company_name, role_title')
                  .eq('id', newRow.drive_id)
                  .maybeSingle();
                if (drive) {
                  company = drive.company_name;
                  role = drive.role_title;
                }
              }
            } catch (err) {}

            handleTriggerAlert({
              appId: newRow.id,
              driveId: newRow.drive_id,
              companyName: company,
              roleTitle: role,
              message: `Recruiter called you for the Live AI Technical Video Assessment for ${company}!`,
              timestamp: Date.now(),
            });
          }
        }
      )
      .subscribe();

    return () => {
      if (bc) bc.close();
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('campuslink_live_event', handleCustomEvent);
      supabase.removeChannel(channel);
      if (alertTimeoutRef.current) clearTimeout(alertTimeoutRef.current);
    };
  }, []);

  if (!activeAlert) return null;

  const interviewUrl = `/student/ai-interview?appId=${activeAlert.appId || ''}&driveId=${activeAlert.driveId || ''}&company=${encodeURIComponent(activeAlert.companyName)}&role=${encodeURIComponent(activeAlert.roleTitle || '')}`;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4 animate-in slide-in-from-top-6 duration-300">
      <div className="rounded-2xl border-2 border-emerald-500 bg-slate-950/95 p-4 sm:p-5 shadow-2xl shadow-emerald-950/60 backdrop-blur-md ring-4 ring-emerald-500/20 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/60 flex items-center justify-center text-emerald-400 shrink-0">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500 text-black shadow-sm">
                  Live Recruiter Call
                </span>
                <span className="font-mono text-xs text-emerald-400 font-bold">
                  {activeAlert.companyName}
                </span>
              </div>
              <h4 className="font-display text-sm sm:text-base font-bold text-white mt-0.5">
                AI Technical Video Assessment Requested
              </h4>
            </div>
          </div>

          <button
            onClick={() => setActiveAlert(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed pl-1">
          The recruiter has reviewed your application and called you to complete the <strong className="text-white">5-Question Live AI Video Assessment Round</strong>. Unbroken master recording and voice-to-text transcriptions will be dispatched directly to the recruiter war room.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setActiveAlert(null)}
            className="text-xs border-slate-800 text-slate-300 hover:bg-slate-900"
          >
            Dismiss
          </Button>
          <a href={interviewUrl} onClick={() => setActiveAlert(null)}>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 flex items-center gap-1.5 shadow-lg shadow-emerald-600/40"
            >
              <Video className="w-3.5 h-3.5" />
              Start Assessment Now →
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default LiveAssessmentNotifier;

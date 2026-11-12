'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Radio, Volume2, Rocket, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { acceptOffer } from '@/app/actions/placement';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { Card } from '@/components/editorial/Card';
import { Stamp } from '@/components/editorial/Stamp';
import { Callout } from '@/components/editorial/Callout';
import { MarginNote } from '@/components/editorial/MarginNote';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

export default function CandidateLiveStatusPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const { toast } = useToast();

  const loadStudentState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: student } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (student) {
      const { data: apps } = await supabase
        .from('drive_applications')
        .select(`
          id,
          stage,
          ai_fit_score,
          ai_feedback_summary,
          offer_ctc,
          offer_status,
          placement_drives (
            company_name,
            role_title,
            tier
          )
        `)
        .eq('student_id', student.id)
        .order('updated_at', { ascending: false });

      setApplications(apps || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStudentState();

    const channel = supabase
      .channel('candidate-live-dispatch')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drive_applications',
        },
        (payload) => {
          loadStudentState();
          if (payload.new && payload.new.ai_feedback_summary?.includes('[DISPATCH ALERT]')) {
            setActiveAlert(payload.new.ai_feedback_summary);
            toast(payload.new.ai_feedback_summary, 'ochre');

            // Synthesize Web Audio API D5 Chime (587.33 Hz)
            try {
              const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
              const ctx = new AudioCtx();
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime);
              osc.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.45);
            } catch {
              // Audio requires prior gesture
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playPagerChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
      toast('Synthesized D5 Pager Chime (587.33Hz)', 'ochre');
    } catch {
      // Audio permission
    }
  };

  const handleAccept = async (appId: string) => {
    const res = await acceptOffer(appId);
    if (res.success) {
      toast(res.message || 'Offer locked!', 'jade');
      loadStudentState();
    } else {
      toast(res.error || 'Failed to accept offer', 'brick');
    }
  };

  return (
    <AppShell role="student">
      <PageTransition className="space-y-6">
        <Masthead
          context="03 · SUPABASE REALTIME PAGER · DRIVE-DAY TELEMETRY"
          title="Candidate Live Dispatch Board."
          lede="Keep this frequency active on drive day. When recruiters dispatch you from the War Room, an instant audio chime and room assignment will trigger below."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Volume2}
                onClick={playPagerChime}
              >
                Test 587.33Hz Chime
              </Button>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-control bg-jade-tint/50 border border-jade/40 font-mono text-xs font-semibold text-jade">
                <span className="w-2 h-2 rounded-full bg-jade animate-ping" />
                REALTIME FREQUENCY ACTIVE
              </span>
            </div>
          }
        />

        {/* Pulsing Live Call Pager Banner */}
        {activeAlert && (
          <Callout
            tone="ochre"
            icon={Volume2}
            title="IMMEDIATE PANEL DISPATCH ALERT"
            className="animate-pulse border-2 border-accent"
            action={
              <Button size="sm" variant="secondary" onClick={() => setActiveAlert(null)}>
                Acknowledge
              </Button>
            }
          >
            <p className="font-mono text-sm font-bold text-fg">{activeAlert}</p>
          </Callout>
        )}

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-fg-soft">
            Synchronizing live dispatch feed...
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-10 text-center space-y-3">
            <Radio className="w-8 h-8 text-fg-soft mx-auto" />
            <h3 className="font-display text-lg font-semibold text-fg">
              No Active Drive Dispatches
            </h3>
            <p className="text-xs text-fg-soft max-w-md mx-auto">
              Apply to a placement drive first. Once registered, your live round transitions (R1, R2, HR, Offer) will stream here automatically.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <Card key={app.id} className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-semibold text-xl text-fg">
                        {app.placement_drives?.company_name}
                      </h3>
                      <Stamp tone="ink">{app.placement_drives?.tier}</Stamp>
                    </div>
                    <p className="text-xs text-fg-soft mt-0.5">
                      {app.placement_drives?.role_title}
                    </p>
                  </div>

                  <Stamp
                    tone={
                      app.stage === 'OFFERED'
                        ? 'jade'
                        : app.stage === 'REJECTED'
                        ? 'brick'
                        : 'ochre'
                    }
                  >
                    {app.stage}
                  </Stamp>
                </div>

                {app.ai_feedback_summary && (
                  <MarginNote label="WAR ROOM / SCREENING TELEMETRY">
                    {app.ai_feedback_summary}
                  </MarginNote>
                )}

                {app.stage === 'OFFERED' && app.offer_status === 'PENDING' && (
                  <div className="p-4 rounded-control border border-jade/50 bg-jade-tint/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-jade block">
                        CORPORATE OFFER EXTENDED
                      </span>
                      <span className="font-display text-2xl font-bold text-fg">
                        ₹{app.offer_ctc} LPA
                      </span>
                    </div>
                    <Button
                      variant="success"
                      icon={CheckCircle2}
                      onClick={() => handleAccept(app.id)}
                    >
                      Accept Offer &amp; Lock Status
                    </Button>
                  </div>
                )}

                {app.stage === 'REJECTED' && (
                  <div className="p-4 rounded-control border border-brick/40 bg-brick-tint/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-brick block">
                        CANDIDATE REMEDIATION TRIGGER
                      </span>
                      <p className="text-xs text-fg mt-0.5">
                        Convert this screening audit into a personalized, difficulty-calibrated learning roadmap and practice in the Monaco Sandbox.
                      </p>
                    </div>
                    <Link
                      href={`/student/remediation?appId=${app.id}&driveTitle=${encodeURIComponent(
                        app.placement_drives?.company_name || 'Drive'
                      )}&role=${encodeURIComponent(
                        app.placement_drives?.role_title || 'Engineering'
                      )}`}
                    >
                      <Button variant="accent" icon={Rocket}>
                        Generate Skill Roadmap
                      </Button>
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

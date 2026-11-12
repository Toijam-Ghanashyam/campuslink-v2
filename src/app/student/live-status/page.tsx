'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { acceptOffer } from '@/app/actions/placement';

export default function CandidateLiveStatusPage() {
  const [profile, setProfile] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const supabase = createClient();

  const loadStudentState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: student } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    setProfile(student);

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
          pri_score,
          cosine_similarity,
          e_academic,
          e_practical,
          e_eval,
          skill_gap_delta,
          student_skill_vector,
          placement_drives (
            company_name,
            role_title,
            tier,
            pri_threshold,
            role_skill_vector
          )
        `)
        .eq('student_id', student.id);

      setApplications(apps || []);
    }
  };

  useEffect(() => {
    loadStudentState();

    // Listen to real-time events for this student's applications
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
            // Browser chime audio synthesized using Web Audio API
            try {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const osc = ctx.createOscillator();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
              osc.connect(ctx.destination);
              osc.start();
              osc.stop(ctx.currentTime + 0.4);
            } catch (e) {
              console.log('Audio not allowed without gesture');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (appId: string) => {
    const res = await acceptOffer(appId);
    if (res.success) {
      alert(res.message);
      loadStudentState();
    } else {
      alert(res.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-2xl font-bold">Candidate Live Dispatch Board</h1>
            <p className="text-xs text-slate-400">Keep this screen open during drive day for real-time interview calls.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/student/drives">
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Drives
              </Button>
            </Link>
            <Link href="/student/remediation">
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Remediation
              </Button>
            </Link>
          </div>
        </header>

        {/* Live Call Pager Banner */}
        {activeAlert && (
          <div className="rounded-xl border border-amber-500 bg-amber-500/10 p-5 animate-pulse text-amber-200">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs uppercase font-extrabold tracking-wider text-amber-400">Immediate Action Required</p>
                <p className="text-lg font-bold mt-1">{activeAlert}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setActiveAlert(null)} className="border-amber-500 text-amber-200">
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {applications.map((app) => (
            <Card key={app.id} className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{app.placement_drives?.company_name}</CardTitle>
                    <p className="text-xs text-slate-400">{app.placement_drives?.role_title} ({app.placement_drives?.tier})</p>
                  </div>
                  <Badge className="bg-indigo-600 text-xs">{app.stage}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs text-slate-400">
                  {app.ai_feedback_summary}
                </div>

                {app.stage === 'OFFERED' && app.offer_status === 'PENDING' && (
                  <div className="rounded border border-emerald-800 bg-emerald-950/40 p-4 flex justify-between items-center">
                    <div>
                      <p className="text-xs text-emerald-400 uppercase font-semibold">Offer Received</p>
                      <p className="text-xl font-bold text-slate-100">₹{app.offer_ctc} LPA</p>
                    </div>
                    <Button onClick={() => handleAccept(app.id)} className="bg-emerald-600 hover:bg-emerald-500">
                      Accept Offer (Lock Status)
                    </Button>
                  </div>
                )}

                {app.stage === 'REJECTED' && (
                  <div className="rounded-lg border border-amber-900/60 bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/20 p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800/80 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold tracking-wider text-amber-400">Explainable PRI Matrix Diagnostic</span>
                          <Badge variant="outline" className="border-rose-800 text-rose-300 text-[10px]">
                            Not Selected
                          </Badge>
                        </div>
                        <p className="text-sm font-semibold text-slate-200 mt-1">
                          Placement Readiness Gap Identified
                        </p>
                        <p className="text-xs text-slate-400">
                          Replaced binary rejection with actionable mathematical skill vector comparison.
                        </p>
                      </div>

                      <div className="text-right bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Candidate PRI vs Cutoff</span>
                        <div className="flex items-baseline gap-1.5 justify-end">
                          <span className="text-xl font-extrabold text-amber-400">
                            {app.pri_score ?? app.ai_fit_score ?? '--'}%
                          </span>
                          <span className="text-xs text-slate-500">
                            / {app.placement_drives?.pri_threshold ?? 70}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Three Mathematical Pillars */}
                    {app.e_academic !== undefined && app.e_academic !== null && (
                      <div className="grid grid-cols-3 gap-2 text-center text-xs">
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block font-medium">Academic (20%)</span>
                          <span className="text-sm font-bold text-slate-200">{app.e_academic}</span>
                          <span className="text-[9px] text-slate-500 block">Verified CGPA</span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block font-medium">Practical (50%)</span>
                          <span className="text-sm font-bold text-slate-200">{app.e_practical}</span>
                          <span className="text-[9px] text-slate-500 block">Project Depth</span>
                        </div>
                        <div className="p-2 rounded bg-slate-950/80 border border-slate-800">
                          <span className="text-[10px] text-slate-400 uppercase block font-medium">CS Core (30%)</span>
                          <span className="text-sm font-bold text-slate-200">{app.e_eval}</span>
                          <span className="text-[9px] text-slate-500 block">Fundamentals</span>
                        </div>
                      </div>
                    )}

                    {/* Cosine Alignment & Deficit Gap Badges */}
                    {app.cosine_similarity !== undefined && app.cosine_similarity !== null && (
                      <div className="flex justify-between items-center text-xs text-slate-400">
                        <span>Role Vector Cosine Alignment:</span>
                        <span className="font-mono text-indigo-400 font-semibold">
                          {(Number(app.cosine_similarity) * 100).toFixed(1)}% Match
                        </span>
                      </div>
                    )}

                    {app.skill_gap_delta && Array.isArray(app.skill_gap_delta) && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                        <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">
                          Primary Skill Deficits to Close (Role vs Evaluated):
                        </span>
                        <div className="grid sm:grid-cols-3 gap-1.5 mt-1">
                          {app.skill_gap_delta
                            .filter((g: any) => g.delta > 0)
                            .slice(0, 3)
                            .map((gap: any, i: number) => (
                              <div
                                key={i}
                                className="rounded bg-rose-950/30 border border-rose-900/40 p-2 text-xs flex flex-col justify-between"
                              >
                                <span className="font-medium text-slate-200 truncate">{gap.label}</span>
                                <div className="flex justify-between items-center mt-1 text-[11px]">
                                  <span className="text-slate-400">Score: {gap.studentScore}/{gap.roleScore}</span>
                                  <span className="font-bold text-rose-400">+{gap.delta} gap</span>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 flex justify-end">
                      <Link
                        href={`/student/remediation?appId=${app.id}&driveTitle=${encodeURIComponent(app.placement_drives?.company_name || 'Drive')}&role=${encodeURIComponent(app.placement_drives?.role_title || 'Engineering')}`}
                      >
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-500 text-xs text-white shrink-0 shadow-md shadow-indigo-600/30 gap-1.5"
                        >
                          <span>🗺️</span> Open Vector Remediation Roadmap &rarr;
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


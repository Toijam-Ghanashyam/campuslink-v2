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
          placement_drives (
            company_name,
            role_title,
            tier
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
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { advanceCandidateStage } from '@/app/actions/war-room';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

const STAGES = [
  'APPLIED',
  'OA_CLEARED',
  'INTERVIEW_R1',
  'INTERVIEW_R2',
  'HR_ROUND',
  'OFFERED',
  'REJECTED',
];

export default function RecruiterWarRoom() {
  const [drives, setDrives] = useState<any[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [panelRoom, setPanelRoom] = useState<string>('Lab 4 - Panel 2');
  const [ctcOffer, setCtcOffer] = useState<number>(12.0);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();

  // Load drives
  useEffect(() => {
    async function fetchDrives() {
      const { data } = await supabase.from('placement_drives').select('*');
      if (data && data.length > 0) {
        setDrives(data);
        setSelectedDriveId(data[0].id);
      }
      setLoading(false);
    }
    fetchDrives();
  }, []);

  // Fetch applications for selected drive
  const fetchApplications = async (driveId: string) => {
    const { data } = await supabase
      .from('drive_applications')
      .select(`
        id,
        stage,
        ai_fit_score,
        ai_feedback_summary,
        offer_ctc,
        offer_status,
        pri_score,
        e_academic,
        e_practical,
        e_eval,
        cosine_similarity,
        skill_gap_delta,
        student_skill_vector,
        student_profiles (
          id,
          roll_number,
          branch,
          verified_cgpa,
          placement_status
        )
      `)
      .eq('drive_id', driveId)
      .order('ai_fit_score', { ascending: false });

    setApplications(data || []);
  };

  useEffect(() => {
    if (selectedDriveId) {
      fetchApplications(selectedDriveId);

      // Listen to live real-time changes
      const channel = supabase
        .channel(`recruiter-warroom-${selectedDriveId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'drive_applications',
            filter: `drive_id=eq.${selectedDriveId}`,
          },
          () => {
            fetchApplications(selectedDriveId);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedDriveId]);

  const handleStageChange = async (appId: string, stage: string) => {
    const isOffer = stage === 'OFFERED';
    await advanceCandidateStage(appId, stage, panelRoom, isOffer ? ctcOffer : undefined);
    fetchApplications(selectedDriveId);
  };

  if (loading) {
    return <div className="p-8 text-slate-100">Loading War Room...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="flex flex-wrap justify-between items-center border-b border-slate-800 pb-4 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
              Enterprise Drive-Day War Room
            </h1>
            <p className="text-sm text-slate-400">
              High-Throughput Candidate Pipeline &amp; Panel Dispatch
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold block">Active Drive</label>
              <select
                value={selectedDriveId}
                onChange={(e) => setSelectedDriveId(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-sm text-slate-100"
              >
                {drives.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.company_name} - {d.role_title} ({d.tier})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold block">Dispatch Venue</label>
              <Input
                value={panelRoom}
                onChange={(e) => setPanelRoom(e.target.value)}
                className="h-8 bg-slate-900 border-slate-800 text-xs w-40"
                placeholder="Lab / Panel No."
              />
            </div>

            <div>
              <label className="text-xs uppercase text-slate-400 font-semibold block">Offer CTC (LPA)</label>
              <Input
                type="number"
                value={ctcOffer}
                onChange={(e) => setCtcOffer(parseFloat(e.target.value))}
                className="h-8 bg-slate-900 border-slate-800 text-xs w-24"
              />
            </div>
          </div>
        </header>

        {/* Applications List */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider font-semibold px-2">
            <span>Candidate &amp; AI Screening</span>
            <span>Current Stage &amp; Dispatch Actions</span>
          </div>

          {applications.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No candidates have applied to this drive yet.
            </Card>
          ) : (
            applications.map((app) => {
              const student = app.student_profiles;
              const user = student?.users;

              return (
                <Card
                  key={app.id}
                  className="border-slate-800 bg-slate-900/80 hover:bg-slate-900 text-slate-100 transition-colors"
                >
                  <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-base">
                          {(student as any)?.full_name || (student?.roll_number ? `Roll: ${student.roll_number}` : 'Candidate')}
                        </span>
                        <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                          {student?.roll_number}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {student?.branch}
                        </Badge>
                        <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs">
                          CGPA: {student?.verified_cgpa}
                        </Badge>
                        <Badge
                          className={`text-xs font-bold ${
                            (app.pri_score ?? app.ai_fit_score ?? 0) >= 70
                              ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                              : 'bg-amber-900/60 text-amber-300 border border-amber-700'
                          }`}
                        >
                          PRI: {app.pri_score ?? app.ai_fit_score ?? 0}%
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                        {app.e_academic !== undefined && app.e_academic !== null ? (
                          <span className="font-mono text-[11px] text-slate-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            Acad: <strong className="text-indigo-400">{app.e_academic}</strong> | Prac: <strong className="text-indigo-400">{app.e_practical}</strong> | Eval: <strong className="text-indigo-400">{app.e_eval}</strong>
                          </span>
                        ) : (
                          <span>AI Match: <strong className="text-emerald-400">{app.ai_fit_score || 0}%</strong></span>
                        )}
                        {app.cosine_similarity !== undefined && app.cosine_similarity !== null && (
                          <span className="font-mono text-[11px] text-slate-400">
                            CosSim: <strong className="text-emerald-400">{(Number(app.cosine_similarity) * 100).toFixed(0)}%</strong>
                          </span>
                        )}
                        {app.skill_gap_delta && Array.isArray(app.skill_gap_delta) && app.skill_gap_delta.length > 0 && app.skill_gap_delta[0].delta > 0 && (
                          <span className="text-[10px] text-rose-300 bg-rose-950/40 border border-rose-900/50 px-1.5 py-0.5 rounded">
                            Deficit: +{app.skill_gap_delta[0].delta} {app.skill_gap_delta[0].key}
                          </span>
                        )}
                        <span>•</span>
                        <span className="truncate max-w-sm italic text-slate-300">
                          {app.ai_feedback_summary || 'Pending evaluation'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge
                        className={`text-xs px-2.5 py-1 ${
                          app.stage === 'OFFERED'
                            ? 'bg-emerald-600'
                            : app.stage === 'REJECTED'
                            ? 'bg-rose-600'
                            : 'bg-indigo-600'
                        }`}
                      >
                        {app.stage}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-slate-700 hover:bg-slate-800 text-xs"
                          onClick={() => handleStageChange(app.id, 'INTERVIEW_R1')}
                        >
                          Call R1
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-slate-700 hover:bg-slate-800 text-xs"
                          onClick={() => handleStageChange(app.id, 'INTERVIEW_R2')}
                        >
                          Call R2
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-slate-700 hover:bg-slate-800 text-xs"
                          onClick={() => handleStageChange(app.id, 'HR_ROUND')}
                        >
                          Call HR
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 bg-emerald-600 hover:bg-emerald-500 text-xs"
                          onClick={() => handleStageChange(app.id, 'OFFERED')}
                        >
                          Offer
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-8 text-xs"
                          onClick={() => handleStageChange(app.id, 'REJECTED')}
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}


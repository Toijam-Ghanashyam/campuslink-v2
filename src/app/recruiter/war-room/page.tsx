'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { advanceCandidateStage } from '@/app/actions/war-room';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { Card } from '@/components/editorial/Card';
import { Stamp } from '@/components/editorial/Stamp';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

export default function RecruiterWarRoom() {
  const [drives, setDrives] = useState<any[]>([]);
  const [selectedDriveId, setSelectedDriveId] = useState<string>('');
  const [applications, setApplications] = useState<any[]>([]);
  const [panelRoom, setPanelRoom] = useState<string>('Lab 4 - Panel 2');
  const [ctcOffer, setCtcOffer] = useState<number>(12.0);
  const [loading, setLoading] = useState<boolean>(true);

  const supabase = createClient();
  const { toast } = useToast();

  useEffect(() => {
    async function fetchDrives() {
      const { data } = await supabase
        .from('placement_drives')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setDrives(data);
        setSelectedDriveId(data[0].id);
      }
      setLoading(false);
    }
    fetchDrives();
  }, []);

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
        student_profiles (
          id,
          full_name,
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
    const res = await advanceCandidateStage(
      appId,
      stage,
      panelRoom,
      isOffer ? ctcOffer : undefined
    );
    if (res.success) {
      toast(`Dispatched candidate to ${stage} (${panelRoom})`, 'jade');
      fetchApplications(selectedDriveId);
    } else {
      toast(`Dispatch error: ${res.error}`, 'brick');
    }
  };

  return (
    <AppShell role="recruiter">
      <PageTransition className="space-y-6">
        <Masthead
          context="02 · ENTERPRISE DRIVE-DAY WAR ROOM · LIVE PANEL DISPATCH"
          title="Candidate Queue & Live Dispatch."
          lede="Candidates are ranked by Gemini AI Fit Score. Clicking any round trigger dispatches a live audio alert to the student's device; rejecting pre-generates their AI skill roadmap."
        />

        {/* War Room Control Strip */}
        <Card className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-soft font-semibold block mb-1">
              ACTIVE PLACEMENT DRIVE
            </label>
            <select
              value={selectedDriveId}
              onChange={(e) => setSelectedDriveId(e.target.value)}
              className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-medium text-fg"
            >
              {drives.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.company_name} — {d.role_title} ({d.tier})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-soft font-semibold block mb-1">
              DISPATCH VENUE / PANEL ROOM
            </label>
            <input
              type="text"
              value={panelRoom}
              onChange={(e) => setPanelRoom(e.target.value)}
              placeholder="e.g. Computing Lab 4 - Panel 2"
              className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
            />
          </div>

          <div>
            <label className="font-mono text-[10px] uppercase tracking-wider text-fg-soft font-semibold block mb-1">
              OFFER PACKAGE (LPA)
            </label>
            <input
              type="number"
              step="0.5"
              value={ctcOffer}
              onChange={(e) => setCtcOffer(parseFloat(e.target.value) || 0)}
              className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
            />
          </div>
        </Card>

        {/* Ranked Candidate Queue */}
        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-fg-soft">
            Initializing War Room telemetry...
          </div>
        ) : applications.length === 0 ? (
          <Card className="p-12 text-center text-xs text-fg-soft">
            No candidates have applied to this drive yet.
          </Card>
        ) : (
          <div className="w-full overflow-x-auto border-y border-line no-scrollbar">
            <table className="w-full min-w-[820px] text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface/60 font-mono text-[10.5px] uppercase tracking-wider text-fg-soft">
                  <th className="py-3 px-4">Candidate &amp; Roll</th>
                  <th className="py-3 px-4">Branch &amp; CGPA</th>
                  <th className="py-3 px-4">AI Fit Score</th>
                  <th className="py-3 px-4">Stage</th>
                  <th className="py-3 px-4 text-right">One-Click Panel Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {applications.map((app) => {
                  const st = app.student_profiles;
                  return (
                    <tr key={app.id} className="hover:bg-surface/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <p className="font-display font-semibold text-base text-fg">
                          {st?.full_name || `Candidate (${st?.roll_number || 'N/A'})`}
                        </p>
                        <p className="font-mono text-xs text-fg-soft">{st?.roll_number}</p>
                      </td>

                      <td className="py-3.5 px-4 text-xs">
                        <span className="font-medium text-fg">{st?.branch}</span>
                        <p className="font-mono text-jade font-semibold">
                          {st?.verified_cgpa} CGPA
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-mono text-xs space-y-1 max-w-[260px]">
                          <strong className="text-jade text-sm">
                            {app.ai_fit_score || 0}% Match
                          </strong>
                          <p className="text-[11px] text-fg-soft truncate">
                            {app.ai_feedback_summary || 'Awaiting AI screening'}
                          </p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
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
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStageChange(app.id, 'INTERVIEW_R1')}
                          >
                            Call R1
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStageChange(app.id, 'INTERVIEW_R2')}
                          >
                            Call R2
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleStageChange(app.id, 'HR_ROUND')}
                          >
                            Call HR
                          </Button>
                          <Button
                            size="sm"
                            variant="success"
                            onClick={() => handleStageChange(app.id, 'OFFERED')}
                          >
                            Offer
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleStageChange(app.id, 'REJECTED')}
                          >
                            Reject
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

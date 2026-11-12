'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { applyToPlacementDrive } from '@/app/actions/placement';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [myApplications, setMyApplications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Resume Upload Modal State
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const supabase = createClient();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setStudent(profile);

      if (profile) {
        const { data: apps } = await supabase
          .from('drive_applications')
          .select('*')
          .eq('student_id', profile.id);

        const appMap: Record<string, any> = {};
        apps?.forEach((a) => {
          appMap[a.drive_id] = a;
        });
        setMyApplications(appMap);
      }
    }

    const { data: driveList } = await supabase
      .from('placement_drives')
      .select('*')
      .order('drive_date', { ascending: true });

    setDrives(driveList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyClick = (drive: any) => {
    if (student && !student.is_locked) {
      alert('Academic Record Pending Verification: Under PEP Rule 1, your academic record must be verified and locked by your College Placement Cell before submitting drive applications.');
      return;
    }
    setSelectedDrive(drive);
    setResumeFile(null);
    setEvalResult(null);
  };

  const handleConfirmApplication = async () => {
    if (!selectedDrive || !resumeFile) {
      alert('Please select a PDF resume.');
      return;
    }

    setUploading(true);

    // 1. Pass through PEP Engine verification
    const applyRes = await applyToPlacementDrive(selectedDrive.id);
    if (!applyRes.success) {
      alert(`Policy Check Blocked: ${applyRes.error}`);
      setUploading(false);
      return;
    }

    // 2. Fetch the newly created application ID
    const { data: appData } = await supabase
      .from('drive_applications')
      .select('id')
      .eq('drive_id', selectedDrive.id)
      .eq('student_id', student.id)
      .single();

    if (!appData) {
      alert('Failed to retrieve application record.');
      setUploading(false);
      return;
    }

    // 3. Trigger AI screening endpoint
    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('application_id', appData.id);
    formData.append('role_title', selectedDrive.role_title);
    formData.append('tier', selectedDrive.tier);

    const screenRes = await fetch('/api/screen-resume', {
      method: 'POST',
      body: formData,
    });

    const screenData = await screenRes.json();
    setUploading(false);

    if (screenData.success) {
      setEvalResult(screenData);
      loadData();
    } else {
      alert(`AI Screening Error: ${screenData.error}`);
    }
  };

  if (loading) {
    return <div className="p-8 text-slate-100">Loading placement portal...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Active Placement Drives</h1>
            <p className="text-sm text-slate-400">Institutional Policy & Eligibility Engine (PEP) + AI Screening</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/student/live-status">
              <Button variant="outline" size="sm" className="border-indigo-600/40 text-indigo-400 hover:bg-indigo-950/40 text-xs">
                Live Dispatch
              </Button>
            </Link>
            <Link href="/student/remediation">
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Remediation
              </Button>
            </Link>
            {student && (
              <div className="text-right text-xs text-slate-400 pl-2 border-l border-slate-800">
                <p>Roll: <span className="text-slate-200 font-medium">{student.roll_number}</span></p>
                <p>Status: <Badge variant="outline" className="text-indigo-400 border-indigo-400/40 ml-1">{student.placement_status}</Badge></p>
              </div>
            )}
          </div>
        </header>

        {student && !student.is_locked && (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 p-4 text-xs text-amber-300 flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-200">PEP Rule 1 Notice: Academic Record Awaiting TPO Lock</p>
              <p className="text-amber-300/80 mt-0.5">
                Your submitted CGPA and resume are currently being reviewed by your College Placement Cell. You can review job descriptions and eligibility criteria below, and application submissions will activate once your TPO approves your profile.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {drives.map((drive) => {
            const application = myApplications[drive.id];
            return (
              <Card key={drive.id} className="border-slate-800 bg-slate-900 text-slate-100 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={drive.tier === 'TIER_1' ? 'destructive' : drive.tier === 'TIER_2' ? 'default' : 'secondary'}>
                      {drive.tier}
                    </Badge>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 block">Cutoff: {drive.cgpa_cutoff} CGPA</span>
                      <span className="text-[10px] text-indigo-400 font-medium">PRI &ge; {drive.pri_threshold || 70}%</span>
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-2">{drive.company_name}</CardTitle>
                  <p className="text-xs text-slate-400">{drive.role_title}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm font-semibold text-emerald-400">
                    ₹{drive.min_ctc} - ₹{drive.max_ctc} LPA
                  </div>

                  {application ? (
                    <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Application Stage:</span>
                        <Badge className="bg-indigo-600 text-[10px]">{application.stage}</Badge>
                      </div>

                      <div className="flex justify-between items-center pt-1 border-t border-slate-900">
                        <span className="text-slate-400">Placement Readiness (PRI):</span>
                        <span className={`font-bold ${
                          (application.pri_score ?? application.ai_fit_score ?? 0) >= (drive.pri_threshold || 70)
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}>
                          {application.pri_score ?? application.ai_fit_score ?? '--'}%
                        </span>
                      </div>

                      {application.e_academic !== undefined && application.e_academic !== null && (
                        <div className="grid grid-cols-3 gap-1 py-1 text-[10px] text-center text-slate-300 bg-slate-900/60 rounded">
                          <div>
                            <span className="text-slate-500 block">Acad (20%)</span>
                            <span className="font-semibold text-indigo-300">{application.e_academic}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Prac (50%)</span>
                            <span className="font-semibold text-indigo-300">{application.e_practical}</span>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Eval (30%)</span>
                            <span className="font-semibold text-indigo-300">{application.e_eval}</span>
                          </div>
                        </div>
                      )}

                      {application.cosine_similarity !== undefined && application.cosine_similarity !== null && (
                        <div className="flex justify-between text-[11px] text-slate-400">
                          <span>Vector Cosine Match:</span>
                          <span className="font-mono text-slate-200">
                            {(Number(application.cosine_similarity) * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}

                      {application.ai_feedback_summary && (
                        <p className="text-slate-300 italic pt-1 border-t border-slate-800/80 line-clamp-2">
                          "{application.ai_feedback_summary}"
                        </p>
                      )}
                    </div>
                  ) : (
                    <Button
                      onClick={() => handleApplyClick(drive)}
                      className="w-full bg-indigo-600 hover:bg-indigo-500"
                    >
                      Apply with Resume
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Upload and AI Screening Modal */}
      <Dialog open={!!selectedDrive} onOpenChange={() => setSelectedDrive(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply to {selectedDrive?.company_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload your PDF resume. The system will evaluate your eligibility and compute your match rubric.
            </DialogDescription>
          </DialogHeader>

          {!evalResult ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Resume Document (PDF)</label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>

              <Button
                onClick={handleConfirmApplication}
                disabled={uploading || !resumeFile}
                className="w-full bg-indigo-600 hover:bg-indigo-500"
              >
                {uploading ? 'Analyzing Resume with Gemini...' : 'Submit & Analyze'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs uppercase font-semibold text-slate-400">Explainable Readiness Index (PRI)</span>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className={`text-3xl font-extrabold ${
                        (evalResult.pri_score || evalResult.fit_score) >= (evalResult.pri_breakdown?.threshold || selectedDrive?.pri_threshold || 70)
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}>
                        {evalResult.pri_score || evalResult.fit_score}%
                      </span>
                      <span className="text-xs text-slate-400">
                        / Threshold: {evalResult.pri_breakdown?.threshold || selectedDrive?.pri_threshold || 70}%
                      </span>
                    </div>
                  </div>
                  <Badge className={`text-xs ${
                    (evalResult.pri_score || evalResult.fit_score) >= (evalResult.pri_breakdown?.threshold || selectedDrive?.pri_threshold || 70)
                      ? 'bg-emerald-600'
                      : 'bg-amber-600'
                  }`}>
                    {(evalResult.pri_score || evalResult.fit_score) >= (evalResult.pri_breakdown?.threshold || selectedDrive?.pri_threshold || 70)
                      ? 'READINESS MET'
                      : 'BELOW THRESHOLD'}
                  </Badge>
                </div>

                {evalResult.pri_breakdown && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-medium">Academic (20%)</span>
                      <span className="text-sm font-bold text-slate-200">{evalResult.pri_breakdown.e_academic}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-medium">Practical (50%)</span>
                      <span className="text-sm font-bold text-slate-200">{evalResult.pri_breakdown.e_practical}</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 uppercase block font-medium">CS Core (30%)</span>
                      <span className="text-sm font-bold text-slate-200">{evalResult.pri_breakdown.e_eval}</span>
                    </div>
                  </div>
                )}

                {evalResult.pri_breakdown?.cosine_similarity !== undefined && (
                  <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                    <span>Role Skill Vector Alignment:</span>
                    <span className="font-mono text-indigo-400 font-semibold">
                      {(evalResult.pri_breakdown.cosine_similarity * 100).toFixed(1)}% Cosine Match
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-300 italic pt-2 border-t border-slate-800">
                  "{evalResult.summary}"
                </p>

                {evalResult.pri_breakdown?.skill_gap_delta && evalResult.pri_breakdown.skill_gap_delta.filter((d: any) => d.delta > 0).length > 0 && (
                  <div className="pt-2 border-t border-slate-800/80 space-y-1">
                    <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">Top Skill Deficit Gaps:</span>
                    <div className="space-y-1 mt-1">
                      {evalResult.pri_breakdown.skill_gap_delta
                        .filter((d: any) => d.delta > 0)
                        .slice(0, 3)
                        .map((gap: any, i: number) => (
                          <div key={i} className="flex justify-between items-center text-[11px] bg-rose-950/20 px-2 py-1 rounded border border-rose-900/40">
                            <span className="text-slate-300">{gap.label}</span>
                            <span className="font-mono text-rose-400 font-semibold">
                              Candidate: {gap.studentScore}/10 (Deficit: +{gap.delta})
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => setSelectedDrive(null)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-xs"
                >
                  Close
                </Button>
                {evalResult.pri_breakdown?.below_threshold && (
                  <Link
                    href={`/student/remediation?driveTitle=${encodeURIComponent(selectedDrive?.company_name || 'Drive')}&role=${encodeURIComponent(selectedDrive?.role_title || 'Engineering')}`}
                    className="flex-1"
                  >
                    <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs text-white">
                      View Learning Roadmap &rarr;
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

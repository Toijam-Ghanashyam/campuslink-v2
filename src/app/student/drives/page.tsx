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
      .eq('approval_status', 'APPROVED')
      .order('drive_date', { ascending: true });

    setDrives(driveList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApplyClick = (drive: any) => {
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
            <Link href="/student/calendar">
              <Button variant="outline" size="sm" className="border-emerald-600/40 text-emerald-400 hover:bg-emerald-950/40 text-xs">
                📅 Drive Calendar
              </Button>
            </Link>
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
                    <span className="text-xs text-slate-400">Cutoff: {drive.cgpa_cutoff} CGPA</span>
                  </div>
                  <CardTitle className="text-xl mt-2">{drive.company_name}</CardTitle>
                  <p className="text-xs text-slate-400">{drive.role_title}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm font-semibold text-emerald-400">
                    ₹{drive.min_ctc} - ₹{drive.max_ctc} LPA
                  </div>

                  {application ? (
                    <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Stage:</span>
                        <span className="font-semibold text-indigo-400">{application.stage}</span>
                      </div>
                      {application.ai_fit_score && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">AI Match Score:</span>
                          <span className="font-semibold text-emerald-400">{application.ai_fit_score}%</span>
                        </div>
                      )}
                      {application.ai_feedback_summary && (
                        <p className="text-slate-300 italic pt-1 border-t border-slate-800/80">
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
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4">
                <p className="text-xs uppercase font-semibold text-emerald-400">AI Fit Score</p>
                <p className="text-3xl font-bold text-emerald-300">{evalResult.fit_score}%</p>
                <p className="text-xs text-slate-300 mt-2">{evalResult.summary}</p>
              </div>
              <Button
                onClick={() => setSelectedDrive(null)}
                className="w-full bg-slate-800 hover:bg-slate-700"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import { FileUp, CheckCircle2, ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { applyToPlacementDrive } from '@/app/actions/placement';
import { evaluateEligibility } from '@/lib/pep-engine';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { Card } from '@/components/editorial/Card';
import { Stamp } from '@/components/editorial/Stamp';
import { Callout } from '@/components/editorial/Callout';
import { MarginNote } from '@/components/editorial/MarginNote';
import { Drawer } from '@/components/editorial/Drawer';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

export default function StudentDrivesPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [myApplications, setMyApplications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Drawer State for Resume Upload & AI Screening
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  const supabase = createClient();
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
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
      toast(
        'PEP Rule 1 Gate: Your academic record must be verified & locked by your College TPO before applying.',
        'brick'
      );
      return;
    }
    setSelectedDrive(drive);
    setResumeFile(null);
    setEvalResult(null);
  };

  const handleConfirmApplication = async () => {
    if (!selectedDrive || !resumeFile) {
      toast('Please select a PDF resume document.', 'brick');
      return;
    }

    setUploading(true);

    // 1. Validate against PEP Engine Server Action
    const applyRes = await applyToPlacementDrive(selectedDrive.id);
    if (!applyRes.success) {
      toast(`PEP Policy Gate Blocked: ${applyRes.error}`, 'brick');
      setUploading(false);
      return;
    }

    // 2. Retrieve newly created application ID
    const { data: appData } = await supabase
      .from('drive_applications')
      .select('id')
      .eq('drive_id', selectedDrive.id)
      .eq('student_id', student.id)
      .single();

    if (!appData) {
      toast('Failed to retrieve application record.', 'brick');
      setUploading(false);
      return;
    }

    // 3. Screen Resume via Gemini AI endpoint
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
      toast(`Application submitted! AI Match Score: ${screenData.fit_score}%`, 'jade');
      loadData();
    } else {
      toast(`AI Screening Notice: ${screenData.error}`, 'ochre');
      loadData();
    }
  };

  return (
    <AppShell role="student">
      <PageTransition className="space-y-6">
        <Masthead
          context="02 · CORPORATE PLACEMENT REGISTER · PEP + AI SCREENER"
          title="Active Placement Drives."
          lede="Every application is gated by the pure functional Placement Eligibility Policy (PEP) engine and scored in real time by Gemini AI."
        />

        {student && !student.is_locked && (
          <Callout tone="ochre" title="PEP Rule 1 Notice: Academic Record Awaiting TPO Lock">
            Your submitted CGPA and backlog record are awaiting verification from your College TPO. You may inspect drive cutoffs below; application buttons will unlock upon verification.
          </Callout>
        )}

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-fg-soft">
            Loading placement drives...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => {
              const application = myApplications[drive.id];
              const pepCheck = student ? evaluateEligibility(student, drive) : { eligible: true, reasons: [] };

              return (
                <Card key={drive.id} className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <Stamp
                        tone={
                          drive.tier === 'TIER_1'
                            ? 'ochre'
                            : drive.tier === 'TIER_2'
                            ? 'jade'
                            : 'ink'
                        }
                      >
                        {drive.tier}
                      </Stamp>
                      <span className="font-mono text-xs text-fg-soft">
                        Cutoff: <strong className="text-fg">{drive.cgpa_cutoff} CGPA</strong>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-semibold text-xl text-fg">
                        {drive.company_name}
                      </h3>
                      <p className="font-sans text-xs text-accent font-medium mt-0.5">
                        {drive.role_title}
                      </p>
                    </div>

                    <div className="font-mono text-sm font-bold text-jade">
                      ₹{drive.min_ctc} – ₹{drive.max_ctc} LPA
                    </div>

                    {drive.description && (
                      <p className="text-xs text-fg-soft line-clamp-3 leading-relaxed">
                        {drive.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-line space-y-3">
                    {application ? (
                      <div className="rounded-control bg-bg p-3 border border-line space-y-2">
                        <div className="flex items-center justify-between font-mono text-xs">
                          <span className="text-fg-soft">STAGE:</span>
                          <Stamp
                            tone={
                              application.stage === 'OFFERED'
                                ? 'jade'
                                : application.stage === 'REJECTED'
                                ? 'brick'
                                : 'ochre'
                            }
                          >
                            {application.stage}
                          </Stamp>
                        </div>
                        {application.ai_fit_score && (
                          <div className="flex items-center justify-between font-mono text-xs">
                            <span className="text-fg-soft">GEMINI FIT SCORE:</span>
                            <span className="font-bold text-jade">{application.ai_fit_score}%</span>
                          </div>
                        )}
                        {application.ai_feedback_summary && (
                          <MarginNote label="AI SCREENING AUDIT">
                            &ldquo;{application.ai_feedback_summary}&rdquo;
                          </MarginNote>
                        )}
                      </div>
                    ) : (
                      <>
                        {!pepCheck.eligible && (
                          <div className="p-2.5 rounded-control bg-brick-tint/40 border border-brick/30 text-[11px] text-brick flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            <span>{pepCheck.reasons[0]}</span>
                          </div>
                        )}
                        <Button
                          variant={pepCheck.eligible ? 'primary' : 'secondary'}
                          disabled={!pepCheck.eligible}
                          onClick={() => handleApplyClick(drive)}
                          className="w-full"
                        >
                          {pepCheck.eligible ? 'Apply with Resume PDF' : 'PEP Policy Restricted'}
                        </Button>
                      </>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Slide-Over Drawer for Resume Upload & Gemini Screening */}
        <Drawer
          open={Boolean(selectedDrive)}
          onClose={() => setSelectedDrive(null)}
          title={`Apply to ${selectedDrive?.company_name || ''}`}
          subtitle={`${selectedDrive?.role_title || ''} · ${selectedDrive?.tier || ''}`}
        >
          {!evalResult ? (
            <div className="space-y-5">
              <Callout tone="ink" title="Multi-Factor Gemini AI Resume Evaluation">
                Your PDF resume is sanitized against prompt injection and evaluated across CS Fundamentals (40%), Technical Project Depth (30%), and Coursework (30%).
              </Callout>

              <div className="rounded-xl border-2 border-dashed border-line bg-bg p-6 text-center">
                <label htmlFor="drive-resume-input" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileUp className="w-7 h-7 text-accent" />
                  <span className="font-sans text-xs font-semibold text-fg underline">
                    {resumeFile ? resumeFile.name : 'Choose PDF Resume to Upload'}
                  </span>
                  <span className="font-mono text-[10px] text-fg-soft">
                    PDF format required
                  </span>
                  <input
                    id="drive-resume-input"
                    type="file"
                    accept="application/pdf,.pdf"
                    onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <Button
                variant="primary"
                icon={FileUp}
                loading={uploading}
                disabled={!resumeFile || uploading}
                onClick={handleConfirmApplication}
                className="w-full"
              >
                {uploading ? 'Evaluating with Gemini AI...' : 'Verify PEP & Submit Application'}
              </Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="p-5 rounded-object border border-jade/40 bg-jade-tint/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-jade">
                    COMPOSITE AI FIT SCORE
                  </span>
                  <Stamp tone="jade">SCREENED</Stamp>
                </div>
                <div className="font-display text-4xl font-bold text-fg">
                  {evalResult.fit_score}%
                </div>
                <MarginNote label="STRUCTURED EVALUATOR FEEDBACK">
                  {evalResult.summary}
                </MarginNote>
              </div>

              <Button
                variant="secondary"
                onClick={() => setSelectedDrive(null)}
                className="w-full"
              >
                Done &amp; Return to Drives
              </Button>
            </div>
          )}
        </Drawer>
      </PageTransition>
    </AppShell>
  );
}

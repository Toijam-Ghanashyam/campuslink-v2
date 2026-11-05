import React, { useState } from 'react';
import { Lock, FileUp, CheckCircle2, Shield, UploadCloud, FileText, Check, AlertCircle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TagInput } from '../../components/ui/TagInput';
import { Callout } from '../../components/ui/Callout';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function StudentProfile() {
  const { currentStudent, submitProfile } = useStore();
  const { toast } = useToast();

  const [skills, setSkills] = useState(currentStudent.skills || ['React', 'Node.js', 'Python', 'PostgreSQL', 'Tailwind CSS']);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('ananya_sharma_resume_v2.pdf');
  const [resumeSize, setResumeSize] = useState('242 KB');

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setResumeFileName(file.name);
      setResumeSize(`${(file.size / 1024).toFixed(1)} KB`);
      toast(`Attached ${file.name}`, 'jade');
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      submitProfile(skills, resumeFileName);
      toast('Profile & transcript sent to Placement Cell for audit!', 'jade');
    } catch {
      toast('Failed to submit profile', 'brick');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-8 max-w-4xl">
      {/* Page Title */}
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Profile & Verified Credentials
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Manage your verified student records, technical skill proficiencies, and resume portfolio.
        </p>
      </div>

      {/* Card 1: Locked Academic Data (Admin Controlled) */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-bone border border-line flex items-center justify-center text-ink-soft">
              <Lock className="w-4 h-4 stroke-[1.75]" />
            </div>
            <div>
              <h3 className="font-display font-semibold text-lg text-ink">
                Locked Academic Data (Managed by Placement Cell)
              </h3>
              <p className="text-xs text-ink-soft">
                Verified university records synced with BPUT Central Examination Controller.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-jade-tint text-jade border border-jade/20">
            Locked & Audited
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-bone/40 rounded-xl border border-line">
            <span className="text-ink-soft block uppercase text-[10px] tracking-wider mb-1 font-semibold">
              BPUT Registration ID
            </span>
            <span className="font-mono text-sm font-semibold text-ink">
              {currentStudent.collegeId}
            </span>
          </div>

          <div className="p-3.5 bg-bone/40 rounded-xl border border-line">
            <span className="text-ink-soft block uppercase text-[10px] tracking-wider mb-1 font-semibold">
              Degree Discipline
            </span>
            <span className="text-sm font-semibold text-ink truncate block">
              {currentStudent.shortBranch} (B.Tech)
            </span>
          </div>

          <div className="p-3.5 bg-bone/40 rounded-xl border border-line">
            <span className="text-ink-soft block uppercase text-[10px] tracking-wider mb-1 font-semibold">
              Cumulative CGPA
            </span>
            <span className="font-display text-lg font-bold text-ink">
              {currentStudent.cgpa} <span className="text-xs font-sans font-normal text-ink-soft">/ 10.0</span>
            </span>
          </div>

          <div className="p-3.5 bg-bone/40 rounded-xl border border-line">
            <span className="text-ink-soft block uppercase text-[10px] tracking-wider mb-1 font-semibold">
              Active Backlogs
            </span>
            <span className="text-sm font-semibold text-jade">
              0 Active Backlogs
            </span>
          </div>
        </div>
      </Card>

      {/* Card 2: Technical Skills Matrix */}
      <Card className="p-6">
        <div className="mb-4">
          <h3 className="font-display font-semibold text-lg text-ink">
            Technical Stack & Frameworks
          </h3>
          <p className="text-xs text-ink-soft mt-0.5">
            Add or adjust your verified proficiencies. These skills are matched by our semantic AI engine against corporate recruiter JNF requirements.
          </p>
        </div>

        <TagInput
          tags={skills}
          onChange={setSkills}
          placeholder="Type a skill and press Enter (e.g., Docker, Next.js, AWS)..."
          className="mb-3"
        />

        <p className="text-[11px] text-ink-soft">
          Press <kbd className="px-1 py-0.5 bg-bone rounded border border-line font-mono text-[10px]">Enter</kbd> or comma to append a skill badge.
        </p>
      </Card>

      {/* Card 3: Resume & Credential Verification */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-4 border-b border-line mb-6">
          <div>
            <h3 className="font-display font-semibold text-lg text-ink">
              Current Uploaded Resume
            </h3>
            <p className="text-xs text-ink-soft mt-0.5">
              Verified by NLP parsing engine. ATS compliance rating: <strong className="text-ink">88%</strong>
            </p>
          </div>

          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-line bg-paper text-ink text-xs font-medium hover:bg-bone transition-colors shadow-subtle">
              <UploadCloud className="w-3.5 h-3.5" />
              Upload New PDF
            </span>
          </label>
        </div>

        {/* File Preview Card */}
        <div className="p-4 bg-bone/50 rounded-xl border border-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-paper border border-line flex items-center justify-center text-ink shrink-0">
              <FileText className="w-5 h-5 text-ochre-deep stroke-[1.75]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{resumeFileName}</p>
              <p className="text-xs text-ink-soft">{resumeSize} · PDF Document · Verified Format</p>
            </div>
          </div>

          <span className="text-xs font-semibold text-jade flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Verified
          </span>
        </div>
      </Card>

      {/* Callout Notice */}
      <Callout tone="ochre" title="Verification Protocol Notice">
        Modifying your technical competencies triggers an automatic verification task in the Placement Cell Queue. Your status will display as "Pending Verification" until certified by an administrator.
      </Callout>

      {/* Submit Action Row */}
      <div className="flex items-center justify-end gap-3 pt-4">
        <Button
          variant="secondary"
          onClick={() => setSkills(currentStudent.skills)}
          disabled={submitting}
        >
          Reset Changes
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={submitting}
        >
          Submit for Verification
        </Button>
      </div>
    </PageTransition>
  );
}


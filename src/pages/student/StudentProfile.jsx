import React, { useState } from 'react';
import { Lock, FileText, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Stamp } from '../../components/ui/Stamp';
import { Button } from '../../components/ui/Button';
import { TagInput } from '../../components/ui/TagInput';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { useTilt } from '../../fx/useTilt';

export function StudentProfile() {
  const { currentStudent, submitProfile } = useStore();
  const { toast } = useToast();
  const recordTilt = useTilt({ max: 5 });

  const [skills, setSkills] = useState(currentStudent.skills || ['React', 'Node.js', 'Python', 'PostgreSQL', 'Tailwind CSS']);
  const [submitting, setSubmitting] = useState(false);
  const [resumeFileName, setResumeFileName] = useState('zahid_khan_transcript_v2.pdf');
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
      await new Promise((r) => setTimeout(r, 850));
      submitProfile(skills, resumeFileName);
      toast('Profile & transcript sent to Central Placement Cell for audit!', 'jade');
    } catch {
      toast('Failed to submit profile', 'brick');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition className="space-y-6 sm:space-y-8 max-w-4xl">
      <Masthead
        context={`02 · STUDENT RECORDS · ${currentStudent.collegeId}`}
        title="Academic Record & Skills."
        lede="Certified university grades locked by BPUT Directorate. Add technical stack competencies to trigger semantic recruiter matching."
        action={
          <Stamp tone={currentStudent.verified ? 'jade' : 'ochre'}>
            {currentStudent.verified ? 'VERIFIED' : 'PENDING AUDIT'}
          </Stamp>
        }
      />

      {/* Academic Record Slip (L2 Object) */}
      <div
        ref={recordTilt.ref}
        onPointerMove={recordTilt.onPointerMove}
        onPointerLeave={recordTilt.onPointerLeave}
        className="tilt glass-strong rounded-object border border-line p-4 sm:p-6 shadow-object space-y-4"
      >
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-fg-soft stroke-[1.75]" />
            <h3 className="font-display font-medium text-base sm:text-lg text-fg">
              Official University Record
            </h3>
          </div>
          <Stamp tone="ink">LOCKED</Stamp>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 font-mono text-xs">
          <div className="p-3 bg-surface/50 rounded-xs border border-line">
            <span className="text-fg-soft block text-[9.5px] sm:text-[10px] uppercase tracking-wider mb-1 truncate">
              BPUT REG NO.
            </span>
            <strong className="text-fg text-xs sm:text-sm font-semibold truncate block">{currentStudent.collegeId}</strong>
          </div>

          <div className="p-3 bg-surface/50 rounded-xs border border-line">
            <span className="text-fg-soft block text-[9.5px] sm:text-[10px] uppercase tracking-wider mb-1 truncate">
              DISCIPLINE
            </span>
            <strong className="text-fg text-xs sm:text-sm font-semibold truncate block">{currentStudent.shortBranch}</strong>
          </div>

          <div className="p-3 bg-surface/50 rounded-xs border border-line">
            <span className="text-fg-soft block text-[9.5px] sm:text-[10px] uppercase tracking-wider mb-1 truncate">
              CGPA
            </span>
            <strong className="text-fg text-xs sm:text-sm font-semibold font-display text-base">
              {currentStudent.cgpa} / 10.0
            </strong>
          </div>

          <div className="p-3 bg-surface/50 rounded-xs border border-line">
            <span className="text-fg-soft block text-[9.5px] sm:text-[10px] uppercase tracking-wider mb-1 truncate">
              BACKLOGS
            </span>
            <strong className="text-jade text-xs sm:text-sm font-semibold">0 Active</strong>
          </div>
        </div>
      </div>

      {/* Technical Skills Section */}
      <div className="space-y-3 pt-2">
        <div className="border-b border-line pb-2 flex items-center justify-between flex-wrap gap-2">
          <span className="font-mono text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold text-fg-soft">
            01 · TECHNICAL STACK &amp; FRAMEWORKS
          </span>
          <span className="font-mono text-[10px] text-fg-soft">
            PARSED FOR JNF EMBEDDINGS
          </span>
        </div>

        <TagInput
          tags={skills}
          onChange={setSkills}
          placeholder="Type a skill and press Enter (e.g., Docker, Next.js, AWS)..."
        />

        <p className="font-mono text-[10px] sm:text-[10.5px] text-fg-soft">
          Press Enter or comma to append a skill tag.
        </p>
      </div>

      {/* Resume Section */}
      <div className="space-y-3 pt-2">
        <div className="border-b border-line pb-2 flex items-center justify-between flex-wrap gap-2">
          <span className="font-mono text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold text-fg-soft">
            02 · OFFICIAL RESUME PDF
          </span>
          <label className="cursor-pointer">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="font-mono text-[11px] text-fg hover:text-accent-deep dark:hover:text-accent font-semibold underline underline-offset-4">
              Upload New PDF Slip →
            </span>
          </label>
        </div>

        <div className="p-3.5 sm:p-4 bg-surface/50 rounded-object border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-accent-deep dark:text-accent shrink-0" />
            <div className="min-w-0">
              <p className="font-semibold text-fg truncate">{resumeFileName}</p>
              <p className="text-[11px] text-fg-soft">{resumeSize} · Verified Format</p>
            </div>
          </div>
          <span className="text-jade font-semibold flex items-center gap-1 shrink-0 self-end sm:self-center">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
          </span>
        </div>
      </div>

      {/* Action Row */}
      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-line">
        <Button
          variant="secondary"
          onClick={() => setSkills(currentStudent.skills)}
          disabled={submitting}
          className="w-full sm:w-auto"
        >
          Reset Changes
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={submitting}
          className="w-full sm:w-auto"
        >
          Submit for Audit
        </Button>
      </div>
    </PageTransition>
  );
}

export default StudentProfile;

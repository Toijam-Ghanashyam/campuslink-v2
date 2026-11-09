import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { StatStrip } from '../../components/ui/StatStrip';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { TagInput } from '../../components/ui/TagInput';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';
import { useMagnetic } from '../../fx/useTilt';

export function RecruiterOverview() {
  const { analytics, pipeline, recruiterScheduledCount } = useStore();
  const { toast } = useToast();
  const magJnf = useMagnetic({ strength: 0.25 });
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [jobRole, setJobRole] = useState('');
  const [jobCtc, setJobCtc] = useState('18.0 - 22.0 LPA');
  const [minCgpa, setMinCgpa] = useState('8.0');
  const [skills, setSkills] = useState(['React', 'System Design', 'Cloud Computing']);

  const funnel = analytics.recruiterFunnel || [];

  const handlePostJob = (e) => {
    e.preventDefault();
    if (!jobRole) {
      toast('Please specify job title', 'brick');
      return;
    }
    toast(`Job Notification Form for ${jobRole} posted to BPUT Placement Cell!`, 'jade');
    setDrawerOpen(false);
    setJobRole('');
  };

  return (
    <PageTransition className="space-y-6 sm:space-y-8">
      <Masthead
        context="01 · RECRUITER DESK · MICROSOFT INDIA"
        title="Associate Software Engineer."
        lede="Drive: Associate SDE 2026. 342 BPUT candidates pre-screened; 48 match above the 85% benchmark."
        action={
          <span
            ref={magJnf.ref}
            onPointerMove={magJnf.onPointerMove}
            onPointerLeave={magJnf.onPointerLeave}
            className="inline-block w-full sm:w-auto"
          >
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setDrawerOpen(true)}
              className="w-full sm:w-auto"
            >
              Post New JNF
            </Button>
          </span>
        }
      />

      {/* Ruled Macro StatStrip */}
      <StatStrip
        items={[
          { label: 'TOTAL APPLICANTS', value: 342, hint: 'CSE, IT & ECE cohorts' },
          { label: 'AI MATCH > 85%', value: 48, hint: 'Pre-screened elite talent' },
          { label: 'INTERVIEWS SCHEDULED', value: recruiterScheduledCount, hint: 'upcoming, 31 completed' },
          { label: 'OFFERS EXTENDED', value: 16, hint: 'Target: 20 hires' },
        ]}
      />

      {/* Recruitment Selection Funnel */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-line pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
          <span className="font-mono text-[10.5px] sm:text-[11px] uppercase tracking-wider font-semibold text-fg-soft">
            CANDIDATE SELECTION FUNNEL CONVERSION
          </span>
          <span className="font-mono text-[10px] text-jade uppercase font-semibold">
            14.0% OVERALL CONVERSION
          </span>
        </div>

        <div className="space-y-4 max-w-2xl py-2">
          {funnel.map((stage, idx) => (
            <div key={stage.stage} className="space-y-1">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-fg font-semibold">{stage.stage}</span>
                <span className="text-fg-soft">
                  <strong className="text-fg font-display text-xs sm:text-sm">{stage.count}</strong> candidates ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-surface/50 rounded-full overflow-hidden border border-line">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(stage.percentage, 4)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: idx * 0.12 }}
                  className="h-full bg-accent rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Slide-Over Drawer: Post New JNF */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Post Job Notification Form (JNF)"
        subtitle="Deploys verified recruitment requirements across all BPUT engineering campuses"
      >
        <form onSubmit={handlePostJob} className="space-y-4">
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-fg-soft block mb-1">
              Job Title / Designation *
            </label>
            <input
              type="text"
              required
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g., Software Development Engineer - 1"
              className="w-full px-3 py-2 rounded-control border border-line bg-surface text-fg font-sans text-sm focus:outline-none focus:border-accent min-h-[40px]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-fg-soft block mb-1">
                Annual Compensation (CTC)
              </label>
              <input
                type="text"
                value={jobCtc}
                onChange={(e) => setJobCtc(e.target.value)}
                className="w-full px-3 py-2 rounded-control border border-line bg-surface text-fg font-mono text-sm focus:outline-none focus:border-accent min-h-[40px]"
              />
            </div>

            <div>
              <label className="font-mono text-[11px] uppercase tracking-wider text-fg-soft block mb-1">
                Minimum CGPA Cutoff
              </label>
              <input
                type="text"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="w-full px-3 py-2 rounded-control border border-line bg-surface text-fg font-mono text-sm focus:outline-none focus:border-accent min-h-[40px]"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-fg-soft block mb-1">
              Key Competency Tags (Semantic Matching)
            </label>
            <TagInput tags={skills} onChange={setSkills} />
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 border-t border-line">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDrawerOpen(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="w-full sm:w-auto">
              Broadcast JNF to BPUT
            </Button>
          </div>
        </form>
      </Drawer>
    </PageTransition>
  );
}

export default RecruiterOverview;

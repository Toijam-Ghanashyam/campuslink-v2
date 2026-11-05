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

export function RecruiterOverview() {
  const { analytics, pipeline } = useStore();
  const { toast } = useToast();
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
    <PageTransition className="space-y-8">
      <Masthead
        context="01 · RECRUITER DESK · MICROSOFT INDIA"
        title="Associate Software Engineer."
        lede="Drive: Associate SDE 2026. 342 BPUT candidates pre-screened; 48 match above the 85% benchmark."
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setDrawerOpen(true)}
          >
            Post New JNF
          </Button>
        }
      />

      {/* Ruled Macro StatStrip */}
      <StatStrip
        items={[
          { label: 'TOTAL APPLICANTS', value: 342, hint: 'CSE, IT & ECE cohorts' },
          { label: 'AI MATCH > 85%', value: 48, hint: 'Pre-screened elite talent' },
          { label: 'INTERVIEWS SCHEDULED', value: 12, hint: 'Slot conflict checks verified' },
          { label: 'OFFERS EXTENDED', value: 16, hint: 'Target: 20 hires' },
        ]}
      />

      {/* Recruitment Selection Funnel */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-line pb-2 flex items-center justify-between">
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
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
                <span className="text-ink font-semibold">{stage.stage}</span>
                <span className="text-ink-soft">
                  <strong className="text-ink font-display text-sm">{stage.count}</strong> candidates ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-bone rounded-full overflow-hidden border border-line">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(stage.percentage, 4)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: idx * 0.12 }}
                  className="h-full bg-ochre rounded-full"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post JNF Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Post New Job Notification Form (JNF)"
        subtitle="Registers job criteria with automated eligibility and AI candidate matching."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handlePostJob}>
              Publish JNF
            </Button>
          </>
        }
      >
        <form onSubmit={handlePostJob} className="space-y-4 font-sans text-xs">
          <div>
            <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
              Job Title / Designation
            </label>
            <input
              type="text"
              required
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Associate SDE - Cloud & AI Systems"
              className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
                Offered CTC Package
              </label>
              <input
                type="text"
                value={jobCtc}
                onChange={(e) => setJobCtc(e.target.value)}
                className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
            <div>
              <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
                Minimum CGPA Cut-off
              </label>
              <input
                type="text"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>

          <div>
            <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
              Required Technical Stack
            </label>
            <TagInput
              tags={skills}
              onChange={setSkills}
              placeholder="Type required skill and press Enter..."
            />
          </div>
        </form>
      </Drawer>
    </PageTransition>
  );
}

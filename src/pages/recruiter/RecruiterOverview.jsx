import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Sparkles, Calendar, Award, Plus, Briefcase, TrendingUp } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { TagInput } from '../../components/ui/TagInput';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function RecruiterOverview() {
  const { analytics, pipeline } = useStore();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // JNF Form State
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
      {/* Banner Card */}
      <Card className="p-6 bg-paper border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-ochre-deep block mb-1">
            Microsoft India University Recruitment
          </span>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-ink tracking-tight">
            Campus Hiring Pipeline 2026
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Active Drive: Software Development Engineer (SDE). 342 BPUT candidates processed through AI screening.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setDrawerOpen(true)}
          className="shrink-0"
        >
          Post New Job (JNF)
        </Button>
      </Card>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Total Applicants"
          value={342}
          icon={Users}
          hint="From CSE, IT & ECE disciplines"
        />
        <MetricCard
          label="AI Match > 85%"
          value={48}
          icon={Sparkles}
          hint="Pre-screened elite talent"
        />
        <MetricCard
          label="Interviews Booked"
          value={12}
          icon={Calendar}
          hint="Slot conflict checks verified"
        />
        <MetricCard
          label="Offers Extended"
          value={16}
          icon={Award}
          hint="Target goal: 20 hires"
        />
      </div>

      {/* Recruitment Funnel Visualizer */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-line">
          <div>
            <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">
              Conversion Optimization
            </span>
            <h3 className="font-display font-semibold text-lg text-ink">
              Candidate Selection Funnel
            </h3>
          </div>
          <span className="text-xs text-jade font-semibold">14.0% Overall Conversion</span>
        </div>

        <div className="space-y-4 max-w-3xl mx-auto py-2">
          {funnel.map((stage, idx) => (
            <div key={stage.stage} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-ink">{stage.stage}</span>
                <span className="font-mono text-ink-soft">
                  <strong className="text-ink text-sm font-display">{stage.count}</strong> candidates ({stage.percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-4 w-full bg-bone rounded-lg overflow-hidden border border-line p-0.5">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${Math.max(stage.percentage, 6)}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: idx * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="h-full rounded-md bg-gradient-to-r from-ochre to-ochre-deep"
                />
              </div>
            </div>
          ))}
        </div>
      </Card>

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
        <form onSubmit={handlePostJob} className="space-y-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
              Job Title / Designation
            </label>
            <input
              type="text"
              required
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              placeholder="e.g. Associate SDE - Cloud & AI Systems"
              className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
                Offered CTC Package
              </label>
              <input
                type="text"
                value={jobCtc}
                onChange={(e) => setJobCtc(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
                Minimum CGPA Cut-off
              </label>
              <input
                type="text"
                value={minCgpa}
                onChange={(e) => setMinCgpa(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
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


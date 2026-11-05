import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { Plus } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { StatStrip } from '../../components/ui/StatStrip';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminCommandCenter() {
  const { analytics } = useStore();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formDate, setFormDate] = useState('2026-11-25');
  const [formVenue, setFormVenue] = useState('Auditorium B');
  const [formBranches, setFormBranches] = useState('CSE, IT');

  const handleCreateDrive = (e) => {
    e.preventDefault();
    if (!formCompany || !formRole) {
      toast('Please enter company and role', 'brick');
      return;
    }
    toast(`Drive for ${formCompany} scheduled! Conflict check passed.`, 'jade');
    setDrawerOpen(false);
    setFormCompany('');
    setFormRole('');
  };

  return (
    <PageTransition className="space-y-8">
      {/* Editorial Masthead */}
      <Masthead
        context="01 · PLACEMENT DIRECTORATE · BPUT CENTRAL CAMPUS"
        title="Placement Command Center."
        lede="Overseeing 1,420 registered candidates across 6 engineering disciplines and 42 active corporate recruitment partners."
        action={
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => setDrawerOpen(true)}
          >
            Authorize New Drive
          </Button>
        }
      />

      {/* Ruled Macro StatStrip */}
      <StatStrip
        items={[
          { label: 'ELIGIBLE STUDENTS', value: analytics.overview.totalStudents, hint: '1,180 verified placement ready' },
          { label: 'ACTIVE RECRUITERS', value: analytics.overview.activeRecruiters, hint: '42 authorized JNFs' },
          { label: 'OVERALL PLACED %', value: analytics.overview.placementPercentage, suffix: '%', decimals: 1, hint: 'Target benchmark: 85%' },
          { label: 'HIGHEST CTC', value: analytics.overview.highestPackage, prefix: '₹', suffix: ' LPA', decimals: 1, hint: 'Average: 9.4 LPA' },
        ]}
      />

      {/* Two Recharts Charts in Ruled Grid (No Card Boxes!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-2">
        {/* Chart 1: Branch Conversion (Left 6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="border-b border-line pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
              01 · BRANCH-WISE CONVERSION (%)
            </span>
            <span className="font-mono text-[10px] text-jade uppercase font-semibold">
              CSE: 82% LEADING
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.branchConversion}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF" />
                <XAxis
                  dataKey="branch"
                  tick={{ fill: '#14161C', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5B5F6B', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: '#F6F2E9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-ink text-bone p-2 rounded-xs font-mono text-[11px] space-y-0.5">
                          <p className="font-bold">{payload[0].payload.branch}</p>
                          <p className="text-ochre">{payload[0].value}% Placed</p>
                          <p className="text-bone/60">{payload[0].payload.placed} of {payload[0].payload.total} candidates</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="conversion"
                  fill="#14161C"
                  radius={[3, 3, 0, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="font-serif italic text-xs text-ink-soft pt-1">
            Civil and Mechanical convert at roughly half the rate of Computer Science and IT.
          </p>
        </div>

        {/* Chart 2: Historical Package Trends (Right 6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="border-b border-line pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
              02 · COMPENSATION TRAJECTORY (LPA)
            </span>
            <span className="font-mono text-[10px] text-ochre-deep uppercase font-semibold">
              HIGHEST: ₹34.0 LPA
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.packageTrend}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#14161C', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5B5F6B', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-ink text-bone p-2 rounded-xs font-mono text-[11px] space-y-0.5">
                          <p className="font-bold">Season {payload[0].payload.year}</p>
                          <p className="text-ochre">Highest: ₹{payload[1]?.value} LPA</p>
                          <p className="text-bone/80">Average: ₹{payload[0]?.value} LPA</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#14161C"
                  strokeWidth={2}
                  dot={{ fill: '#14161C', r: 3 }}
                  name="Average"
                />
                <Line
                  type="monotone"
                  dataKey="highest"
                  stroke="#E8A33D"
                  strokeWidth={2.5}
                  dot={{ fill: '#E8A33D', r: 4 }}
                  name="Highest"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="font-serif italic text-xs text-ink-soft pt-1">
            Highest package has increased 2.1x since 2022 due to cloud infrastructure and AI roles.
          </p>
        </div>
      </div>

      {/* Offers Pipeline Strip (Single Ruled Row with Arrows) */}
      <div className="border-t border-line pt-6">
        <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft block mb-3">
          03 · OFFERS &amp; JOINING FUNNEL STATUS
        </span>
        <div className="p-4 bg-bone/50 border border-line rounded-object flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
          <div>
            <span className="text-ink-soft block text-[10px]">TOTAL OFFERED</span>
            <strong className="font-display text-2xl text-ink">16</strong>
          </div>
          <span className="text-line text-lg hidden sm:inline">→</span>
          <div>
            <span className="text-jade block text-[10px]">ACCEPTED OFFERS</span>
            <strong className="font-display text-2xl text-jade">11</strong>
          </div>
          <span className="text-line text-lg hidden sm:inline">→</span>
          <div>
            <span className="text-ochre-deep block text-[10px]">PENDING DECISION</span>
            <strong className="font-display text-2xl text-ochre-deep">05</strong>
          </div>
          <span className="text-line text-lg hidden sm:inline">→</span>
          <div>
            <span className="text-brick block text-[10px]">DOCS PENDING</span>
            <strong className="font-display text-2xl text-brick">03</strong>
          </div>
        </div>
      </div>

      {/* Authorize New Drive Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Authorize New Placement Drive"
        subtitle="Registers job notification form into the automated conflict checker."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateDrive}>
              Validate &amp; Authorize
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDrive} className="space-y-4 font-sans text-xs">
          <div>
            <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
              Recruiting Partner Name
            </label>
            <input
              type="text"
              required
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              placeholder="e.g. Google India, Amazon Web Services..."
              className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div>
            <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
              Role Profile
            </label>
            <input
              type="text"
              required
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder="e.g. Associate Cloud Engineer, SDE-1..."
              className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
                Drive Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
            <div>
              <label className="font-mono text-[10.5px] uppercase font-semibold text-ink-soft block mb-1">
                Requested Venue
              </label>
              <input
                type="text"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                className="w-full p-2.5 rounded-control border border-line bg-paper text-ink focus:outline-none focus:ring-1 focus:ring-ink"
              />
            </div>
          </div>
        </form>
      </Drawer>
    </PageTransition>
  );
}

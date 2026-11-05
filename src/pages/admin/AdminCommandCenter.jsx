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
import { Plus, Users, Building2, TrendingUp, Award, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { Button } from '../../components/ui/Button';
import { Drawer } from '../../components/ui/Drawer';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminCommandCenter() {
  const { analytics, drives } = useStore();
  const { toast } = useToast();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // New Drive Form State
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
      {/* Top Banner Card */}
      <Card className="p-6 bg-paper border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-ochre-deep block mb-1">
            Central Placement Directorate
          </span>
          <h1 className="font-display font-semibold text-2xl sm:text-3xl text-ink tracking-tight">
            Placement Season 2026 Command Center
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft mt-1">
            Overseeing 1,420 registered students, 42 corporate hiring partners, and active drive schedules.
          </p>
        </div>

        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setDrawerOpen(true)}
          className="shrink-0"
        >
          Authorize New Drive
        </Button>
      </Card>

      {/* 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <MetricCard
          label="Eligible Students"
          value={analytics.overview.totalStudents}
          icon={Users}
          hint="1,180 verified placement ready"
        />
        <MetricCard
          label="Active Recruiters"
          value={analytics.overview.activeRecruiters}
          icon={Building2}
          hint="42 authorized JNFs"
        />
        <MetricCard
          label="Overall Placed %"
          value={analytics.overview.placementPercentage}
          suffix="%"
          decimals={1}
          icon={TrendingUp}
          hint="Target benchmark: 85%"
        />
        <MetricCard
          label="Highest CTC"
          value={analytics.overview.highestPackage}
          prefix="₹"
          suffix=" LPA"
          decimals={1}
          icon={Award}
          hint="Average: 9.4 LPA"
        />
      </div>

      {/* Recharts Analytics Charts Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Chart 1: Branch Conversion */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">
                Branch-Wise Conversion
              </span>
              <h3 className="font-display font-semibold text-lg text-ink">
                Placement Conversion Rates (%)
              </h3>
            </div>
            <span className="text-xs text-jade font-semibold">CSE Leading @ 82%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={analytics.branchConversion}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF" />
                <XAxis
                  dataKey="branch"
                  tick={{ fill: '#5B5F6B', fontSize: 12, fontFamily: 'Manrope' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5B5F6B', fontSize: 12, fontFamily: 'Manrope' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: '#F6F2E9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-paper p-2.5 rounded-lg border border-line shadow-lg text-xs font-medium">
                          <p className="font-semibold text-ink">{payload[0].payload.branch}</p>
                          <p className="text-ochre-deep font-display font-bold text-sm">
                            {payload[0].value}% Placed
                          </p>
                          <p className="text-ink-soft text-[10px]">
                            {payload[0].payload.placed} of {payload[0].payload.total} candidates
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="conversion"
                  fill="#E8A33D"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Package Growth Trends */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">
                Compensation Trajectory
              </span>
              <h3 className="font-display font-semibold text-lg text-ink">
                Package Trend 2022 - 2026
              </h3>
            </div>
            <span className="text-xs text-ink-soft">Avg vs Highest LPA</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={analytics.packageTrend}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF" />
                <XAxis
                  dataKey="year"
                  tick={{ fill: '#5B5F6B', fontSize: 12, fontFamily: 'Manrope' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#5B5F6B', fontSize: 12, fontFamily: 'Manrope' }}
                  axisLine={{ stroke: '#E6DFCF' }}
                  tickLine={false}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-paper p-2.5 rounded-lg border border-line shadow-lg text-xs font-medium space-y-1">
                          <p className="font-semibold text-ink">Season {payload[0].payload.year}</p>
                          <p className="text-ink">
                            Highest: <strong className="font-display font-bold">₹{payload[1]?.value} LPA</strong>
                          </p>
                          <p className="text-ochre-deep">
                            Average: <strong className="font-display font-bold">₹{payload[0]?.value} LPA</strong>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="avg"
                  stroke="#E8A33D"
                  strokeWidth={2.5}
                  dot={{ fill: '#E8A33D', r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Average CTC"
                />
                <Line
                  type="monotone"
                  dataKey="highest"
                  stroke="#14161C"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ fill: '#14161C', r: 4 }}
                  name="Highest CTC"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Offers Pipeline Quick Strip */}
      <Card className="p-4 bg-bone/40 border-line">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-ochre-deep" />
            <span className="text-xs uppercase tracking-wider font-semibold text-ink">
              Offers & Post-Selection Pipeline Status:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-paper border border-line text-ink font-medium">
              Offered: <strong className="font-semibold text-ink">16</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-jade-tint text-jade border border-jade/20 font-medium">
              Accepted: <strong className="font-semibold">11</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-ochre-tint text-ochre-deep border border-ochre/25 font-medium">
              Pending: <strong className="font-semibold">5</strong>
            </span>
            <span className="px-3 py-1 rounded-full bg-brick-tint text-brick border border-brick/20 font-medium">
              Docs Pending: <strong className="font-semibold">3</strong>
            </span>
          </div>
        </div>
      </Card>

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
              Validate & Authorize
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateDrive} className="space-y-4 text-xs">
          <div>
            <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
              Recruiting Partner Name
            </label>
            <input
              type="text"
              required
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              placeholder="e.g. Google India, Amazon Web Services..."
              className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
            />
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
              Role Profile
            </label>
            <input
              type="text"
              required
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder="e.g. Associate Cloud Engineer, SDE-1..."
              className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
                Drive Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
              />
            </div>
            <div>
              <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
                Requested Venue
              </label>
              <input
                type="text"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
              />
            </div>
          </div>

          <div>
            <label className="block uppercase tracking-wider font-semibold text-ink-soft mb-1">
              Eligible Disciplines
            </label>
            <input
              type="text"
              value={formBranches}
              onChange={(e) => setFormBranches(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-line bg-paper text-ink focus:outline-none focus:ring-2 focus:ring-ochre"
            />
          </div>

          <div className="p-3 bg-ochre-tint/40 rounded-xl border border-ochre/30 text-ink leading-relaxed">
            <span className="font-semibold block mb-0.5">Automated Pre-Check</span>
            The conflict engine verifies availability of requested date and room against current scheduled drives.
          </div>
        </form>
      </Drawer>
    </PageTransition>
  );
}


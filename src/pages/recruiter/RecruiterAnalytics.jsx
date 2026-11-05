import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Users, Sparkles, TrendingUp, Award, Clock } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { MetricCard } from '../../components/ui/MetricCard';
import { PageTransition } from '../../components/ui/PageTransition';

export function RecruiterAnalytics() {
  const { analytics } = useStore();

  const branchData = analytics.recruiterBranchBreakdown || [];
  const matchData = analytics.aiMatchDistribution || [];

  return (
    <PageTransition className="space-y-8">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Campus Recruitment Analytics
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Hiring funnel velocity, candidate distribution, and candidate quality scoring metrics.
        </p>
      </div>

      {/* 3 Quick Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <MetricCard
          label="Average AI Match"
          value={78.2}
          suffix="%"
          decimals={1}
          icon={Sparkles}
          hint="Across 342 pre-screened applicants"
        />
        <MetricCard
          label="Offer Acceptance Rate"
          value={88.5}
          suffix="%"
          decimals={1}
          icon={Award}
          hint="High brand conversion index"
        />
        <MetricCard
          label="Average Time-to-Hire"
          value="12 Days"
          icon={Clock}
          hint="From JNF submission to final offer"
        />
      </div>

      {/* 2 Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Branch Breakdown */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">
                Discipline Distribution
              </span>
              <h3 className="font-display font-semibold text-lg text-ink">
                Applicants by Branch
              </h3>
            </div>
            <span className="text-xs text-ink-soft">CSE + IT = 82%</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchData}
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
                />
                <Tooltip
                  cursor={{ fill: '#F6F2E9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-paper p-2.5 rounded-lg border border-line shadow-lg text-xs font-medium">
                          <p className="font-semibold text-ink">{payload[0].payload.branch}</p>
                          <p className="text-ochre-deep font-bold font-display text-sm">
                            {payload[0].value} candidates
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#E8A33D"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* AI Match Score Distribution */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs uppercase tracking-wider font-semibold text-ink-soft">
                Readiness Spread
              </span>
              <h3 className="font-display font-semibold text-lg text-ink">
                AI Match Score Distribution
              </h3>
            </div>
            <span className="text-xs text-jade font-semibold">48 in &gt;85% Tier</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={matchData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF" />
                <XAxis
                  dataKey="range"
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
                  cursor={{ fill: '#F6F2E9' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-paper p-2.5 rounded-lg border border-line shadow-lg text-xs font-medium">
                          <p className="font-semibold text-ink">{payload[0].payload.range}</p>
                          <p className="text-ink font-bold font-display text-sm">
                            {payload[0].value} applicants
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill="#14161C"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </PageTransition>
  );
}


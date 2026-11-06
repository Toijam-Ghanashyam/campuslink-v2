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
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { StatStrip } from '../../components/ui/StatStrip';
import { PageTransition } from '../../components/ui/PageTransition';
import { useThemeTokens } from '../../theme/useThemeTokens';

export function RecruiterAnalytics() {
  const { analytics } = useStore();
  const themeTokens = useThemeTokens();

  const branchData = analytics.recruiterBranchBreakdown || [];
  const matchData = analytics.aiMatchDistribution || [];

  const totalCandidates = matchData.reduce((acc, curr) => acc + curr.count, 0);
  const midpointMap = {
    '90-100%': 95,
    '80-89%': 85,
    '70-79%': 75,
    '60-69%': 65,
    '< 60%': 50,
  };
  const weightedSum = matchData.reduce((acc, curr) => acc + (midpointMap[curr.range] || 60) * curr.count, 0);
  const avgAiMatch = totalCandidates > 0 ? parseFloat((weightedSum / totalCandidates).toFixed(1)) : 74.0;

  return (
    <PageTransition className="space-y-8">
      <Masthead
        context="05 · TALENT ACQUISITION ANALYTICS"
        title="Campus Hiring Analytics."
        lede="Applicant discipline spread, candidate quality distribution, and recruitment velocity indices."
      />

      <StatStrip
        items={[
          { label: 'AVERAGE AI MATCH', value: avgAiMatch, decimals: 1, suffix: '%', hint: 'Across 342 pre-screened applicants' },
          { label: 'OFFER ACCEPTANCE', value: 88.5, decimals: 1, suffix: '%', hint: 'High candidate brand loyalty' },
          { label: 'AVERAGE TIME-TO-HIRE', value: '12 Days', hint: 'From JNF to final offer sign-off' },
        ]}
      />

      {/* 2 Ruled Recharts Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start pt-2">
        {/* Branch Breakdown (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="border-b border-line pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
              01 · APPLICANTS BY BRANCH
            </span>
            <span className="font-mono text-[10px] text-ink-soft">
              CSE + IT = 82%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={branchData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeTokens.line} />
                <XAxis
                  dataKey="branch"
                  tick={{ fill: themeTokens.fg, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: themeTokens.line }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: themeTokens.fgSoft, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: themeTokens.line }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: themeTokens.bg }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-sidebar text-sidebar-fg p-2 rounded-control font-mono text-[11px] border border-line">
                          <p className="font-bold">{payload[0].payload.branch}</p>
                          <p className="text-accent">{payload[0].value} candidates</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={themeTokens.fg}
                  radius={[3, 3, 0, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Match Distribution (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="border-b border-line pb-2 flex items-center justify-between">
            <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-fg-soft">
              02 · AI MATCH SCORE SPREAD
            </span>
            <span className="font-mono text-[10px] text-jade uppercase font-semibold">
              48 IN &gt;85% TIER
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={matchData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={themeTokens.line} />
                <XAxis
                  dataKey="range"
                  tick={{ fill: themeTokens.fg, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: themeTokens.line }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: themeTokens.fgSoft, fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={{ stroke: themeTokens.line }}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: themeTokens.bg }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-sidebar text-sidebar-fg p-2 rounded-control font-mono text-[11px] border border-line">
                          <p className="font-bold">{payload[0].payload.range}</p>
                          <p className="text-accent">{payload[0].value} applicants</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={themeTokens.accent}
                  radius={[3, 3, 0, 0]}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

// src/pages/recruiter/RecruiterAnalytics.jsx
import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ComposedChart,
  Area,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Zap, Users, CheckCircle2 } from 'lucide-react';
import { CountUp } from '../../components/ui/CountUp';

const BRANCH_DATA = [
  { branch: 'CSE', applicants: 196, shortlisted: 64, share: '57.3%' },
  { branch: 'IT', applicants: 86, shortlisted: 28, share: '25.1%' },
  { branch: 'ECE', applicants: 46, shortlisted: 11, share: '13.5%' },
  { branch: 'Other', applicants: 14, shortlisted: 3, share: '4.1%' },
];

const SCORE_SPREAD_DATA = [
  { range: '90-100%', candidates: 26, density: 30, tier: 'ELITE (>85%)', elite: true },
  { range: '80-89%', candidates: 88, density: 92, tier: 'HIGH FIT', elite: true },
  { range: '70-79%', candidates: 112, density: 114, tier: 'QUALIFIED', elite: false },
  { range: '60-69%', candidates: 78, density: 76, tier: 'BORDERLINE', elite: false },
  { range: '< 60%', candidates: 38, density: 34, tier: 'BELOW CUTOFF', elite: false },
];

// Custom SVG Bar Shape with Glowing Top Laser Cap & Subtle Hover Scale
function LuminousBar(props) {
  const { fill, x, y, width, height, isHovered, topColor } = props;
  if (!height || height <= 0) return null;
  const r = 6;
  return (
    <g>
      {/* Main Gradient Bar */}
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={r}
        ry={r}
        fill={fill}
        opacity={isHovered ? 1 : 0.88}
        style={{ transition: 'opacity 0.2s ease' }}
      />
      {/* Crisp Luminous Top Edge Cap */}
      <rect
        x={x + 1}
        y={y}
        width={Math.max(0, width - 2)}
        height={3.5}
        rx={2}
        fill={topColor || '#FFFFFF'}
        opacity={isHovered ? 1 : 0.85}
      />
      {/* Vertical Specular Highlight Line */}
      <line
        x1={x + width * 0.5}
        y1={y + 6}
        x2={x + width * 0.5}
        y2={y + height - 4}
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeDasharray="2 4"
        opacity={isHovered ? 0.35 : 0.12}
      />
    </g>
  );
}

function BranchTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-control border border-line p-3 shadow-object font-mono text-xs space-y-1.5 min-w-[180px]">
      <div className="flex items-center justify-between border-b border-line pb-1">
        <span className="font-bold text-fg">{d.branch} DISCIPLINE</span>
        <span className="text-accent-ink font-semibold">{d.share}</span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-fg-soft">Total Applicants:</span>
        <span className="text-fg font-bold">{d.applicants}</span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-fg-soft">AI Shortlisted:</span>
        <span className="text-jade font-bold">{d.shortlisted} candidates</span>
      </div>
    </div>
  );
}

function SpreadTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-control border border-line p-3 shadow-object font-mono text-xs space-y-1.5 min-w-[185px]">
      <div className="flex items-center justify-between border-b border-line pb-1">
        <span className="font-bold text-fg">SCORE: {d.range}</span>
        <span
          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            d.elite ? 'bg-jade/20 text-jade' : 'bg-accent/20 text-accent-ink'
          }`}
        >
          {d.tier}
        </span>
      </div>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-fg-soft">Cohort Volume:</span>
        <span className="text-accent-ink font-bold">
          {d.candidates} applicants
        </span>
      </div>
    </div>
  );
}

export function RecruiterAnalytics() {
  const [hoveredBranch, setHoveredBranch] = useState(null);
  const [hoveredSpread, setHoveredSpread] = useState(null);
  const [showShortlistedOverlay, setShowShortlistedOverlay] = useState(true);

  return (
    <div className="space-y-10 pb-12">
      {/* Top 3 Animated Executive KPI Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 border-b border-line pb-5">
        {/* KPI 1: Average AI Match */}
        <motion.div
          whileHover={{ y: -1 }}
          className="group relative rounded-object border border-line/80 bg-surface/40 p-3.5 sm:p-4 space-y-2 overflow-hidden transition-colors hover:border-accent/50"
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-fg-soft">
            <span>AVERAGE AI MATCH</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-jade/15 border border-jade/30 px-1.5 py-0.5 text-[9.5px] font-bold text-jade">
              <TrendingUp className="h-3 w-3" /> +6.4%
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight">
              <CountUp to={74.0} decimals={1} suffix="%" />
            </span>
          </div>
          <p className="font-sans text-[11px] text-fg-soft leading-tight">
            Across 342 pre-screened applicants
          </p>
          {/* Animated Mini Progress Bar */}
          <div className="h-1 w-full rounded-full bg-line/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '74%' }}
              transition={{ duration: 1.1, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
            />
          </div>
        </motion.div>

        {/* KPI 2: Offer Acceptance */}
        <motion.div
          whileHover={{ y: -1 }}
          className="group relative rounded-object border border-line/80 bg-surface/40 p-3.5 sm:p-4 space-y-2 overflow-hidden transition-colors hover:border-jade/50"
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-fg-soft">
            <span>OFFER ACCEPTANCE</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-jade/15 border border-jade/30 px-1.5 py-0.5 text-[9.5px] font-bold text-jade">
              <Award className="h-3 w-3" /> HIGH RETENTION
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight">
              <CountUp to={88.5} decimals={1} suffix="%" />
            </span>
          </div>
          <p className="font-sans text-[11px] text-fg-soft leading-tight">
            High candidate brand loyalty
          </p>
          <div className="h-1 w-full rounded-full bg-line/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '88.5%' }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-jade/60 to-jade"
            />
          </div>
        </motion.div>

        {/* KPI 3: Average Time-to-Hire */}
        <motion.div
          whileHover={{ y: -1 }}
          className="group relative rounded-object border border-line/80 bg-surface/40 p-3.5 sm:p-4 space-y-2 overflow-hidden transition-colors hover:border-accent/50"
        >
          <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-fg-soft">
            <span>AVERAGE TIME-TO-HIRE</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 border border-accent/35 px-1.5 py-0.5 text-[9.5px] font-bold text-accent-ink">
              <Zap className="h-3 w-3" /> -4.2d FASTER
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-semibold tracking-tight text-fg leading-tight">
              <CountUp to={12} decimals={0} suffix=" Days" />
            </span>
          </div>
          <p className="font-sans text-[11px] text-fg-soft leading-tight">
            From JNF to final offer sign-off
          </p>
          {/* Segmented Timeline Velocity Meter */}
          <div className="grid grid-cols-12 gap-1 pt-0.5">
            {Array.from({ length: 12 }, (_, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scaleY: 0 }}
                animate={{ opacity: 1, scaleY: 1 }}
                transition={{ delay: i * 0.05 }}
                className={`h-1 rounded-full ${
                  i < 9 ? 'bg-accent' : 'bg-jade'
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Bottom 2-Column Interactive Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* CHART 01: APPLICANTS BY BRANCH */}
        <div className="rounded-2xl border border-line bg-surface/40 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <Users className="h-3.5 w-3.5 text-accent" />
              <span className="text-fg font-semibold">
                01 · APPLICANTS BY BRANCH
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowShortlistedOverlay((v) => !v)}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider transition-all ${
                  showShortlistedOverlay
                    ? 'border-jade/50 bg-jade/15 text-jade font-semibold'
                    : 'border-line text-fg-soft hover:text-fg'
                }`}
              >
                {showShortlistedOverlay ? '✓ Shortlist Overlay' : '+ Show Shortlist'}
              </button>
              <span className="font-mono text-xs text-fg-soft">
                CSE + IT = <strong className="text-fg">82%</strong>
              </span>
            </div>
          </div>

          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={BRANCH_DATA}
                margin={{ top: 18, right: 12, left: -16, bottom: 4 }}
                onMouseMove={(st) =>
                  setHoveredBranch(st?.activeTooltipIndex ?? null)
                }
                onMouseLeave={() => setHoveredBranch(null)}
              >
                <defs>
                  <linearGradient id="branchBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-fg))" stopOpacity="0.95" />
                    <stop offset="55%" stopColor="rgb(var(--c-fg))" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="rgb(var(--c-fg))" stopOpacity="0.12" />
                  </linearGradient>
                  <linearGradient id="branchJadeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-jade))" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="rgb(var(--c-jade))" stopOpacity="0.20" />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgb(var(--c-line))"
                  opacity={0.55}
                />
                <XAxis
                  dataKey="branch"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'rgb(var(--c-fg))',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'rgb(var(--c-fg-soft))',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={<BranchTooltip />}
                  cursor={{ fill: 'rgb(var(--c-fg) / 0.04)' }}
                />

                <Bar
                  dataKey="applicants"
                  fill="url(#branchBarGrad)"
                  shape={(props) => (
                    <LuminousBar
                      {...props}
                      isHovered={hoveredBranch === props.index}
                      topColor="rgb(var(--c-fg))"
                    />
                  )}
                  animationDuration={950}
                />

                {showShortlistedOverlay && (
                  <Bar
                    dataKey="shortlisted"
                    fill="url(#branchJadeGrad)"
                    shape={(props) => (
                      <LuminousBar
                        {...props}
                        isHovered={hoveredBranch === props.index}
                        topColor="rgb(var(--c-jade))"
                      />
                    )}
                    animationDuration={1100}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Branch Telemetry Pills */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-line/70">
            {BRANCH_DATA.map((b, idx) => (
              <div
                key={b.branch}
                onMouseEnter={() => setHoveredBranch(idx)}
                onMouseLeave={() => setHoveredBranch(null)}
                className={`rounded-control border p-2 text-center font-mono transition-all cursor-default ${
                  hoveredBranch === idx
                    ? 'border-accent bg-accent/10 scale-[1.02]'
                    : 'border-line/60 bg-bg/40'
                }`}
              >
                <span className="block text-[10px] text-fg-soft">{b.branch}</span>
                <span className="text-xs font-bold text-fg">{b.share}</span>
                <span className="block text-[9px] text-jade">
                  {b.shortlisted} eligible
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* CHART 02: AI MATCH SCORE SPREAD (Histogram + Superimposed Gaussian Curve) */}
        <div className="rounded-2xl border border-line bg-surface/40 p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-3">
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
              <CheckCircle2 className="h-3.5 w-3.5 text-jade" />
              <span className="text-fg font-semibold">
                02 · AI MATCH SCORE SPREAD
              </span>
            </div>
            <span className="rounded-full bg-jade/15 border border-jade/35 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-jade">
              48 IN &gt;85% TIER
            </span>
          </div>

          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={SCORE_SPREAD_DATA}
                margin={{ top: 18, right: 12, left: -16, bottom: 4 }}
                onMouseMove={(st) =>
                  setHoveredSpread(st?.activeTooltipIndex ?? null)
                }
                onMouseLeave={() => setHoveredSpread(null)}
              >
                <defs>
                  <linearGradient id="spreadAmberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.96" />
                    <stop offset="65%" stopColor="rgb(var(--c-accent))" stopOpacity="0.55" />
                    <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity="0.14" />
                  </linearGradient>
                  <linearGradient id="spreadEliteGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-jade))" stopOpacity="0.96" />
                    <stop offset="65%" stopColor="rgb(var(--c-accent))" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity="0.15" />
                  </linearGradient>
                  <linearGradient id="bellCurveFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="0.24" />
                    <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgb(var(--c-line))"
                  opacity={0.55}
                />
                <XAxis
                  dataKey="range"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'rgb(var(--c-fg))',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'rgb(var(--c-fg-soft))',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={<SpreadTooltip />}
                  cursor={{ fill: 'rgb(var(--c-accent) / 0.05)' }}
                />

                <ReferenceLine
                  y={80}
                  stroke="rgb(var(--c-jade))"
                  strokeDasharray="4 4"
                  strokeOpacity={0.55}
                />

                {/* Smooth Gaussian Cohort Density Curve */}
                <Area
                  type="monotone"
                  dataKey="density"
                  fill="url(#bellCurveFill)"
                  stroke="rgb(var(--c-jade))"
                  strokeWidth={2}
                  dot={{ r: 3, fill: 'rgb(var(--c-jade))' }}
                  animationDuration={1200}
                />

                <Bar
                  dataKey="candidates"
                  shape={(props) => {
                    const isElite = props.payload?.elite;
                    return (
                      <LuminousBar
                        {...props}
                        fill={
                          isElite
                            ? 'url(#spreadEliteGrad)'
                            : 'url(#spreadAmberGrad)'
                        }
                        isHovered={hoveredSpread === props.index}
                        topColor={
                          isElite
                            ? 'rgb(var(--c-jade))'
                            : 'rgb(var(--c-accent))'
                        }
                      />
                    );
                  }}
                  animationDuration={950}
                >
                  {SCORE_SPREAD_DATA.map((entry, idx) => (
                    <Cell
                      key={entry.range}
                      fill={
                        entry.elite
                          ? 'url(#spreadEliteGrad)'
                          : 'url(#spreadAmberGrad)'
                      }
                    />
                  ))}
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Interactive Score Tier Breakdown Pills */}
          <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-line/70">
            {SCORE_SPREAD_DATA.map((s, idx) => (
              <div
                key={s.range}
                onMouseEnter={() => setHoveredSpread(idx)}
                onMouseLeave={() => setHoveredSpread(null)}
                className={`rounded-control border p-2 text-center font-mono transition-all cursor-default ${
                  hoveredSpread === idx
                    ? 'border-accent bg-accent/10 scale-[1.03]'
                    : 'border-line/60 bg-bg/40'
                }`}
              >
                <span className="block text-[9.5px] text-fg-soft truncate">
                  {s.range}
                </span>
                <span
                  className={`text-xs font-bold ${
                    s.elite ? 'text-jade' : 'text-accent-ink'
                  }`}
                >
                  {s.candidates}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecruiterAnalytics;
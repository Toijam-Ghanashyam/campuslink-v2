// src/pages/admin/AdminCommandCenter.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';
import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import { CountUp } from '../../components/ui/CountUp';

const BRANCH_CONVERSION = [
  { branch: 'CSE', rate: 82, placed: 344, total: 420 },
  { branch: 'IT', rate: 76, placed: 213, total: 280 },
  { branch: 'ECE', rate: 64, placed: 166, total: 260 },
  { branch: 'EEE', rate: 58, placed: 116, total: 200 },
  { branch: 'ME', rate: 49, placed: 73, total: 150 },
  { branch: 'CE', rate: 41, placed: 45, total: 110 },
];

const CTC_TRAJECTORY = [
  { year: '2022', avg: 5.2, highest: 18.0 },
  { year: '2023', avg: 6.0, highest: 22.0 },
  { year: '2024', avg: 6.8, highest: 26.5 },
  { year: '2025', avg: 8.1, highest: 31.0 },
  { year: '2026', avg: 9.4, highest: 34.0 },
];

function ConversionBarShape(props) {
  const { x, y, width, height, index, hoveredIdx } = props;
  if (!height || height <= 0) return null;
  const isHovered = hoveredIdx === index;
  const isDimmed = hoveredIdx !== null && hoveredIdx !== index;

  return (
    <g
      style={{
        opacity: isDimmed ? 0.45 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill={isHovered ? 'url(#adminBarHoverGrad)' : 'url(#adminBarGrad)'}
      />
      {/* Crisp Luminous Top Edge Cap */}
      <rect
        x={x + 1}
        y={y}
        width={Math.max(0, width - 2)}
        height={3}
        rx={1.5}
        fill={isHovered ? 'rgb(var(--c-accent))' : 'rgb(var(--c-fg))'}
      />
    </g>
  );
}

function BranchConversionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-strong rounded-control border border-line p-3 shadow-object font-mono text-xs space-y-1 min-w-[165px]">
      <div className="flex items-center justify-between border-b border-line pb-1">
        <span className="font-bold text-fg">{d.branch} COHORT</span>
        <span className="text-accent font-bold">{d.rate}% Placed</span>
      </div>
      <div className="flex items-center justify-between text-[11px] pt-0.5">
        <span className="text-fg-soft">Students Placed:</span>
        <span className="text-fg font-semibold">
          {d.placed} / {d.total}
        </span>
      </div>
    </div>
  );
}

function TrajectoryTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload || {};
  return (
    <div className="glass-strong rounded-control border border-line p-3 shadow-object font-mono text-xs space-y-1 min-w-[175px]">
      <div className="border-b border-line pb-1 font-bold text-fg">
        ACADEMIC YEAR {label}
      </div>
      <p className="text-accent font-semibold pt-0.5">
        Highest: ₹{row.highest?.toFixed(1)} LPA
      </p>
      <p className="text-jade font-semibold">
        Average: ₹{row.avg?.toFixed(1)} LPA
      </p>
    </div>
  );
}

export function AdminCommandCenter() {
  const navigate = useNavigate();
  const [hoveredBranchIdx, setHoveredBranchIdx] = useState(null);
  const [showTargetLine, setShowTargetLine] = useState(true);
  const [ctcFocus, setCtcFocus] = useState('all'); // 'all' | 'highest' | 'avg'

  const topKpis = [
    {
      label: 'ELIGIBLE STUDENTS',
      value: 1420,
      decimals: 0,
      prefix: '',
      suffix: '',
      sub: '1,180 verified placement ready',
      progress: 83,
      barColor: 'bg-fg',
      path: '/admin/verification',
    },
    {
      label: 'ACTIVE RECRUITERS',
      value: 42,
      decimals: 0,
      prefix: '',
      suffix: '',
      sub: '42 authorized JNFs',
      progress: 100,
      barColor: 'bg-jade',
      path: '/admin/recruiters',
    },
    {
      label: 'OVERALL PLACED %',
      value: 78.4,
      decimals: 1,
      prefix: '',
      suffix: '%',
      sub: 'Target benchmark: 85%',
      progress: 78.4,
      barColor: 'bg-accent',
      path: '/admin/offers',
    },
    {
      label: 'HIGHEST CTC',
      value: 34.0,
      decimals: 1,
      prefix: '₹',
      suffix: ' LPA',
      sub: 'Average: 9.4 LPA',
      progress: 88,
      barColor: 'bg-accent',
      path: '/admin/drives',
    },
  ];

  return (
    <div className="space-y-10 pb-12">
      {/* 1. Interactive Top 4 KPI Telemetry Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-line border-b border-line pb-6">
        {topKpis.map((kpi, idx) => (
          <motion.div
            key={kpi.label}
            whileHover={{ y: -2 }}
            onClick={() => navigate(kpi.path)}
            className={`group relative cursor-pointer py-3 ${
              idx === 0 ? 'sm:pr-6' : 'sm:px-6'
            } space-y-2 transition-colors`}
          >
            <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-widest text-fg-soft">
              <span>{kpi.label}</span>
              <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 translate-y-1 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0 text-accent transition-all duration-200" />
            </div>

            <div className="font-display text-4xl xl:text-5xl font-semibold tracking-tight text-fg group-hover:text-accent transition-colors duration-200">
              <CountUp
                to={kpi.value}
                decimals={kpi.decimals}
                prefix={kpi.prefix}
                suffix={kpi.suffix}
              />
            </div>

            <p className="font-sans text-xs text-fg-soft">{kpi.sub}</p>

            {/* Subtle Animated Progress Hairline */}
            <div className="h-1 w-full rounded-full bg-line/40 overflow-hidden mt-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${kpi.progress}%` }}
                transition={{ duration: 1.0, delay: idx * 0.08, ease: 'easeOut' }}
                className={`h-full rounded-full ${kpi.barColor} opacity-75 group-hover:opacity-100 transition-opacity`}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* 2. Two-Column Interactive Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* CHART 01: BRANCH-WISE CONVERSION (%) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-fg-soft">
              01 · BRANCH-WISE CONVERSION (%)
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowTargetLine((v) => !v)}
                className={`rounded px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider border transition-all ${
                  showTargetLine
                    ? 'border-accent/40 bg-accent/10 text-accent-ink'
                    : 'border-line text-fg-soft hover:text-fg'
                }`}
              >
                85% Benchmark
              </button>
              <span className="font-mono text-xs font-semibold text-jade">
                CSE: 82% LEADING
              </span>
            </div>
          </div>

          <div className="h-[290px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={BRANCH_CONVERSION}
                margin={{ top: 14, right: 8, left: -20, bottom: 4 }}
                onMouseMove={(st) =>
                  setHoveredBranchIdx(st?.activeTooltipIndex ?? null)
                }
                onMouseLeave={() => setHoveredBranchIdx(null)}
              >
                <defs>
                  <linearGradient id="adminBarGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-fg))" stopOpacity="0.95" />
                    <stop offset="70%" stopColor="rgb(var(--c-fg))" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="rgb(var(--c-fg))" stopOpacity="0.18" />
                  </linearGradient>
                  <linearGradient id="adminBarHoverGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgb(var(--c-accent))" stopOpacity="1" />
                    <stop offset="75%" stopColor="rgb(var(--c-accent))" stopOpacity="0.65" />
                    <stop offset="100%" stopColor="rgb(var(--c-accent))" stopOpacity="0.20" />
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
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'rgb(var(--c-fg-soft))',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={<BranchConversionTooltip />}
                  cursor={{ fill: 'rgb(var(--c-fg) / 0.04)' }}
                />

                {showTargetLine && (
                  <ReferenceLine
                    y={85}
                    stroke="rgb(var(--c-accent))"
                    strokeDasharray="4 4"
                    strokeOpacity={0.65}
                  />
                )}

                <Bar
                  dataKey="rate"
                  shape={(props) => (
                    <ConversionBarShape
                      {...props}
                      hoveredIdx={hoveredBranchIdx}
                    />
                  )}
                  animationDuration={900}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <p className="font-serif italic text-sm text-fg-soft">
            {hoveredBranchIdx !== null
              ? `${BRANCH_CONVERSION[hoveredBranchIdx].branch} Cohort: ${BRANCH_CONVERSION[hoveredBranchIdx].placed} of ${BRANCH_CONVERSION[hoveredBranchIdx].total} eligible students placed (${BRANCH_CONVERSION[hoveredBranchIdx].rate}%).`
              : 'Civil and Mechanical convert at roughly half the rate of Computer Science and IT.'}
          </p>
        </div>

        {/* CHART 02: COMPENSATION TRAJECTORY (LPA) */}
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line pb-2.5">
            <span className="font-mono text-xs uppercase tracking-widest text-fg-soft">
              02 · COMPENSATION TRAJECTORY (LPA)
            </span>

            {/* Subtle Interactive Curve Focus Pills */}
            <div className="flex items-center gap-1.5 font-mono text-[10px]">
              <button
                type="button"
                onClick={() =>
                  setCtcFocus((prev) => (prev === 'highest' ? 'all' : 'highest'))
                }
                onMouseEnter={() => setCtcFocus('highest')}
                onMouseLeave={() => setCtcFocus('all')}
                className={`rounded px-2 py-0.5 uppercase tracking-wider border transition-all ${
                  ctcFocus === 'highest'
                    ? 'border-accent bg-accent/15 text-accent font-bold'
                    : 'border-transparent text-accent font-semibold hover:border-accent/40'
                }`}
              >
                HIGHEST: ₹34.0 LPA
              </button>
              <button
                type="button"
                onClick={() =>
                  setCtcFocus((prev) => (prev === 'avg' ? 'all' : 'avg'))
                }
                onMouseEnter={() => setCtcFocus('avg')}
                onMouseLeave={() => setCtcFocus('all')}
                className={`rounded px-2 py-0.5 uppercase tracking-wider border transition-all ${
                  ctcFocus === 'avg'
                    ? 'border-jade bg-jade/15 text-jade font-bold'
                    : 'border-transparent text-jade font-semibold hover:border-jade/40'
                }`}
              >
                AVG: ₹9.4 LPA
              </button>
            </div>
          </div>

          <div className="h-[290px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={CTC_TRAJECTORY}
                margin={{ top: 14, right: 12, left: -20, bottom: 4 }}
              >
                <defs>
                  <linearGradient id="ctcHighestGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="rgb(var(--c-accent))"
                      stopOpacity={ctcFocus === 'avg' ? 0.05 : 0.28}
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(var(--c-accent))"
                      stopOpacity="0"
                    />
                  </linearGradient>
                  <linearGradient id="ctcAvgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="0%"
                      stopColor="rgb(var(--c-jade))"
                      stopOpacity={ctcFocus === 'highest' ? 0.05 : 0.25}
                    />
                    <stop
                      offset="100%"
                      stopColor="rgb(var(--c-jade))"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgb(var(--c-line))"
                  opacity={0.55}
                />
                <XAxis
                  dataKey="year"
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
                  domain={[0, 36]}
                  ticks={[0, 9, 18, 27, 36]}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: 'rgb(var(--c-fg-soft))',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                />
                <Tooltip
                  content={<TrajectoryTooltip />}
                  cursor={{
                    stroke: 'rgb(var(--c-fg) / 0.25)',
                    strokeWidth: 1,
                    strokeDasharray: '3 3',
                  }}
                />

                {/* Highest CTC Area + Line */}
                <Area
                  type="monotone"
                  dataKey="highest"
                  stroke="rgb(var(--c-accent))"
                  strokeWidth={ctcFocus === 'highest' ? 3 : 2.2}
                  strokeOpacity={ctcFocus === 'avg' ? 0.35 : 1}
                  fill="url(#ctcHighestGrad)"
                  dot={{
                    r: ctcFocus === 'highest' ? 5 : 4,
                    fill: 'rgb(var(--c-accent))',
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 6,
                    fill: 'rgb(var(--c-accent))',
                    stroke: '#FFFFFF',
                    strokeWidth: 1.5,
                  }}
                  animationDuration={1000}
                />

                {/* Average CTC Area + Line */}
                <Area
                  type="monotone"
                  dataKey="avg"
                  stroke="rgb(var(--c-jade))"
                  strokeWidth={ctcFocus === 'avg' ? 3 : 2.2}
                  strokeOpacity={ctcFocus === 'highest' ? 0.35 : 1}
                  fill="url(#ctcAvgGrad)"
                  dot={{
                    r: ctcFocus === 'avg' ? 5 : 3.5,
                    fill: 'rgb(var(--c-jade))',
                    strokeWidth: 0,
                  }}
                  activeDot={{
                    r: 5.5,
                    fill: 'rgb(var(--c-jade))',
                    stroke: '#FFFFFF',
                    strokeWidth: 1.5,
                  }}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="font-serif italic text-sm text-fg-soft">
            Highest package has increased 2.1x since 2022 due to cloud
            infrastructure and AI roles.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminCommandCenter;
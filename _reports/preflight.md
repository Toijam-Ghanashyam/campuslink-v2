# Preflight Report (P0)

## (a) Core Package Versions

- **react**: ^18.3.1
- **react-dom**: ^18.3.1
- **framer-motion**: ^11.11.17
- **tailwindcss**: ^3.4.15
- **vite**: ^5.4.11

## (b) Font Imports & Google Fonts URLs

### index.html
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700&family=IBM+Plex+Mono:ital,wght@0,400;0,500;0,600;1,400&family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Manrope:wght@400;500;600;700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&display=swap" rel="stylesheet">
```

### src/main.jsx
- `import "./index.css";`

### src/index.css
- Referenced fonts: `Instrument Sans`, `Manrope`, `Newsreader`, `Fraunces`, `IBM Plex Mono`

## (c) Color Class Occurrences per File

| File | bg-ink | text-ink | border-ink | text-bone | bg-bone | bg-paper | text-paper | ring-ink | stroke-ink | fill-ink |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `src/App.jsx` | 0 | 2 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| `src/components/layout/AppShell.jsx` | 4 | 11 | 2 | 19 | 6 | 3 | 0 | 0 | 0 | 0 |
| `src/components/layout/CommandPalette.jsx` | 1 | 10 | 0 | 0 | 4 | 1 | 0 | 0 | 0 | 0 |
| `src/components/layout/JudgeGuide.jsx` | 2 | 8 | 1 | 2 | 3 | 3 | 0 | 0 | 0 | 0 |
| `src/components/layout/NotificationPopover.jsx` | 0 | 8 | 0 | 0 | 3 | 3 | 0 | 0 | 0 | 0 |
| `src/components/ui/Badge.jsx` | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Button.jsx` | 2 | 3 | 1 | 3 | 2 | 1 | 0 | 0 | 0 | 0 |
| `src/components/ui/Callout.jsx` | 0 | 6 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Card.jsx` | 0 | 0 | 1 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `src/components/ui/DataTable.jsx` | 0 | 4 | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 0 |
| `src/components/ui/Drawer.jsx` | 1 | 4 | 0 | 0 | 2 | 2 | 0 | 0 | 0 | 0 |
| `src/components/ui/EmptyState.jsx` | 0 | 3 | 0 | 0 | 1 | 1 | 0 | 0 | 0 | 0 |
| `src/components/ui/ErrorBoundary.jsx` | 0 | 2 | 0 | 0 | 0 | 1 | 0 | 0 | 0 | 0 |
| `src/components/ui/MarginNote.jsx` | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Mark.jsx` | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Masthead.jsx` | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/MetricCard.jsx` | 0 | 4 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Rule.jsx` | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/ScoreDial.jsx` | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 3 |
| `src/components/ui/SectionHeader.jsx` | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Stamp.jsx` | 0 | 1 | 1 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/StatStrip.jsx` | 0 | 3 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Tabs.jsx` | 0 | 4 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/Tag.jsx` | 0 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/components/ui/TagInput.jsx` | 1 | 5 | 0 | 0 | 2 | 1 | 0 | 0 | 0 | 0 |
| `src/components/ui/Toast.jsx` | 1 | 4 | 1 | 2 | 0 | 3 | 0 | 0 | 0 | 0 |
| `src/pages/admin/AdminAtRisk.jsx` | 0 | 7 | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 0 |
| `src/pages/admin/AdminCommandCenter.jsx` | 2 | 15 | 0 | 4 | 1 | 4 | 0 | 4 | 0 | 0 |
| `src/pages/admin/AdminDrives.jsx` | 1 | 17 | 1 | 0 | 4 | 2 | 0 | 0 | 0 | 0 |
| `src/pages/admin/AdminOffers.jsx` | 0 | 8 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| `src/pages/admin/AdminRecruiters.jsx` | 0 | 7 | 0 | 0 | 2 | 0 | 0 | 0 | 0 | 0 |
| `src/pages/admin/AdminVerification.jsx` | 0 | 18 | 0 | 0 | 4 | 2 | 0 | 0 | 0 | 0 |
| `src/pages/landing/LandingPage.jsx` | 1 | 30 | 0 | 10 | 6 | 2 | 0 | 0 | 0 | 0 |
| `src/pages/recruiter/RecruiterAnalytics.jsx` | 2 | 3 | 0 | 2 | 0 | 0 | 0 | 0 | 0 | 0 |
| `src/pages/recruiter/RecruiterJobs.jsx` | 0 | 5 | 0 | 0 | 1 | 0 | 0 | 0 | 0 | 0 |
| `src/pages/recruiter/RecruiterOverview.jsx` | 0 | 11 | 0 | 0 | 1 | 3 | 0 | 3 | 0 | 0 |
| `src/pages/recruiter/RecruiterPipeline.jsx` | 0 | 18 | 1 | 0 | 6 | 1 | 0 | 0 | 0 | 0 |
| `src/pages/recruiter/RecruiterSlots.jsx` | 0 | 6 | 1 | 0 | 2 | 2 | 0 | 0 | 0 | 0 |
| `src/pages/student/StudentApplications.jsx` | 0 | 21 | 0 | 0 | 3 | 1 | 0 | 0 | 0 | 0 |
| `src/pages/student/StudentDrives.jsx` | 0 | 11 | 0 | 0 | 2 | 1 | 0 | 1 | 0 | 0 |
| `src/pages/student/StudentInterviews.jsx` | 0 | 10 | 0 | 0 | 0 | 2 | 0 | 0 | 0 | 0 |
| `src/pages/student/StudentOverview.jsx` | 2 | 13 | 0 | 0 | 1 | 2 | 0 | 0 | 0 | 0 |
| `src/pages/student/StudentProfile.jsx` | 0 | 16 | 0 | 0 | 5 | 1 | 0 | 0 | 0 | 0 |

## (d) Hex Color Literals in Source Code

| File:Line | Hex | Snippet |
| :--- | :---: | :--- |
| `src/components/ui/ScoreDial.jsx:79` | `#14161C` | `stroke={t.isMajor ? '#14161C' : '#E6DFCF'}` |
| `src/components/ui/ScoreDial.jsx:79` | `#E6DFCF` | `stroke={t.isMajor ? '#14161C' : '#E6DFCF'}` |
| `src/components/ui/ScoreDial.jsx:89` | `#E6DFCF` | `stroke="#E6DFCF"` |
| `src/components/ui/ScoreDial.jsx:98` | `#E8A33D` | `stroke="#E8A33D"` |
| `src/components/ui/ScoreDial.jsx:115` | `#14161C` | `stroke="#14161C"` |
| `src/components/ui/ScoreDial.jsx:120` | `#14161C` | `<circle cx={0} cy={0} r={4.5} fill="#14161C" />` |
| `src/components/ui/ScoreDial.jsx:121` | `#FFFDF8` | `<circle cx={0} cy={0} r={1.5} fill="#FFFDF8" />` |
| `src/index.css:6` | `#F6F2E9` | `--bone: #F6F2E9;` |
| `src/index.css:7` | `#FFFDF8` | `--paper: #FFFDF8;` |
| `src/index.css:8` | `#14161C` | `--ink: #14161C;` |
| `src/index.css:9` | `#5B5F6B` | `--ink-soft: #5B5F6B;` |
| `src/index.css:10` | `#E6DFCF` | `--line: #E6DFCF;` |
| `src/index.css:11` | `#E8A33D` | `--ochre: #E8A33D;` |
| `src/index.css:12` | `#FBEFD5` | `--ochre-tint: #FBEFD5;` |
| `src/index.css:13` | `#8A5A0B` | `--ochre-deep: #8A5A0B;` |
| `src/index.css:14` | `#1F8A63` | `--jade: #1F8A63;` |
| `src/index.css:15` | `#DDF1E8` | `--jade-tint: #DDF1E8;` |
| `src/index.css:16` | `#C4432F` | `--brick: #C4432F;` |
| `src/index.css:17` | `#F8E1DC` | `--brick-tint: #F8E1DC;` |
| `src/pages/admin/AdminCommandCenter.jsx:92` | `#E6DFCF` | `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF"` |
| `src/pages/admin/AdminCommandCenter.jsx:95` | `#14161C` | `tick={{ fill: '#14161C', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:96` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:100` | `#5B5F6B` | `tick={{ fill: '#5B5F6B', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:101` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:106` | `#F6F2E9` | `cursor={{ fill: '#F6F2E9' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:122` | `#14161C` | `fill="#14161C"` |
| `src/pages/admin/AdminCommandCenter.jsx:151` | `#E6DFCF` | `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF"` |
| `src/pages/admin/AdminCommandCenter.jsx:154` | `#14161C` | `tick={{ fill: '#14161C', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:155` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:159` | `#5B5F6B` | `tick={{ fill: '#5B5F6B', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:160` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/admin/AdminCommandCenter.jsx:180` | `#14161C` | `stroke="#14161C"` |
| `src/pages/admin/AdminCommandCenter.jsx:182` | `#14161C` | `dot={{ fill: '#14161C', r: 3 }}` |
| `src/pages/admin/AdminCommandCenter.jsx:188` | `#E8A33D` | `stroke="#E8A33D"` |
| `src/pages/admin/AdminCommandCenter.jsx:190` | `#E8A33D` | `dot={{ fill: '#E8A33D', r: 4 }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:57` | `#E6DFCF` | `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF"` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:60` | `#14161C` | `tick={{ fill: '#14161C', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:61` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:65` | `#5B5F6B` | `tick={{ fill: '#5B5F6B', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:66` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:70` | `#F6F2E9` | `cursor={{ fill: '#F6F2E9' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:85` | `#14161C` | `fill="#14161C"` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:111` | `#E6DFCF` | `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E6DFCF"` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:114` | `#14161C` | `tick={{ fill: '#14161C', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:115` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:119` | `#5B5F6B` | `tick={{ fill: '#5B5F6B', fontSize: 11, fontFamily: 'IBM Plex Mono' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:120` | `#E6DFCF` | `axisLine={{ stroke: '#E6DFCF' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:124` | `#F6F2E9` | `cursor={{ fill: '#F6F2E9' }}` |
| `src/pages/recruiter/RecruiterAnalytics.jsx:139` | `#E8A33D` | `fill="#E8A33D"` |

## (e) PS Deliverables Route & Switcher Audit

- **Route `/admin/ai-engine`**: **Does NOT exist** in `src/App.jsx` (to be added in future step).
- **Admin Campus Switcher**: **Does NOT exist** in `src/components/layout/AppShell.jsx` (to be added in future step).

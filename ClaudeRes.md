# CampusLink AI: Frontend Build Playbook for Antigravity

For BPUT PS10. Paste Prompt 0 once, then Prompts 1 to 8 one at a time. After each one, let Antigravity run the app and fix its own errors before you paste the next.

## 1. What your three portals are doing

The spec already follows the PS pipeline: Profiling → Matching → Scheduling → Notification → Offer Tracking → Analytics. Each portal owns part of it:

- **Student:** profiling, readiness, skill gaps, applying, explained rejections.
- **Admin (Placement Cell):** verification, conflict-free scheduling, at-risk early warning.
- **Recruiter:** ranked pipeline, explainable match, slot booking.

Judges score against the PS deliverables, and the spec leaves gaps there: offer tracking, analytics charts, notifications and the architecture story. I closed them with six small additions that live inside existing screens, so nothing gets crowded:

1. **Readiness ladder** (Not Ready → Developing → Ready → Highly Employable) on Student Overview. The PS uses this exact scale.
2. **"Why this score" bars** under every AI Match Explanation (explainable AI).
3. **Offers and documentation tracking:** an Offers tab for students and one new Admin page, Offers & Joining (PS deliverable 7).
4. **Analytics charts:** branch-wise conversion and package trend on the Admin Command Center, applicant charts for recruiters.
5. **Notification popover** on the bell (PS area 6, communication automation).
6. **"Under the hood" strip** on the landing page with the architecture and models (PS deliverables 8 and 9).

One cheap extra that makes the demo feel real: the three portals share a small in-memory store. Approve a student as Admin and their badge turns Verified in the Student portal. Book a slot as Recruiter and it shows up under Student Interviews. Judges see one connected system, not three separate pages.

## 2. The backend, as the frontend should assume it

| Service | What it does |
| --- | --- |
| Auth & tenant | Login with a role (student, admin, recruiter) and a college\_id so each college sees only its own data. |
| Student service | Profile, locked academic data, skills, resume upload. Computes the readiness score (rules + ML) and the level. |
| Matching engine | Parses the job description (NLP), filters by CGPA and branch, ranks by skill-embedding similarity, returns fit score 0-100, level, and the reasons. |
| Scheduler | Interval-overlap check on date, slot, venue and panel. Returns conflicts and the next free slot. |
| Offers service | Offer letter, CTC, documents, joining status (offered, accepted, deferred, withdrawn). |
| Analytics | Branch and skill conversion, package trends, at-risk classifier (low CGPA, weak mock score, repeated rejections). |
| Notifications | Event queue that produces in-app alerts now, email and WhatsApp later. |

**Rule for the frontend:** every screen reads data from `src/api/*.js` functions that return Promises with mock data. When your teammates finish the backend, only those files change. The mock functions should mirror these endpoints:

```text
GET  /student/me                      profile + readiness
POST /student/profile/submit          send for verification
GET  /drives?stream=                  drive list
POST /drives/:id/apply                {fitScore, level, status, explanation, breakdown}
GET  /applications                    applications + explanations
GET  /admin/verification-queue        POST /admin/verification/:id {approve|reject}
GET  /admin/drives                    POST /admin/drives/:id/resolve
GET  /admin/at-risk                   POST /admin/at-risk/:id/mentor
GET  /recruiter/pipeline?stream=      GET /recruiter/candidates/:id
POST /recruiter/slots                 book an interview slot
GET  /offers                          PATCH /offers/:id
GET  /analytics/overview              GET /notifications
```

## 3. Colors: what to avoid and what to use

Most placement sites are royal blue and white. Most AI-made sites are purple-to-blue gradients, glass cards and the Inter font. Avoid both. These rules keep it looking designed by a person:

- One accent color only. Neutrals do 90% of the work.
- No gradients (one faint glow on the landing hero is the only exception), no glassmorphism, no emoji icons. Use lucide line icons.
- Green and red appear only on status badges, never as decoration.
- Serif headings (Fraunces) with a humanist sans (Manrope). This pairing alone stops it looking templated.

### Option A: Odisha Ink (recommended)

Inspired by Pattachitra, Odisha's traditional painting: ink lines and ochre on cream. It is warm, calm and easy to read on a projector, and BPUT judges will quietly recognise the reference. There is no blue anywhere, so it will not look like another placement portal. Best choice for data-heavy tables because judges can read it in seconds.

| Role | Name | Hex |
| --- | --- | --- |
| Page background | Bone | #F6F2E9 |
| Cards | Paper | #FFFDF8 |
| Sidebar, headings, primary buttons | Ink | #14161C |
| Secondary text | Ink soft | #5B5F6B |
| Borders | Line | #E6DFCF |
| The one accent (active nav, score dial, AI sparkle) | Ochre | #E8A33D |
| Accent background / pending badge | Ochre tint, Ochre deep | #FBEFD5, #8A5A0B |
| Verified, approved | Jade, Jade tint | #1F8A63, #DDF1E8 |
| Rejected, conflict | Brick, Brick tint | #C4432F, #F8E1DC |

Text that sits on ochre is always ink, never white.

### Option B: Night Lagoon (dark, dramatic)

Best wow on a big screen, but charts and tables need more care to stay readable.

| Role | Hex |
| --- | --- |
| Background / surface / line | #0B1714 / #12231F / #1F3730 |
| Text / soft text | #E8F0EA / #8FA89C |
| Accent (lime) | #C9F25B |
| Success / danger | #4CC38A / #F0705A |

### Option C: Plum & Peach (soft, friendly)

| Role | Hex |
| --- | --- |
| Background / cards | #FBF5F0 / #FFFFFF |
| Sidebar, headings (plum-black) | #2B1A33 |
| Accent (peach) | #F08A5D |
| Success / danger | #2F8F6B / #B8383D |

If you pick B or C, replace the token line in Prompt 0 with that palette and change nothing else.

## 4. Animation system

Library: framer-motion. Animate only transform, opacity and SVG strokes so everything stays smooth. Timing: 150ms micro, 350ms standard, 700ms scene, easing \[0.22, 1, 0.36, 1\]. Rule that keeps it clean: **one signature animation per screen, everything else subtle.**

Everywhere: scroll reveal with stagger, page fade-and-rise on route change, numbers count up, sliding active-tab underline and sidebar marker, button lift on hover and press on click, skeleton shimmer while loading, and full support for reduced motion.

Signature animations, one per feature:

| Screen | Animation | Trigger |
| --- | --- | --- |
| Landing | The pipeline line draws and its six nodes fill with ochre in order | Scroll |
| Student Overview | Readiness dial sweeps from 72 to 80, ladder marker slides to the next level | Click a skill-gap chip |
| Student Drives | Scan line crosses the row, button turns into a '72% fit' badge | Click Apply (AI Match) |
| Student Applications | Explanation types out, then factor bars fill in sequence | Expand a row |
| Admin Command Center | Bars grow, line draws, numbers count up | Scroll |
| Admin Verification | A check draws and the row folds away; reject shakes first | Approve / Reject |
| Admin Drives | Overlap hatching pulses, the bar slides to a free slot, banner turns jade | Resolve Conflict |
| Admin At-Risk | Risk bar fills, button morphs into a mentor chip | Assign Mentor |
| Recruiter Overview | Funnel bars narrow in sequence | Scroll |
| Recruiter Pipeline | Sparkle shimmer, rows re-order, bio drawer with underlines drawing under key skills | Tab switch, View Bio |
| Cross-portal | Admin approves, Student badge turns Verified and a notification arrives | Action |

## 5. The prompts

Paste in order. Antigravity's Flash model follows explicit instructions well and improvises poorly, so every prompt names files, props and exact text on purpose.

### Prompt 0: Master rules (paste once, also save as DESIGN\_SYSTEM.md)

Put this in Antigravity's Rules if it has them, and also save it as `DESIGN_SYSTEM.md` in the project root. Every later prompt tells it to follow that file.

```text
You are building 'CampusLink AI', a frontend-only, demo-ready web app for a hackathon (BPUT). Read these rules before every task and follow them exactly.

STACK (do not add other libraries): Vite + React 18 (JavaScript, no TypeScript), Tailwind CSS v3.4, react-router-dom v6, framer-motion, recharts, lucide-react. Fonts from Google Fonts: Fraunces (headings, big numbers) and Manrope (UI text).

DESIGN TOKENS (CSS variables in src/index.css, mapped in tailwind.config.js):
bone #F6F2E9 (page background) | paper #FFFDF8 (cards) | ink #14161C (sidebar, headings, primary buttons) | ink-soft #5B5F6B (secondary text) | line #E6DFCF (borders) | ochre #E8A33D (the ONE accent: active nav marker, score dial, AI sparkle, highlights) | ochre-tint #FBEFD5 | ochre-deep #8A5A0B | jade #1F8A63 + jade-tint #DDF1E8 (verified, approved) | brick #C4432F + brick-tint #F8E1DC (rejected, conflict).
Pending status = ochre-tint background with ochre-deep text. Text on ochre is always ink.
Never use blue, purple, gradients (except one faint ochre glow on the landing hero), glassmorphism, neon, emoji, or stock illustrations.

LAYOUT: 8px spacing scale. Cards: paper background, 1px line border, radius 16px, padding 24px, shadow only 0 1px 2px rgba(20,22,28,.04). Page content max width 1200px, 32px gaps between sections. Max 4 metric cards per row. One primary button per area. Generous whitespace beats more content.
TYPE: h1 Fraunces 600 36px; h2 Fraunces 600 24px; body Manrope 15px; labels Manrope 600 12px uppercase with letter spacing in ink-soft; numbers use tabular-nums.

MOTION (framer-motion): ease [0.22,1,0.36,1]. Durations: micro 150ms, standard 350ms, scene 700ms. Every page enters with fade + 8px rise. Scroll reveal through a reusable <Reveal> (whileInView, once, y 16 to 0, stagger 70ms). Buttons: hover lift -2px, press scale .97. Numbers count up. Animate only transform and opacity. Respect prefers-reduced-motion with useReducedMotion. Only ONE signature animation per screen; everything else is subtle.

DATA: no hardcoded data in components. All data comes from src/api/*.js functions that return Promises resolving mock data from src/data/*.js after a 400-700ms delay. Show skeleton shimmer while loading. A real backend will later replace only the src/api files.

QUALITY: after every task run `npm run build`, fix every error and warning, and keep the browser console clean. Semantic HTML, visible ochre focus rings, responsive down to 1024px (sidebar collapses to icons below that). Mock data uses realistic Indian names and companies. Before coding, write a plan of max 5 bullets, then execute without asking questions.
```

### Prompt 1: Setup and shared components

```text
Task 1 of 8: Project setup and shared component library. Follow DESIGN_SYSTEM.md.

1. Create the Vite React project 'campuslink-ui' (JavaScript). Install tailwindcss@3.4 postcss autoprefixer react-router-dom framer-motion recharts lucide-react. Configure Tailwind with the tokens (colors: bone, paper, ink, ink-soft, line, ochre, ochre-tint, ochre-deep, jade, jade-tint, brick, brick-tint; fontFamily display = Fraunces, sans = Manrope). Load the fonts in index.html.
2. Create folders: src/components/ui, src/components/layout, src/pages/landing, src/pages/student, src/pages/admin, src/pages/recruiter, src/api, src/data, src/hooks, src/lib.
3. Build these components in src/components/ui:
 - Button({variant: primary|secondary|ghost|success|danger, size, icon, loading}). Primary = ink background + bone text; secondary = outlined; hover lift; loading shows a small spinner.
 - Card, SectionHeader({title, subtitle, action}), Badge({tone: jade|brick|ochre|ink}), Callout({tone, title, children}), EmptyState, Skeleton.
 - CountUp({to, duration, decimals, suffix}) using framer-motion animate; starts when scrolled into view.
 - MetricCard({label, value, suffix, hint}) using CountUp.
 - Reveal({children, delay, y}) and RevealGroup that staggers its children.
 - DataTable({columns, rows, loading, onRowClick}): columns have render functions; sticky header; row hover = bone background; skeleton rows while loading; rows enter with stagger.
 - Tabs({tabs, value, onChange}) with an ochre underline that slides using layoutId.
 - Drawer({open, onClose, title, width, children}): slides in from the right with a spring, backdrop ink/30 with blur-sm, closes on Esc and backdrop click.
 - ToastProvider + useToast: bottom-center, slide-up, auto-dismiss after 3s.
 - ScoreDial({value, size, label}): semicircle SVG gauge, ochre arc over a line-colored track; when value changes the arc animates from the previous value to the new value with a spring (0.9s) and the center number (Fraunces) counts with it.
4. Add a temporary route /kit that renders every component once. Run npm run dev and npm run build and fix all errors.
Do not build any portal pages yet.
```

### Prompt 2: Mock data, API layer, routing and app shells

```text
Task 2 of 8: Mock data, API layer, routing and the three app shells. Follow DESIGN_SYSTEM.md.

A) Mock data in src/data (realistic, Indian context, consistent IDs across files):
- students.js: 12 students. The logged-in student is Ananya Sharma (CSE, CGPA 8.8, collegeId 220101045). Include Rohan Senapati (CSE, 9.12). Fields: id, name, rollNo, branch, cgpa, skills[], mockScore, backlogs, readinessScore (Ananya = 72), level ('Not Ready'|'Developing'|'Ready'|'Highly Employable'), resumeScore (Ananya = 88), verified, verificationStatus.
- drives.js: 8 drives (Microsoft India SDE 16.5 - 21.0 LPA deadline Oct 18, 2026; Cognizant; Tech Mahindra; TCS Digital; Infosys; L&T and Tata Motors as 'Core Engg'; Capgemini). Fields: id, company, role, stream ('IT / Software'|'Core Engg'), ctcMin, ctcMax, deadline, date, slot, venue, branches[], status ('Verified'|'Conflict'|'Pending Approval'|'Ongoing').
- applications.js: 4 applications for Ananya. Microsoft India - SDE is Rejected, fit 72, explanation 'Below Threshold: CGPA meets eligibility, but candidate shows a gap in cloud infrastructure and mock interview performance.', breakdown [{factor:'Skills match',weight:40,score:62},{factor:'CGPA',weight:20,score:88},{factor:'Mock interview',weight:20,score:48},{factor:'Projects',weight:10,score:80},{factor:'Certifications',weight:10,score:55}].
- verificationQueue.js (6 rows), atRisk.js (14 students, flags like 'Low Mock Score (45/100)' and '3 Rejections'), pipeline.js (10 candidates for Microsoft India, aiMatch values from 94 downward, pipelineStatus 'Shortlisted for R2'|'Technical Review'|'Shortlisted for R1'), offers.js (8 offers: student, company, ctc, status 'Offered'|'Accepted'|'Deferred'|'Withdrawn', documents [{name, status}], joiningDate), notifications.js (8 items per role), analytics.js (branch conversion CSE 82, IT 76, ECE 64, EEE 58, ME 49, CE 41; package trend 2022 to 2026; funnel 342 / 48 / 12 / 16).

B) src/api: studentApi, adminApi, recruiterApi, offersApi, analyticsApi, notificationsApi. Every function is async and returns a deep copy of mock data after a random 400-700ms delay. Mutating calls (applyToDrive, submitProfile, approveStudent, rejectStudent, resolveConflict, assignMentor, scheduleSlot) update ONE shared in-memory store (src/lib/store.js, React context + useSyncExternalStore) so a change in one portal shows up in the others during the session. applyToDrive returns {fitScore, level, status, explanation, breakdown}.

C) Routing (react-router v6): / landing | /student/overview, profile, drives, applications, interviews | /admin/command-center, verification, recruiters, drives, at-risk, offers | /recruiter/overview, jobs, pipeline, slots, analytics. Redirect /student, /admin, /recruiter to their first page. Add a simple 404 page.

D) Shells in src/components/layout: AppShell({role}) = fixed left sidebar (248px, ink background, bone text, lucide icons, active item has a 3px ochre marker that slides between items using layoutId, hover white/5) + sticky top header (paper background, bottom line border). Sidebar items: Student = Dashboard, Profile & Resume, Placement Drives, My Applications, Interviews. Admin = Placement Command Center, Verification Queue, Recruiter Partners, Placement Drives Calendar, At-Risk Analytics, Offers & Joining. Recruiter = Talent Overview, Active Job Postings, Candidate Pipeline, Interview Slots, Hiring Analytics.
Header contents: tenant label (Student: 'CampusLink' with a small college logo placeholder; Admin: 'BPUT - Central Campus · CampusLink Admin'; Recruiter: 'Microsoft India · Talent Acquisition'), a search input with hint 'Search (Ctrl+K)' (Ctrl+K focuses it; admin placeholder 'Search Students/Drives'; recruiter 'Search Candidates'), a notification bell with a small ochre dot, a profile badge (AS / SP / RV).
Also add a Demo role switcher in the header: a small segmented control Student | Admin | Recruiter that navigates between portals with a smooth page transition, so judges can jump around in one click.

E) Each page renders only its title in a SectionHeader inside a PageTransition wrapper (AnimatePresence).
Run build, click through every route, fix errors.
```

### Prompt 3: Landing page

```text
Task 3 of 8: Landing page at '/' (src/pages/landing). Follow DESIGN_SYSTEM.md. Keep it airy: 4 sections only, lots of whitespace, bone background.

1. Hero. Small ochre label 'BPUT Hackathon · PS10'. h1 (Fraunces, 64px): 'From campus to corporate, in one clear pipeline.' One-line subtext: 'AI-powered placement management for students, placement cells and recruiters.' Two buttons: primary 'Explore the demo' (scrolls to #portals) and secondary 'See how it works' (scrolls to #pipeline). Behind the text: one faint ochre radial glow and a very light SVG line pattern (opacity .06) drifting slowly. On load the headline reveals word by word (stagger 60ms, y 24 to 0, clipped mask).
2. Pipeline story (id='pipeline'). Six steps in a row: Profiling, Matching, Scheduling, Notification, Offer Tracking, Analytics. Each has a lucide icon, a title and a one-line description. A thin ink line connects them; as the section scrolls into view the line draws left to right (useScroll + useTransform on pathLength) and each node fills with ochre in sequence while its card reveals. Below 1024px stack vertically.
3. Portals (id='portals'). Three equal cards: Student, Placement Cell (Admin), Recruiter. Each has an icon, title, 3 short value lines, and a button 'Open portal' linking to /student/overview, /admin/command-center, /recruiter/overview. Hover: card lifts 6px, border turns ochre, arrow slides right.
4. Under the hood. Ink background section with 3 columns: 'Rule + AI hybrid scoring', 'Embedding-based matching', 'Conflict-aware scheduler', one short line each. Below, a small architecture diagram made of simple divs and SVG arrows: Data → Scoring & Matching Engine → Scheduler → Notifications → Dashboard. Then count-up stats: 1,420 students · 42 recruiters · 78.4% placed (simulated data).
Header: wordmark 'CampusLink' in Fraunces with a small ochre dot, anchor links Pipeline and Portals. Footer: one line. Check it at 1440px and 1024px.
```

### Prompt 4: Student portal

```text
Task 4 of 8: Student portal (src/pages/student). Follow DESIGN_SYSTEM.md. Use the shared components and data from studentApi.

OVERVIEW (/student/overview)
- h1 'Welcome, Ananya Sharma' with a Badge: 'Verified by Placement Cell' (jade) or 'Pending Verification' (ochre), depending on store data.
- Row of 4 MetricCards: ELIGIBLE DRIVES 18, ACTIVE APPS 4, INTERVIEWS 2, AI RESUME SCORE 88% (count up).
- Two columns below. Left Card 'Placement Readiness': a large ScoreDial (readiness score, 72) and under it a 4-step ladder Not Ready > Developing > Ready > Highly Employable with a marker that slides to the current level. Right Card 'Skill gaps for Microsoft SDE': 4 gap chips (Cloud, System Design, Mock Interviews, Certification) each showing its point gain (+4, +3, +5, +2).
- SIGNATURE ANIMATION: clicking a gap chip marks it 'In progress', an ochre check is drawn inside it (SVG stroke animation), the ScoreDial arc sweeps from the old value to the new value (spring, 0.9s) while the number counts up. When a threshold is crossed (65, 80, 90) the ladder marker slides to the next level with one small pulse ring. Clicking the chip again reverses it. Keep this state local.

PROFILE & RESUME (/student/profile)
- Card 'Locked Academic Data (Managed by Admin)': read-only grid with a lock icon showing College ID 220101045 | Branch CSE | Verified CGPA 8.8.
- Card 'Technical Skills': tag input. Pills (React.js, Python) have an x to remove, with pop-in and pop-out (AnimatePresence + layout). An inline '+ Add Skill...' input adds a pill on Enter.
- Bottom-right buttons: secondary 'Upload Resume (.pdf)' (opens the file picker, then shows the filename as a chip) and primary 'Submit for Verification' (loading for 1s, then toast 'Sent to Placement Cell' and the status badge switches to Pending Verification).

PLACEMENT DRIVES (/student/drives)
- Tabs: All Streams | IT / Software | Core Engg. DataTable columns: Company & Role (company bold, role as subtext), CTC Package (e.g. 16.5 - 21.0 LPA), Deadline, Action.
- Action button 'Apply (AI Match)'. SIGNATURE ANIMATION on click: the button shows 'Matching...' with a sparkle icon, one thin ochre scan line sweeps across the row (0.8s), then the button becomes a Badge with the fit score ('72% fit') and a toast says 'See feedback in My Applications'. Call applyToDrive.

MY APPLICATIONS (/student/applications), Tabs: Applications | Offers
- Applications DataTable: Role (e.g. Microsoft India - SDE), Status Badge (Rejected = brick, Shortlisted = jade, In Review = ochre), Fit Score (small ring + 72%), and a chevron that expands the row.
- Expanded inset Callout 'AI Match Explanation': the explanation text types out fast (25ms per character, once). After it, a 'Why this score' button reveals 5 horizontal factor bars from the breakdown data, filling one after another with the weights shown.
- Only for Rejected rows: a secondary link-button 'Open Notion Remediation Roadmap →' that slides in after the explanation.
- Offers tab: one Card per offer with company, CTC, status Badge, a document checklist (check icon = done, clock icon = pending) and joining date.

INTERVIEWS (/student/interviews)
- A vertical timeline of 2 upcoming interviews (company, date, time, mode); the timeline dots draw in on scroll. Beside it a Card 'Preparation tips' with 3 short items. Interviews booked by the recruiter in the store also appear here.

Keep every screen to at most 2 visual groups per viewport. Run build and test every interaction.
```

### Prompt 5: Admin portal

```text
Task 5 of 8: Admin portal (src/pages/admin). Follow DESIGN_SYSTEM.md. Data from adminApi, analyticsApi and offersApi.

COMMAND CENTER (/admin/command-center)
- Banner Card: 'Placement Season 2026 Administration Console', subtext 'Overseeing 1,420 students and 42 approved hiring partners', primary button '+ Authorize New Drive' (opens a Drawer with a short form: company, date, slot, venue, eligible branches; Save runs a conflict check and shows a toast).
- 4 MetricCards: ELIGIBLE STUDENTS 1,420 | ACTIVE RECRUITERS 42 | OVERALL PLACED % 78.4% | HIGHEST CTC 34.0 LPA (count up).
- Two Recharts charts side by side in Cards, using only ochre and ink, with light horizontal gridlines only: 'Branch-wise conversion' (bar chart, bars grow from 0 when scrolled into view) and 'Package trend' (line chart, the line draws in on view).
- Below, a slim 'Offers pipeline' row of 4 small stat pills: Offered 16 | Accepted 11 | Pending 5 | Documents pending 3.

VERIFICATION QUEUE (/admin/verification)
- DataTable: Student & Roll No. (name + roll number subtext), Branch, Reported CGPA, Document (link 'View Transcript PDF' that opens a Drawer with a placeholder PDF frame), Action: a green 'Approve' button and a red 'Reject' button.
- SIGNATURE ANIMATION: Approve = the row flashes jade-tint, a jade check is drawn (SVG stroke) in the Action cell, then the row collapses (height to 0 and fade) after 600ms and the 'Pending: N' counter in the header decrements. Reject = the row shakes horizontally once, flashes brick-tint, then collapses. Toast for both. Approving updates the store so the student's badge becomes Verified. Empty state 'All caught up' with a drawn check.

RECRUITER PARTNERS (/admin/recruiters)
- DataTable of 8 companies: Company, Drives hosted, Students hired, Avg CTC, Engagement (small bar).

PLACEMENT DRIVES CALENDAR (/admin/drives)
- Tabs: All Drives | Ongoing (1) | Pending Approval (1).
- Callout 'Scheduling Conflict Detected' (brick-tint): 'Request from 'Cognizant Technology' for Nov 02, 2026 overlaps with 'Tech Mahindra' scheduled in Lab 4. Authorization blocked.'
- Right under it a mini timeline for Lab 4 on Nov 02 on a 9:00 to 17:00 axis: two horizontal bars; the overlapping part is hatched in brick and pulses once on load.
- DataTable: Company Name, Drive Date, Eligible Branches (e.g. CSE, IT, ECE), Audit Status (Badge: Verified = jade, Conflict = brick), Actions ('Manage Drive' secondary for verified rows, 'Resolve Conflict' primary for conflict rows).
- SIGNATURE ANIMATION: 'Resolve Conflict' = the Cognizant bar slides with a spring to the next free slot, the hatching fades out, the Callout turns jade with the text 'Resolved: moved to 14:00-16:00, Lab 2', the row Badge morphs from Conflict to Verified and the button becomes 'Manage Drive'. Update the store.

AT-RISK ANALYTICS (/admin/at-risk)
- Callout 'Early Warning System': 'Showing 14 students with low CGPA (<7.0), weak mock-interview performance (<60), or repeated AI screening rejections.'
- DataTable: Student & Roll No., Branch, Flags (warning Badges such as 'Low Mock Score (45/100)' and '3 Rejections'), a small risk bar that fills when in view, and Action 'Assign Mentor'.
- Clicking Assign Mentor opens a small popover with 3 mentor names; after choosing one, the button morphs into a jade chip 'Mentor: Dr. R. Mishra' with a short slide-in.

OFFERS & JOINING (/admin/offers)
- 4 stat pills (Offered, Accepted, Deferred, Withdrawn) and a DataTable: Student, Company, CTC, Offer status Badge, Documents (e.g. 3/4 with a segmented mini progress bar), Joining date, Action 'Send reminder' (toast 'Reminder sent via email').

Run build and test every interaction.
```

### Prompt 6: Recruiter portal

```text
Task 6 of 8: Recruiter portal (src/pages/recruiter). Follow DESIGN_SYSTEM.md. Data from recruiterApi.

TALENT OVERVIEW (/recruiter/overview)
- Banner Card: 'Microsoft India - Campus Hiring Dashboard', summary 'Drive: Associate Software Engineer. 342 BPUT candidates applied.', primary button '+ Post New Job (JNF)' (opens a Drawer with a short Job Notification Form: role, CTC, minimum CGPA, branches, required skills as a tag input; Save shows toast 'Job posted').
- 4 MetricCards: TOTAL APPLICANTS 342 | AI MATCH > 85% 48 | INTERVIEWS SCHEDULED 12 | OFFERS EXTENDED 16. Directly below, a funnel visual of four horizontal bars narrowing in width relative to the values; they grow left to right, one after another, when scrolled into view.

ACTIVE JOB POSTINGS (/recruiter/jobs)
- DataTable of 3 postings: role, CTC, applicants, status Badge.

CANDIDATE PIPELINE (/recruiter/pipeline), the hero screen of this portal
- Tabs: All Streams | CSE / IT | ECE.
- DataTable: Candidate & Roll No., Branch, CGPA, AI Match (ochre percentage with a sparkle icon, e.g. 94%; a faint ochre shimmer sweeps over the sparkle every 6 seconds), Pipeline Status Badge (Shortlisted for R2, Technical Review, Shortlisted for R1), Actions: primary 'Schedule Slot', secondary 'View Bio'. Rows are sorted by AI Match descending; when the tab changes the rows re-order with a layout animation.
- 'Schedule Slot' opens a small popover with 4 time-slot chips (conflict-free only; one disabled chip with the note 'Clashes with TCS drive'). Choosing a slot shows a check animation, updates the INTERVIEWS SCHEDULED count and the store (so it appears in the Student Interviews page), and shows toast 'Slot booked'.
- 'View Bio' opens the Drawer (spring slide-in, 560px): header with the candidate name 'Rohan Senapati' on the left and 'BPUT - Computer Science' on the right; an ochre-tint Callout 'AI Match Explanation (94% Fit)' with the sentence 'Highly Recommended: Candidate possesses strong verified proficiency in React, Python, and Data Structures, exceeding the required mock interview benchmarks and CGPA cut-off.' where the words React, Python and Data Structures get an ochre underline that draws in one after another; a 'Verified Skills' row of read-only tags (Python, FastAPI, React) that pop in with stagger; at the bottom a bordered container labelled 'Embedded PDF Viewer: Verified Resume' showing a clean placeholder resume skeleton.

INTERVIEW SLOTS (/recruiter/slots)
- A weekly grid (Mon to Fri x 4 slots) with booked and free cells. Booking from the pipeline fills a cell with a small pop animation.

HIRING ANALYTICS (/recruiter/analytics)
- Two charts: 'Applicants by branch' (bar) and 'AI match distribution' (histogram), plus 3 stat pills: Avg match, Offer acceptance, Time-to-hire.

Run build and test every interaction.
```

### Prompt 7: Notifications, command search and the connected demo

```text
Task 7 of 8: Cross-portal features. Follow DESIGN_SYSTEM.md.

1. Notification popover. Clicking the bell in the header opens a popover (320px, paper, line border, fade + 8px rise). It lists notifications from notificationsApi for the current role, grouped as Shortlisting, Deadlines, Offers and Drives, with an unread ochre dot, relative time ('2h ago') and 'Mark all read' (the header dot disappears). Items stagger in. Close on outside click and Esc.
2. Command search. Ctrl+K opens a centered search palette (paper, backdrop ink/30) with a text input and a list of pages and quick actions for the current role (for example 'Go to Verification Queue', 'Open Candidate Pipeline'). Arrow keys move the selection, Enter navigates, Esc closes. Results filter as you type.
3. Connected demo. Using the shared store, make these cross-portal effects work and add a notification for each:
 - Admin approves a student -> that student's badge becomes 'Verified by Placement Cell' and the student gets a notification.
 - Admin resolves the Cognizant conflict -> the drive shows as Verified in Student Drives and in the Admin list.
 - Student applies to a drive -> the recruiter's AI MATCH list gets a new candidate row for that drive.
 - Recruiter books a slot -> the student's INTERVIEWS count increases by 1 and the interview shows on Student Interviews.
 - Admin 'Send reminder' on an offer -> the student's offer checklist shows a 'Reminder received' note.
4. When the notification count changes, the bell icon does one small swing (rotate -12 to 12 to 0, 500ms).
Run build and test each of the five effects by switching portals with the Demo role switcher.
```

### Prompt 8: Polish, QA and handoff

```text
Task 8 of 8: Final polish and handoff. Follow DESIGN_SYSTEM.md. Do not add new features; only fix and refine.

1. Spacing audit: every page uses the 8px scale, 32px between sections, max width 1200px. Remove any screen element that is not in the spec or this plan if it makes a screen feel crowded.
2. Visual consistency: no color outside the tokens, no leftover default blue or gray, no gradients other than the hero glow, all icons from lucide-react with the same stroke width (1.75).
3. Motion audit: only transform, opacity and SVG strokes are animated; each screen has one signature animation; with prefers-reduced-motion everything appears instantly and no looping animation runs.
4. States: every table has a loading skeleton, an empty state, and no layout jump when data arrives. Every button that triggers an async action shows its loading state.
5. Accessibility and responsiveness: keyboard focus ring on all interactive elements, Drawer and palette trap focus and close on Esc, layout works at 1440px, 1280px and 1024px, no horizontal scrolling.
6. Housekeeping: page titles per route, favicon (an ink circle with an ochre dot), remove console.log, delete the /kit route, make sure `npm run build` has zero warnings.
7. Write README.md with run instructions, folder map, and BACKEND_CONTRACT.md listing every function in src/api with its endpoint, request body and response shape (generated from the code), so the backend team can connect real endpoints by only editing src/api.
Finally, give me a bullet list of anything you could not finish.
```

## 6. The 90-second demo path for judges

Judges have little time, so rehearse this order. It touches every PS stage and uses each signature animation once:

1. Landing: let the pipeline line draw (this is your 20-second story: Profiling to Analytics).
2. Student Overview: click a skill-gap chip, the dial moves and the ladder level changes.
3. Student Drives: Apply (AI Match) on Microsoft, then open My Applications and show the typed explanation and the factor bars.
4. Switch to Admin with the role switcher: approve one student, then Resolve Conflict on the Cognizant drive.
5. Switch to Recruiter: open the pipeline, View Bio on Rohan Senapati, book a slot.
6. Switch back to Student: the new interview and notification are already there. Close on the Admin Command Center charts.

## 7. If Antigravity drifts

- **Looks crowded:** 'Re-read DESIGN\_SYSTEM.md. Fix only deviations: remove extra elements, restore 32px section gaps and 24px card padding. Do not change functionality.'
- **Animation is janky:** 'Animate only transform and opacity. Replace any animation of width, height or top with transform or layout animation, and run the build.'
- **Colors off:** 'Search the project for any hex color or Tailwind color class that is not a design token and replace it with the nearest token.'
- **Build errors pile up:** 'Stop adding features. Run npm run build, fix errors one file at a time starting from the first one, and report what changed.'
- **Backend arrives:** 'Replace only the mock functions in src/api with fetch calls to these endpoints (paste BACKEND\_CONTRACT.md). Keep the same return shapes and do not touch components.'

Optional later, only if you have time: a floating student FAQ chatbot, and a mock-interview analysis page. Skip them if the rest is not perfect first; a clean demo beats a bigger one.

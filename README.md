# 🏆 CampusLink — Multi-Portal Campus Placement & Semantic OS
### BPUT Hackathon 2026 · Problem Statement 10 (PS10)

> **Autonomous Campus Recruitment Ecosystem with Semantic Matching, Real-Time Cross-Portal Reactivity, and Conflict-Free Panel Scheduling.**  
> *Branch: `Demo8` · Release: Production Certified · Ready for Full-Stack & Backend Integration*

---

## 📌 Table of Contents
1. [Executive Summary](#-executive-summary)
2. [Live Demos & Credentials](#-live-demos--credentials)
3. [Architecture & Directory Structure](#-architecture--directory-structure)
4. [Frontend Component & Design System](#-frontend-component--design-system)
5. [Cross-Portal Reactive State Machine](#-cross-portal-reactive-state-machine)
6. [Backend Integration Blueprint (For Toijam Ghanashyam)](#-backend-integration-blueprint-for-toijam-ghanashyam)
   - [Recommended Database Schema (PostgreSQL / Supabase)](#1-recommended-database-schema-postgresql--supabase)
   - [REST / RPC API Endpoints](#2-recommended-rest--rpc-api-endpoints)
   - [Migration Strategy: Swapping Mock Store for Real APIs](#3-migration-strategy-swapping-mock-store-for-real-apis)
7. [Netlify & Production Deployment](#-netlify--production-deployment)
8. [Local Development Workflow](#-local-development-workflow)

---

## 🌟 Executive Summary

**CampusLink** replaces legacy paper trails, disparate Google Sheets, and manual email coordination with an autonomous, real-time recruitment platform connecting three major stakeholders:
1. **Students** — Real-time readiness diagnostic, explainable AI semantic skill matching, certified credential audits, and synchronized interview calendars.
2. **Placement Directorate (TPO / Admin)** — University-wide placement command center, student transcript audit queue, multi-venue drive clash resolver, and at-risk candidate early warning system.
3. **Corporate Recruiters** — Dynamic talent search, semantic fit rank boards, conflict-free 5-day interview panel matrix, and stage-by-stage candidate pipeline dispatch.

---

## 🔑 Live Demos & Credentials

Visit **`/login`** to access any portal or preview the application immediately:

| Portal | Role | Username / Roll No | Access Key | Landing Route |
| :--- | :--- | :--- | :--- | :--- |
| **Instant 1-Click Demo** | `demo` | *(One-click bypass)* | *(None)* | `/student/overview` |
| **Student Hub** | `student` | `21CS3042` | `campuslink@2026` | `/student/overview` |
| **Placement Cell (Admin)** | `admin` | `Dr. Ananya Verma` | `CL-TPO-2026-X9` | `/admin/command-center` |
| **Corporate Recruiter Desk** | `recruiter` | `Atlassian` *(or Stripe, Google, Razorpay)* | `recruiter#atlassian26` | `/recruiter/overview` |

> **Default Seed Persona**: The student portal is seeded for **Zahid Khan** (`s-1`, Roll: `21CS3042`, B.Tech CSE, 8.82 CGPA). The recruiter company dynamically reflects the company chosen during login (stored in `sessionStorage`).

---

## 🏛 Architecture & Directory Structure

```text
c:\Users\zahid\OneDrive\Desktop\Hackathons\BPUT2026\
├── public/
│   ├── _redirects                # Netlify SPA redirect rule (/* -> /index.html 200)
│   └── favicon.svg               # Monochrome brand mark
├── src/
│   ├── api/                      # [Target Integration Directory for Axios / Supabase client]
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.jsx      # Sticky top navigation, responsive mobile drawer, user badge
│   │   │   ├── NotificationPopover.jsx # Real-time alerts drop-down
│   │   │   └── RoleSwitcher.jsx  # Floating quick-switcher between portals
│   │   └── ui/                   # High-craft UI design system
│   │       ├── Badge.jsx         # Status pill with semantic theme borders
│   │       ├── Card.jsx          # Pure monochrome card container with tokenized borders
│   │       ├── DataTable.jsx     # Mobile-responsive horizontal scroll table with swipe hint
│   │       ├── Modal.jsx         # Accessible modal backdrop with focus trap
│   │       ├── StatCard.jsx      # Metric stat callout with trend indicator
│   │       ├── Tabs.jsx          # Tab bar switcher
│   │       └── TagInput.jsx      # Interactive tag chip editor with Day/Night safe tokens
│   ├── data/                     # Mock data records (blueprint for DB seed data)
│   │   ├── mockData.js           # Placement drives, companies, metrics
│   │   ├── notifications.js      # Cross-portal alert records
│   │   ├── pipeline.js           # Recruiter candidate stage board
│   │   ├── slots.js              # 5-Day interview panel slots
│   │   ├── students.js           # Zahid Khan and peer student profiles
│   │   └── verificationQueue.js  # TPO audit queue items
│   ├── lib/
│   │   ├── store.jsx             # Unified React Context state machine (REPLACE WITH API)
│   │   └── utils.js              # Formatting helpers, classnames merger
│   ├── pages/
│   │   ├── admin/                # Placement Cell Directorate pages
│   │   │   ├── AdminAtRisk.jsx
│   │   │   ├── AdminCommandCenter.jsx
│   │   │   ├── AdminDrives.jsx
│   │   │   ├── AdminOffers.jsx
│   │   │   ├── AdminRecruiters.jsx
│   │   │   └── AdminVerification.jsx
│   │   ├── auth/
│   │   │   └── LoginPage.jsx     # Zero-scroll dual-mode login with astronomical canvas
│   │   ├── recruiter/            # Corporate Hiring Partner pages
│   │   │   ├── RecruiterAnalytics.jsx
│   │   │   ├── RecruiterJobs.jsx
│   │   │   ├── RecruiterOverview.jsx
│   │   │   ├── RecruiterPipeline.jsx
│   │   │   └── RecruiterSlots.jsx
│   │   ├── student/              # Student Placement Hub pages
│   │   │   ├── StudentApplications.jsx
│   │   │   ├── StudentDrives.jsx
│   │   │   ├── StudentInterviews.jsx
│   │   │   ├── StudentOverview.jsx
│   │   │   └── StudentProfile.jsx
│   │   └── LandingPage.jsx       # 3D interactive hero showcase
│   ├── theme/
│   │   └── ThemeProvider.jsx     # Day / Night mode manager via CSS variables
│   ├── App.jsx                   # React Router route registry
│   ├── index.css                 # Semantic design tokens and responsive CSS resets
│   └── main.jsx                  # React 18 DOM mount point
├── netlify.toml                  # Netlify build & rewrite configuration
├── package.json                  # Vite 5, React 18, Tailwind CSS, Lucide React
└── vite.config.js                # Vite bundler configuration
```

---

## 🎨 Frontend Component & Design System

### 1. Pure Monochrome Palette & CSS Variables
The UI avoids arbitrary hex values in components and instead relies on semantic variables defined in `src/index.css` and controlled by `src/theme/ThemeProvider.jsx`:
- `var(--bg)`: Main page canvas (`#070709` in dark mode, `#FDFDFD` in light mode).
- `var(--surface)`: Cards, panels, dropdowns (`#0E0E12` / `#FFFFFF`).
- `var(--border)` & `var(--border-strong)`: Crisp high-contrast dividers (`rgba(255,255,255,0.08)` / `rgba(0,0,0,0.12)`).
- `var(--fg)` & `var(--fg-subtle)`: Primary and secondary typographic fills.
- `var(--accent)`: Institutional highlight tint.

### 2. High-Craft UI Primitives (`src/components/ui/`)
- **`Card`**: Standard panel wrapper with hover borders and optional padding controls.
- **`DataTable`**: Responsive data table with auto-overflow and mobile swipe cue (`Swipe horizontally →`).
- **`TagInput`**: Dynamic chip input element with theme-safe background tokens.
- **`Badge`**: Status indicator with pre-defined semantic color mapping (`green`, `yellow`, `red`, `blue`, `neutral`).

---

## ⚡ Cross-Portal Reactive State Machine

Currently, the entire application's cross-portal reactivity is orchestrated inside **`src/lib/store.jsx`** using a React Context provider. 

### Key Synchronized Actions:
1. **`scheduleInterviewSlot(payload)` & `bookPanelSlot(slotId, candidateData)`**:
   - Updates the recruiter's candidate pipeline stage.
   - Locks the corresponding cell in the 5-day panel grid (`RecruiterSlots.jsx`).
   - Dynamically inspects if the candidate is the active student (`s-1` / `Zahid Khan`). If yes, creates a synchronized event in `StudentInterviews.jsx`.
   - Dispatches real-time notification alerts to all 3 portals.
2. **`releasePanelSlot(slotId)`**:
   - Releases a booked panel slot back to available capacity.
   - Clears the student calendar event.
3. **`verifyStudent(id)` / `rejectStudent(id, reason)`**:
   - Updates the status in `AdminVerification.jsx`.
   - Modifies the verification badge on `StudentProfile.jsx`.
4. **`resolveClash(driveId)`**:
   - Clears scheduling conflicts in the TPO clash detection matrix (`AdminDrives.jsx`).

---

## 🛠 Backend Integration Blueprint (For Toijam Ghanashyam)

This section provides the exact blueprint for connecting this frontend to your **PostgreSQL / Supabase** or **Node.js / Express / Next.js** backend.

### 1. Recommended Database Schema (PostgreSQL / Supabase)

```sql
-- 1. USERS & PROFILES
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'admin', 'recruiter')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_profiles (
  id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  roll_no TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  department TEXT NOT NULL,
  batch_year INT NOT NULL,
  cgpa NUMERIC(3,2) NOT NULL,
  active_backlogs INT DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  readiness_score INT DEFAULT 75,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  transcript_url TEXT,
  resume_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RECRUITER COMPANIES
CREATE TABLE recruiter_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT DEFAULT 'Tier-1',
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PLACEMENT DRIVES
CREATE TABLE placement_drives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES recruiter_companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  role TEXT NOT NULL,
  ctc_lpa NUMERIC(4,2) NOT NULL,
  min_cgpa NUMERIC(3,2) NOT NULL,
  max_backlogs INT DEFAULT 0,
  allowed_departments TEXT[] DEFAULT '{}',
  drive_date DATE NOT NULL,
  venue TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. APPLICATIONS & PIPELINE
CREATE TABLE drive_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  stage TEXT DEFAULT 'Applied' CHECK (stage IN ('Applied', 'OA', 'GD', 'R1', 'R2', 'HR', 'Offered', 'Rejected')),
  ai_match_score INT DEFAULT 0,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (drive_id, student_id)
);

-- 5. INTERVIEW SLOTS (5-DAY RECRUITER PANEL MATRIX)
CREATE TABLE interview_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drive_id UUID REFERENCES placement_drives(id) ON DELETE CASCADE,
  day_label TEXT NOT NULL, -- e.g. 'Day 1'
  slot_date DATE NOT NULL,
  time_slot TEXT NOT NULL, -- e.g. '09:00 AM'
  panel_name TEXT NOT NULL, -- e.g. 'Panel 1'
  candidate_id UUID REFERENCES student_profiles(id) ON DELETE SET NULL,
  candidate_name TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'booked', 'held')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. AUDIT / VERIFICATION QUEUE
CREATE TABLE verification_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES student_profiles(id) ON DELETE CASCADE,
  audited_by UUID REFERENCES users(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  auditor_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  audited_at TIMESTAMPTZ
);

-- 7. NOTIFICATIONS
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_role TEXT CHECK (target_role IN ('student', 'admin', 'recruiter', 'all')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### 2. Recommended REST / RPC API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Authenticate user & return session JWT + role |
| `GET` | `/api/student/profile` | Fetch logged-in student's academic record & readiness |
| `PUT` | `/api/student/skills` | Update student skill tag list |
| `GET` | `/api/student/interviews` | Fetch student's booked interview timeline |
| `GET` | `/api/drives` | List available placement drives with student match % |
| `POST` | `/api/drives/:id/apply` | Submit 1-click application |
| `GET` | `/api/admin/command-center`| Overall placement metrics & department breakdowns |
| `GET` | `/api/admin/verification` | Fetch pending transcript audit queue |
| `POST` | `/api/admin/verification/:id/audit` | Verify or reject student credentials |
| `GET` | `/api/recruiter/pipeline` | Fetch candidate pipeline cards filtered by drive/company |
| `POST` | `/api/recruiter/pipeline/stage` | Update candidate stage (`OA` -> `R1` -> `Offered`) |
| `GET` | `/api/recruiter/slots` | Fetch 5-day panel matrix slots |
| `POST` | `/api/recruiter/slots/book` | Lock an interview slot for a candidate |
| `POST` | `/api/recruiter/slots/release` | Release an interview slot |
| `GET` | `/api/notifications` | Fetch unread notifications for current user |

---

### 3. Migration Strategy: Swapping Mock Store for Real APIs

To connect the frontend components to your backend without breaking any UI layout:

1. **Create an API client** at `src/api/client.js`:
   ```javascript
   // src/api/client.js
   const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

   export async function apiFetch(endpoint, options = {}) {
     const token = localStorage.getItem('cl_token');
     const res = await fetch(`${BASE_URL}${endpoint}`, {
       ...options,
       headers: {
         'Content-Type': 'application/json',
         ...(token ? { Authorization: `Bearer ${token}` } : {}),
         ...options.headers,
       },
     });
     if (!res.ok) throw new Error(await res.text());
     return res.json();
   }
   ```

2. **Wire into `src/lib/store.jsx`**:
   Instead of initializing state from `INITIAL_SLOTS` and `INITIAL_PIPELINE`, replace the state setters with `useEffect` calls to `apiFetch('/recruiter/slots')` and `apiFetch('/recruiter/pipeline')`.
   Because all components consume `useStore()`, **no component files will need to be refactored**!

---

## 🌐 Netlify & Production Deployment

### Why `netlify.toml` and `public/_redirects` are Included:
In a React Single Page Application (SPA), routing is handled in the browser via HTML5 History API (`/student/overview`, `/recruiter/pipeline`, etc.). If a user refreshes the page or navigates directly to a sub-route on Netlify, the server will return a `404 Not Found` unless redirected to `/index.html`.

- **`netlify.toml`**:
  ```toml
  [build]
    command = "npm run build"
    publish = "dist"

  [[redirects]]
    from = "/*"
    to = "/index.html"
    status = 200
  ```
- **`public/_redirects`**:
  ```text
  /*    /index.html   200
  ```

> **Note**: These files are lightweight (<200 bytes total), do not touch backend code, and guarantee that client-side routing never breaks in production.

---

## 💻 Local Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Vite Dev Server
```bash
npm run dev
```
Navigate to `http://localhost:5173`.

### 3. Build & Verify for Production
```bash
npm run build
npm run preview
```
Ensures 0 compile errors and outputs the bundled assets to `dist/`.

---

## 🤝 Collaboration & Branch Strategy

- **Upstream Repository (Zahid)**: `https://github.com/zahidkhancodes/CampusLink.git` (Branch: `Demo8`)
- **Integration Target (Toijam Ghanashyam)**: `https://github.com/Toijam-Ghanashyam/campuslink-v2.git`
- **Recommended Workflow**: Work on feature branches or merge `Demo8` into `main` after connecting the backend API endpoints.

---
*Developed for BPUT Hackathon 2026. Built with React 18, Vite 5, Tailwind CSS, and Lucide React.*

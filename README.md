# CampusLink v2.0 Enterprise

**CampusLink** is a next-generation institutional campus placement and recruitment operating system designed for universities and corporate hiring teams. It automates policy enforcement, provides AI-driven candidate screening, facilitates real-time drive-day coordination, and powers personalized skill remediation.

---

## 🌟 Key Features

### 1. Placement Eligibility Policy (PEP) Engine
- Pure functional, side-effect-free policy engine enforcing institutional rules.
- Verification lock gates preventing unauthorized applications until Placement Cell clearance.
- Real-time active backlog gates and CGPA cutoffs.
- Automated **1.5x CTC tier upgrade multiplier** preventing horizontal applications within identical compensation tiers.

### 2. AI Resume Screener (Gemini 3.8 Flash)
- Structured evaluation across Computer Science fundamentals (40%), technical project depth (30%), and coursework depth (30%).
- Real-time prompt-injection sanitization via regularized Unicode filtering and attack string redaction.
- Dynamic fallback to **Gemini 3.5 Flash** for high-availability scoring.

### 3. Drive-Day War Room & Live Dispatch
- Recruiter control room for real-time candidate queue management sorted by AI match score.
- Dynamic interview panel/room assignments with one-click dispatch triggers (`INTERVIEW_R1`, `INTERVIEW_R2`, `HR_ROUND`, `OFFERED`).
- Real-time student pager with Web Audio API chime notifications and offer locking.

### 4. Native Student Remediation Studio
- Embedded **Monaco Code Editor** with multi-language syntax highlighting (Python, JavaScript, C++).
- Sub-second code runner featuring local host execution for Node.js and Gemini 3.8 Flash runner for Python and C++.
- Targeted skill-gap diagnostic feed based on past drive screening audits.

### 5. TPO Administrative Console
- Institutional KPIs: Placement percentages, verified candidate count, and drive tracking.
- Student academic record management: CGPA updating, backlog monitoring, debarment toggles, and PEP verification locks.
- One-click placement drive creation and publishing.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, Turbopack, Server Actions)
- **Language**: TypeScript (Strict Mode)
- **Database & Auth**: Supabase (@supabase/ssr, PostgreSQL with RLS, Realtime Channels)
- **AI Model**: Google Gemini 3.8 Flash (@google/genai) with 3.5 Flash backup
- **UI Components**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Code Studio**: Monaco Editor (@monaco-editor/react)
- **Document Parsing**: pdf-parse

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ installed
- A Supabase project with database and storage enabled
- A Google Gemini API key

### 2. Environment Setup
Copy `.env.example` to `.env.local` and configure your credentials:

```bash
cp .env.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your-gemini-api-key
```

### 3. Database Migration
Run the SQL script located at `supabase/schema.sql` in your Supabase SQL Editor. This sets up:
- `student_profiles`
- `placement_drives`
- `drive_applications`
- Automatic user creation trigger
- Row-Level Security (RLS) policies

### 4. Install & Run
```bash
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to access CampusLink.

---

## 📄 License
MIT License.

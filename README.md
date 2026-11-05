# 🏆 CampusLink AI — BPUT Hackathon 2026 (PS10)

> **AI-Powered Campus-to-Corporate Placement Management & Analytics Platform**  
> *Domain: EdTech + Artificial Intelligence / Career Services Automation*

---

## 🌟 Executive Overview

CampusLink AI digitizes, automates, and intelligently optimizes the entire campus placement lifecycle for universities, colleges, students, and recruiters.

### 🎨 Odisha Ink Design System
- **Cultural Inspiration**: Warm cream (`#F6F2E9`), rich paper cards (`#FFFDF8`), crisp ink borders (`#E6DFCF`), and traditional ochre accents (`#E8A33D`) inspired by Odisha's Pattachitra artistry.
- **Human-Crafted Aesthetic**: Zero purple AI gradients, zero generic glassmorphism. Uses **Fraunces** (display serif) and **Manrope** (humanist sans-serif) for high legibility on projection screens.
- **One Signature Animation per Screen**: Fast, GPU-accelerated motion (only `transform`, `opacity`, and SVG path strokes) with strict `prefers-reduced-motion` compliance.
- **Unified Reactive Store**: An in-memory external store connects all three portals in real-time. Actions in one portal propagate immediately across the entire system.

---

## 🚀 The 90-Second Demo Path for Judges

To present the full capability in under two minutes:

1. **Landing Page (`/`)**:
   - Scroll through the 6-stage pipeline (Profiling → Matching → Scheduling → Notification → Offer Tracking → Analytics).
   - Show the architecture section illustrating hybrid scoring, embeddings, and interval scheduling.
2. **Student Portal (`/student/overview`)**:
   - Point out the **Readiness Progression Ladder** and **ScoreDial (72/100)**.
   - Click a skill-gap chip (e.g., *Cloud Infrastructure +4*). Watch the dial sweep in real-time and the ladder marker slide with a pulse ring!
3. **Student Drives & Applications (`/student/drives` & `/student/applications`)**:
   - Click *Apply (AI Match)* on a drive. Watch the scan line sweep across the row.
   - Go to *My Applications*. Click Microsoft SDE to show the typewriter AI explanation and sequential factor weight bars. Show the *Notion Remediation Roadmap* button for rejected applications.
4. **Admin Placement Cell (`/admin/command-center` & `/admin/drives`)**:
   - Switch via the header **Demo Role Switcher** to **Admin**.
   - Review the Recharts conversion and package trend graphs.
   - Go to *Verification Queue*: click **Approve** on Ananya Sharma. Watch the row flash jade, draw a checkmark, and collapse.
   - Go to *Drives Calendar*: point out the **Cognizant vs Tech Mahindra Lab 4 collision**. Click **Resolve Conflict**. Watch the Cognizant bar slide to Lab 2 and the banner turn jade!
5. **Corporate Recruiter Portal (`/recruiter/pipeline`)**:
   - Switch role to **Recruiter**.
   - Show the candidate pipeline sorted by AI Match. Click **View Bio** on Rohan Senapati (94% Fit) to show the drawn underline skill highlights.
   - Click **Schedule Slot** and choose a conflict-free slot.
6. **Cross-Portal Verification**:
   - Switch back to **Student**: show that the interview has automatically appeared under *Interviews* and Ananya's status badge is now **Verified by Placement Cell**!

---

## 🛠 Tech Stack

- **Framework**: Vite + React 18 (JavaScript)
- **Styling**: Tailwind CSS v3.4 + Custom CSS Variables
- **Icons**: Lucide React (stroke width 1.75)
- **Animation**: Framer Motion
- **Data Visualizations**: Recharts
- **Routing**: React Router v6

---

## 💻 Running the Application

### 1. Development Mode
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 2. Production Build
```bash
npm run build
```

### 3. Production Preview
```bash
npm run preview
```

---

## 📁 Repository Structure

```
├── BACKEND_CONTRACT.md          # Complete API specification for backend integration
├── DESIGN_SYSTEM.md             # Color tokens, layout standards, and motion rules
├── Problem.txt                  # Official BPUT PS10 Problem Statement
├── index.html                   # HTML entry with Fraunces & Manrope fonts
├── tailwind.config.js           # Odisha Ink color palette mapping
├── vite.config.js               # Vite bundler configuration
└── src/
    ├── api/                     # Async mock API layer (swappable with real backend)
    ├── data/                    # Realistic Indian student, drive, and offer datasets
    ├── lib/
    │   ├── store.jsx            # Shared cross-portal reactive in-memory store
    │   └── utils.js             # Formatting and styling utilities
    ├── components/
    │   ├── ui/                  # Reusable UI component library (ScoreDial, Button, etc.)
    │   └── layout/              # AppShell, CommandPalette (Ctrl+K), NotificationPopover
    └── pages/
        ├── landing/             # Airy, 4-section public landing page
        ├── student/             # 5 Student screens (Overview, Profile, Drives, Apps, Interviews)
        ├── admin/               # 6 Admin screens (Command, Verification, Drives, At-Risk, Offers)
        └── recruiter/           # 5 Recruiter screens (Overview, Jobs, Pipeline, Slots, Analytics)
```

---

## 🏆 BPUT PS10 Compliance Checklist

- [x] **Student Readiness & Employability Scoring**: ScoreDial + 4-tier ladder (Not Ready → Highly Employable).
- [x] **Skill-Gap Diagnostic**: Interactive chips that dynamically recalculate readiness scores.
- [x] **Recruiter-Student AI Matching**: Semantic fit scores (0-100%) with weighted factor breakdowns.
- [x] **Conflict-Aware Drive Scheduling**: Overlap detection with interactive 1-click timeline mitigation.
- [x] **Offer & Documentation Tracking**: Full post-selection lifecycle with verified document checklists.
- [x] **Predictive At-Risk Early Warning**: Risk indicators (<7.0 CGPA, low mock scores) with mentor assignment.
- [x] **Real-Time Cross-Portal Sync**: Actions in Admin/Recruiter immediately reflect in Student views.
- [x] **Global Command Palette**: `Ctrl+K` accessible navigation and action runner.


# 🏆 CampusLink — BPUT Hackathon 2026 (PS10)

> **Autonomous Multi-Portal Campus Placement & Semantic Engine**  
> *Domain: EdTech · AI Semantic Matching · Conflict-Free Scheduling · Multi-Tenant University Operations*  
> *Branch: `Demo8` · Release: Production Certified*

---

## 🌟 Executive Summary

**CampusLink** digitizes, automates, and explains the full campus placement lifecycle across university directorates, students, and corporate hiring partners. Built specifically for **BPUT Problem Statement 10 (PS10)**, the platform replaces manual spreadsheets and uncoordinated communications with:

1. **Autonomous Unified Operations**: Seamless synchronization across the **Student Hub**, **Placement Directorate (Admin)**, and **Corporate Recruiter Desk**.
2. **Explainable AI Semantic Fit Scoring (0–100%)**: Multi-factor candidate-job compatibility matching based on verified skills, academic consistency, and mock interview performance.
3. **Conflict-Free Dynamic Interval Scheduling**: Automated temporal and venue collision prevention across concurrent recruitment drives.
4. **Live Cross-Portal Reactivity**: Recruiter actions (whether scheduling via Candidate Pipeline or locking a slot in the 5-Day Panel Grid) instantly update the student's personal calendar, recruiter capacity telemetry, and audit rosters.
5. **Pure Monochrome Visual Architecture**: High-craft editorial aesthetic with 30-degree astronomical canvas effects, zero-scroll viewport layouts, and WCAG AAA-compliant high-contrast theme toggling.

---

## 🚀 Quick Start Guide

### 1. Installation & Local Development
```bash
# Clone repository
git clone https://github.com/zahidkhancodes/CampusLink.git
cd CampusLink

# Switch to Demo8 branch
git checkout Demo8

# Install dependencies
npm install

# Run the development server
npm run dev
```
Open **`http://localhost:5173`** in your browser.

### 2. Production Build & Preview
```bash
# Compile and generate production bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🔑 Portal Access & Demo Credentials

Visit **`/login`** to enter any of the 3 portals. Demo credentials and instant 1-click links are pre-configured:

| Portal | Role ID | Username / Roll No | Password / Key | Initial Route |
| :--- | :--- | :--- | :--- | :--- |
| **Instant Demo** | `demo` | *(Instant 1-Click Access)* | *(None)* | `/student/overview` |
| **Student Portal** | `student` | `21CS3042` | `campuslink@2026` | `/student/overview` |
| **Placement Cell (Admin)** | `admin` | `Dr. Ananya Verma` | `CL-TPO-2026-X9` | `/admin/command-center` |
| **Corporate Recruiter** | `recruiter` | `Atlassian` *(or Stripe, Google, Razorpay)* | `recruiter#atlassian26` | `/recruiter/overview` |

---

## 🏛️ Application Architecture & Portals

### 1. Student Portal (`/student/*`)
- **Readiness & Diagnostic (`/student/overview`)**: Readiness score dial needle, real-time skill gap adjusters, and live conversion analytics for **Zahid Khan** (Roll No: `21CS3042`).
- **Academic Record & Skills (`/student/profile`)**: Certified CGPA transcripts, official transcript upload, and editable technical stack parsed for recruiter matching.
- **Placement Drives (`/student/drives`)**: Active corporate recruitment notices with 1-click semantic skill embedding evaluation.
- **Applications & Offers (`/student/applications`)**: Multi-stage application audit register and authenticated offer letter checklist.
- **Interview Calendar (`/student/interviews`)**: Live synchronized timeline reflecting interviews scheduled by corporate recruiter panels in real-time.

### 2. Central Placement Directorate (Admin) (`/admin/*`)
- **Command Center (`/admin/command-center`)**: High-level university placement KPIs, department placement percentages, and active alerts.
- **Verification Queue (`/admin/verification`)**: Student transcript audit queue with 1-click **Verify** or **Reject & Request Revision**.
- **Recruiter Partners (`/admin/recruiters`)**: Historical partner conversion rates and average CTC packages.
- **Drives & Clash Resolver (`/admin/drives`)**: Multi-resource venue timeline that automatically detects and resolves scheduling collisions across labs and lecture halls.
- **At-Risk Early Warning (`/admin/at-risk`)**: ML classifier identifying unplaced candidates with dynamic mentor assignment popovers.
- **Offers & Compliance (`/admin/offers`)**: University-wide offer acceptance, package distributions, and CTC audits.

### 3. Corporate Recruiter Portal (`/recruiter/*`)
- **Talent Overview (`/recruiter/overview`)**: Cohort distributions, applicant skill coverage, and conversion funnel.
- **Active Job Postings (`/recruiter/jobs`)**: Requirements, cut-offs, and batch eligibility criteria.
- **Candidate Pipeline (`/recruiter/pipeline`)**: Semantic skill-embedding rank board with explainable match scores, candidate bio drawers, and direct slot booking.
- **Interview Slots Grid (`/recruiter/slots`)**: Conflict-free interactive 5-day panel matrix to lock or release candidate interview windows, synchronized across all portals.
- **Hiring Analytics (`/recruiter/analytics`)**: Department-wise conversion rates and hiring velocity.

---

## ⚡ Live Cross-Portal State Synchronization

The application features full bidirectional reactive state synchronization powered by `src/lib/store.jsx`:

1. **Recruiter Slot Booking (Pipeline & Panel Grid)**:
   - When a recruiter schedules a slot from either the **Candidate Pipeline** or the **Interview Slots Grid**, the candidate is immediately locked into the panel matrix.
   - If the candidate is the logged-in student persona (**Zahid Khan**), the interview is automatically injected into the student's **Interview Calendar** with confirmed status, time, date, and company name.
   - Real-time cross-portal notification badges update in the top navigation popover for Student, Recruiter, and Admin.
2. **Dynamic Recruiter Persona**:
   - The recruiter company dynamically reflects the company selected during login (e.g., *Atlassian India*, *Stripe India*, *Google India*, etc.), eliminating hardcoded names in notifications and calendar entries.
3. **Admin Verification & Clash Resolver**:
   - Resolving a venue clash in `AdminDrives.jsx` mitigates the collision and dispatches notifications across portals in under 1 second.
   - Approving student credentials in `AdminVerification.jsx` updates the student's status from *Pending Audit* to *Verified*.

---

## 🌐 Deploying to Netlify (Direct from GitHub Dropdown)

This project includes built-in **`netlify.toml`** and **`public/_redirects`** configuration for Single-Page Application (SPA) client-side routing.

### Step-by-Step Instructions:
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Select **GitHub** and grant access to your repository.
4. From the repository list, select **`CampusLink`** (or `BPUT2026`).
5. In the **Branch to deploy** dropdown, select **`Demo8`**.
6. Netlify will automatically detect settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Deploy site"**.
8. Within ~30 seconds, your multi-portal application is live with full route refresh support!

---

## 🛠️ Tech Stack & Architecture

- **Core**: React 18 + Vite 5 (ESBuild)
- **State Management**: Reactive Multi-Tenant Store Context (`src/lib/store.jsx`)
- **Styling**: Tailwind CSS + Custom Semantic Design Token Generator
- **Icons & Motion**: Lucide React + Framer Motion
- **3D & Canvas**: HTML5 Canvas with DPR Transform Guard + Three.js / R3F (Landing)
- **Smooth Scroll**: Lenis Scroll Engine
- **Accessibility & Contrast**: 100% WCAG AAA Compliant in both Day and Night modes

# 🏆 CampusLink AI — BPUT Hackathon 2026 (PS10)

> **Autonomous Multi-Portal Campus Placement Register & Semantic Engine**  
> *Domain: EdTech · AI Semantic Matching · Conflict-Free Scheduling · Multi-Tenant University Operations*  
> *Design Language: Physical Executive Register · Light Mode ("Editorial Vermilion & Warm Paper") & Dark Mode ("Obsidian Core & Solar Amber")*

---

## 🌟 Executive Summary

**CampusLink AI** digitizes, automates, and explains the full campus placement lifecycle across university directorates, students, and corporate hiring partners. Built to solve **Problem Statement 10 (PS10)**, the system replaces fragmented WhatsApp groups and manual spreadsheets with:
1. **Explainable AI Semantic Fit Scoring (0–100%)**: Multi-factor candidate-job compatibility matching based on verified skills, academic consistency, and mock interview performance.
2. **Conflict-Free Dynamic Interval Scheduling**: Automated temporal and venue collision prevention across concurrent recruitment drives.
3. **Reactive Multi-Tenant Store**: Real-time cross-portal data synchronization where recruiter actions (e.g. booking an interview slot) instantly update student timelines and admin rosters.
4. **Editorial Design System**: WCAG AAA-compliant high-craft editorial aesthetic with fluid responsiveness across mobile, tablet, and desktop.

---

## 🚀 Quick Start Guide

### 1. Installation & Local Development
```bash
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

Visit **`/login`** to select and enter any of the 3 portals. Demo credentials are pre-configured:

| Portal | Role ID | Username / Roll No | Password / Key | Initial Route |
| :--- | :--- | :--- | :--- | :--- |
| **Instant Demo** | `demo` | *(Instant 1-Click Access)* | *(None)* | `/student/overview` |
| **Student Portal** | `student` | `21CS3042` | `campuslink@2026` | `/student/overview` |
| **Placement Cell (Admin)** | `admin` | `Dr. Ananya Verma` | `CL-TPO-2026-X9` | `/admin/command-center` |
| **Corporate Recruiter** | `recruiter` | `Atlassian` | `recruiter#atlassian26` | `/recruiter/overview` |

---

## 🏛️ Application Architecture & Portals

### 1. Student Portal (`/student/*`)
- **Talent Overview (`/student/overview`)**: Readiness score dial needle, real-time skill gap adjusters, and live conversion analytics.
- **Placement Drives (`/student/drives`)**: Active corporate recruitment notices with 1-click semantic skill embedding evaluation.
- **Applications (`/student/applications`)**: Multi-stage application audit register and authenticated offer letter checklist.
- **Interview Schedule (`/student/interviews`)**: Synchronized personal timeline showing booked panel slots and venue directions.
- **Academic Profile (`/student/profile`)**: Certified CGPA transcripts, GitHub/LeetCode telemetry, and skills inventory.

### 2. Central Placement Directorate (Admin) (`/admin/*`)
- **Command Center (`/admin/command-center`)**: High-level university placement KPIs, department placement percentages, and active alerts.
- **Credential Verification (`/admin/verification`)**: Student transcript audit queue with 1-click **Verify** or **Reject & Request Revision**.
- **Placement Drives & Clash Resolver (`/admin/drives`)**: Multi-resource venue timeline. Automatically detects and resolves scheduling collisions across labs and lecture halls.
- **At-Risk Analytics (`/admin/at-risk`)**: ML classifier identifying unplaced candidates with dynamic mentor assignment popovers.
- **Offers Register (`/admin/offers`)**: University-wide offer acceptance, package distributions, and CTC audits.
- **Recruiter Engagement (`/admin/recruiters`)**: Historical partner conversion rates and average packages.

### 3. Corporate Recruiter Portal (`/recruiter/*`)
- **Talent Overview (`/recruiter/overview`)**: Cohort distributions, applicant skill coverage, and conversion funnel.
- **Candidate Pipeline (`/recruiter/pipeline`)**: Semantic skill-embedding rank board with explainable match scores and slot booking.
- **Interview Slots Matrix (`/recruiter/slots`)**: Conflict-free interactive 5-day panel grid to lock or release candidate interview windows.
- **Job Postings (`/recruiter/jobs`)**: Active requirements, cut-offs, and batch eligibility criteria.
- **Analytics (`/recruiter/analytics`)**: Department-wise conversion rates and hiring velocity.

---

## 🔌 Instructions for Backend Developers (API Integration Guide)

The frontend is completely modularized. All mock data and state mutations are centralized in **`src/lib/store.jsx`**.

To connect the application to a real backend (Node.js/Express, Spring Boot, Python FastAPI, or Django), follow the contract below.

### 1. Authentication Headers
All protected API calls should supply:
```http
Authorization: Bearer <jwt_access_token>
X-Tenant-Role: student | admin | recruiter
Content-Type: application/json
```

### 2. Core API Endpoints Specification

#### A. Authentication (`/api/auth`)
- `POST /api/auth/login`
  - **Body**: `{ role: "student" | "admin" | "recruiter", identifier: "...", password: "..." }`
  - **Response**: `{ token: "jwt_token", role: "...", user: { id: "s-1", name: "Zahid", ... } }`

#### B. Student Service (`/api/student`)
- `GET /api/student/me`
  - Returns student record, verified CGPA, skills array, and readiness index.
- `PUT /api/student/profile`
  - Submits revised technical skills and academic details for verification.

#### C. Drives & AI Matching Service (`/api/drives`)
- `GET /api/drives`
  - Returns authorized recruitment notices. Query params: `?stream=all|it|core&status=Verified`.
- `POST /api/drives/:driveId/apply`
  - Triggers candidate-job embedding cosine similarity computation and logs student application.
  - **Response**: `{ id: "app-101", driveId: "d-1", fitScore: 84, breakdown: [...] }`
- `POST /api/drives/resolve-conflict`
  - Admin endpoint to auto-mitigate venue/room collision (e.g. shifts Cognizant to Lab 2 at 14:00).

#### D. Credential Verification (`/api/verification`)
- `GET /api/verification/queue`
  - Returns pending student academic audit records.
- `POST /api/verification/:studentId/approve`
  - Locks student eligibility status as `Verified`.
- `POST /api/verification/:studentId/reject`
  - Dispatches revision notification to student.

#### E. Recruiter Pipeline & Slots (`/api/recruiter`)
- `GET /api/recruiter/pipeline`
  - Returns candidates ranked by AI compatibility score against job criteria.
- `GET /api/recruiter/slots`
  - Returns the 5-day panel slot matrix with occupancy flags (`locked: true/false`).
- `POST /api/recruiter/slots/book`
  - **Body**: `{ candidateId: "s-1", slotKey: "0-1", time: "11:30 - 12:30 PM", date: "2026-11-03" }`
  - Locks the interview slot and synchronizes the student's personal calendar.

### 3. How to Wire the Real APIs to Frontend
1. Create `src/api/client.js` with your base Axios/Fetch instance:
   ```javascript
   import axios from 'axios';
   export const api = axios.create({
     baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
   });
   api.interceptors.request.use((config) => {
     const token = sessionStorage.getItem('campuslink_jwt');
     if (token) config.headers.Authorization = `Bearer ${token}`;
     return config;
   });
   ```
2. In `src/lib/store.jsx`, replace the initial static state hooks (`useState(initialStudents)`) with `useEffect` data fetching queries from `api`.
3. The UI components (`AppShell`, `StudentOverview`, `RecruiterPipeline`, etc.) consume only `useStore()` hooks, requiring **zero changes to component markup**.

---

## 🌐 Deploying to Netlify (Direct from GitHub Dropdown)

This project is pre-configured with **`netlify.toml`** and **`public/_redirects`** to handle single-page application routing without 404 errors.

### Step-by-Step Netlify Deployment:
1. Log in to [Netlify](https://app.netlify.com/).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Select **GitHub** and authorize access.
4. From the repository dropdown, choose your **`BPUT2026`** (or CampusLink) repository.
5. In the **Branch to deploy** dropdown, select **`Demo7`** (or your target branch).
6. Netlify will auto-detect the build configuration from `netlify.toml`:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
7. Click **"Deploy site"**.
8. Within ~60 seconds, your multi-portal application is live with full route refresh support!

---

## 🛠️ Tech Stack & Dependencies

- **Framework**: React 18 + Vite 5
- **Styling**: Tailwind CSS + Custom CSS Variables Design Token Generator
- **Icons & Motion**: Lucide React + Framer Motion
- **3D WebGL (Landing)**: Three.js + @react-three/fiber + @react-three/drei
- **Smooth Scroll**: Lenis
- **Accessibility**: 100% WCAG AAA Compliant contrast certified

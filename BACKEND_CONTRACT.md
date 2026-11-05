# CampusLink AI — Backend Integration Contract & API Specification

This document defines the exact contract between the frontend React application and the future backend microservices.

All UI components interact exclusively through `src/api/index.js`. When the backend services are deployed, the backend team only needs to modify the functions in `src/api/index.js` to replace mock promises with real `fetch` or `axios` network calls. The component layer requires zero modifications.

---

## 1. Authentication & Tenant Context
Every request should include the standard Bearer token header:
```http
Authorization: Bearer <jwt_token>
X-College-ID: 220101045
X-Role: student | admin | recruiter
```

---

## 2. API Endpoints Specification

### 2.1 Student Service
#### `GET /api/student/me`
Returns the verified student readiness profile and academic record.
- **Response**:
```json
{
  "id": "s-1",
  "name": "Ananya Sharma",
  "rollNo": "220101045",
  "collegeId": "220101045",
  "branch": "Computer Science & Engineering",
  "shortBranch": "CSE",
  "cgpa": 8.80,
  "skills": ["React", "Node.js", "Python", "PostgreSQL", "Tailwind CSS"],
  "mockScore": 68,
  "backlogs": 0,
  "readinessScore": 72,
  "level": "Developing",
  "resumeScore": 88,
  "verified": true,
  "verificationStatus": "Verified"
}
```

#### `POST /api/student/profile/submit`
Submits revised student technical skills and uploaded transcript for placement cell audit.
- **Request Body**:
```json
{
  "skills": ["React", "Node.js", "Python", "PostgreSQL", "Docker", "AWS"],
  "transcriptPdfUrl": "ananya_sharma_transcript.pdf"
}
```
- **Response**:
```json
{
  "success": true,
  "status": "Pending Verification",
  "message": "Queued for Central Placement Cell audit"
}
```

---

### 2.2 Drives & Matching Engine
#### `GET /api/drives?stream=all|it|core`
Retrieves authorized campus placement drives.
- **Response**:
```json
[
  {
    "id": "d-1",
    "company": "Microsoft India",
    "role": "Software Development Engineer (SDE)",
    "stream": "IT / Software",
    "ctcString": "16.5 - 21.0 LPA",
    "deadline": "2026-10-18",
    "date": "2026-11-05",
    "slot": "10:00 - 13:00",
    "venue": "Auditorium Hall A",
    "branches": ["CSE", "IT", "ECE"],
    "minCgpa": 8.0,
    "status": "Verified",
    "skillsRequired": ["Data Structures", "System Design", "React", "Cloud Infrastructure"]
  }
]
```

#### `POST /api/drives/:id/apply`
Runs AI semantic match engine against candidate profile and records drive application.
- **Response**:
```json
{
  "id": "app-101",
  "driveId": "d-1",
  "fitScore": 72,
  "level": "Developing",
  "status": "Rejected",
  "explanation": "Below Threshold: CGPA meets eligibility, but candidate shows a gap in cloud infrastructure and mock interview performance.",
  "breakdown": [
    { "factor": "Skill & Tech-Stack Alignment", "weight": 40, "score": 62 },
    { "factor": "CGPA & Academic Consistency", "weight": 20, "score": 88 },
    { "factor": "Mock Technical Interview", "weight": 20, "score": 48 },
    { "factor": "Project Relevance & GitHub", "weight": 10, "score": 80 },
    { "factor": "Cloud Certifications", "weight": 10, "score": 55 }
  ],
  "remediationUrl": "https://notion.so/bput-remediation"
}
```

---

### 2.3 Central Placement Cell (Admin)
#### `GET /api/admin/verification-queue`
Returns all pending student grade/transcript verification tasks.
- **Response**:
```json
[
  {
    "id": "vq-1",
    "studentId": "s-1",
    "name": "Ananya Sharma",
    "rollNo": "220101045",
    "branch": "Computer Science & Engineering",
    "reportedCgpa": 8.80,
    "transcriptUrl": "bput_transcript_220101045.pdf",
    "submissionDate": "2026-10-18 14:22",
    "status": "Pending"
  }
]
```

#### `POST /api/admin/verification/:id/approve`
Approves and officially locks the student's verified profile.

#### `POST /api/admin/drives/:id/resolve`
Resolves venue / slot conflict using interval tree scheduling.
- **Request Body**:
```json
{
  "newSlot": "14:00 - 17:00",
  "newVenue": "Computing Lab 2"
}
```

#### `POST /api/admin/at-risk/:id/mentor`
Assigns faculty mentor to high-risk unplaced candidate.
- **Request Body**:
```json
{
  "mentorName": "Dr. R. Mishra (Dept of CSE)"
}
```

---

### 2.4 Recruiter Pipeline & Slot Booking
#### `GET /api/recruiter/pipeline?driveId=d-1`
Returns semantic candidate ranking sorted by `aiMatch` descending.

#### `POST /api/recruiter/slots`
Books conflict-free interview slot for candidate.
- **Request Body**:
```json
{
  "candidateId": "s-2",
  "slotTime": "10:00 - 10:45 AM",
  "slotDate": "2026-11-05"
}
```

---

### 2.5 Real-Time Notifications
#### `GET /api/notifications?role=student|admin|recruiter`
Returns real-time event dispatcher notifications.


import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialStudents } from '../data/students';
import { initialDrives } from '../data/drives';
import { initialApplications } from '../data/applications';
import { initialVerificationQueue } from '../data/verificationQueue';
import { initialAtRisk } from '../data/atRisk';
import { initialPipeline } from '../data/pipeline';
import { initialOffers } from '../data/offers';
import { initialNotifications } from '../data/notifications';
import { initialAnalytics } from '../data/analytics';

const StoreContext = createContext(null);

export const INITIAL_PANEL_SLOTS = {
  '0-0': { id: 'slot-1', studentId: 's-2', name: 'Rohan Senapati', role: 'SDE-1', fit: 94, roll: '220101002', date: '2026-11-02', time: '10:00 - 11:00 AM' },
  '0-1': { id: 'slot-2', studentId: 's-1', name: 'Zahid Khan', role: 'SDE-1', fit: 91, roll: '21CS3042', date: '2026-11-02', time: '11:30 - 12:30 PM' },
  '0-3': { id: 'slot-3', studentId: 's-3', name: 'Priyanka Tripathy', role: 'SDE-1', fit: 89, roll: '220101089', date: '2026-11-02', time: '03:30 - 04:30 PM' },
  '1-1': { id: 'slot-4', studentId: 's-10', name: 'Ritika Samal', role: 'SDE-1', fit: 87, roll: '220101123', date: '2026-11-03', time: '11:30 - 12:30 PM' },
  '2-4': { id: 'slot-5', studentId: 's-5', name: 'Sneha Patra', role: 'SDE-1', fit: 92, roll: '220101056', date: '2026-11-04', time: '03:30 - 04:30 PM' },
};

const getActiveRecruiterCompany = () => {
  try {
    const directCompany = sessionStorage.getItem('campuslink_recruiter_company');
    if (directCompany) return `${directCompany} India`;
    const storedName = sessionStorage.getItem('campuslink_user_name');
    if (storedName && storedName.includes('Recruiter')) {
      return `${storedName.replace(' Recruiter', '').trim()} India`;
    }
  } catch {}
  return 'Atlassian India';
};

export function StoreProvider({ children }) {
  const [students, setStudents] = useState(initialStudents);
  const [drives, setDrives] = useState(initialDrives);
  const [applications, setApplications] = useState(initialApplications);
  const [verificationQueue, setVerificationQueue] = useState(initialVerificationQueue);
  const [atRisk, setAtRisk] = useState(initialAtRisk);
  const [pipeline, setPipeline] = useState(initialPipeline);
  const [offers, setOffers] = useState(initialOffers);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [panelSlots, setPanelSlots] = useState(INITIAL_PANEL_SLOTS);
  const [recruiterScheduledCount, setRecruiterScheduledCount] = useState(12);

  const [hasToggledTheme, setHasToggledTheme] = useState(() => {
    try {
      return sessionStorage.getItem('cl-guide-theme') === '1';
    } catch {
      return false;
    }
  });

  const [hasScrolledPipeline, setHasScrolledPipeline] = useState(() => {
    try {
      return sessionStorage.getItem('cl-guide-pipeline') === '1';
    } catch {
      return false;
    }
  });

  const markThemeToggled = () => {
    setHasToggledTheme(true);
    try {
      sessionStorage.setItem('cl-guide-theme', '1');
    } catch {
      /* ignore */
    }
  };

  const markPipelineScrolled = () => {
    setHasScrolledPipeline(true);
    try {
      sessionStorage.setItem('cl-guide-pipeline', '1');
    } catch {
      /* ignore */
    }
  };

  // Student specific active profile (Zahid Khan - 21CS3042)
  const currentStudent = students.find((s) => s.id === 's-1') || students[0];

  // Up-coming interviews for current student
  const [studentInterviews, setStudentInterviews] = useState([
    {
      id: 'int-1',
      company: 'Atlassian India',
      role: 'Associate Software Engineer (SDE-1)',
      date: '2026-11-02',
      time: '11:30 - 12:30 PM',
      mode: 'Virtual (Corporate Panel)',
      panel: 'Panel 1 - Technical & System Architecture',
      status: 'Confirmed',
    },
    {
      id: 'int-2',
      company: 'TCS Digital',
      role: 'Prime Software Developer',
      date: '2026-11-08',
      time: '14:30 - 15:30',
      mode: 'Virtual (Microsoft Teams)',
      panel: 'Panel 3 - Enterprise Data Systems',
      status: 'Confirmed',
    },
    {
      id: 'int-3',
      company: 'Cognizant Technology',
      role: 'GenC Next / Elevate Developer',
      date: '2026-11-14',
      time: '11:00 - 11:45',
      mode: 'On-Campus (Computing Lab 2)',
      panel: 'Panel 1 - Full Stack Assessment',
      status: 'Tentative',
    },
  ]);

  // Actions

  // 1. Student submits profile for verification
  const submitProfile = (updatedSkills, resumeFileName) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === currentStudent.id
          ? {
              ...s,
              skills: updatedSkills,
              verificationStatus: 'Pending Verification',
              verified: false,
              resumeScore: 89,
            }
          : s
      )
    );

    // Add to verification queue for admin
    const newQueueItem = {
      id: `vq-${Date.now()}`,
      studentId: currentStudent.id,
      name: currentStudent.name,
      rollNo: currentStudent.rollNo,
      branch: currentStudent.branch,
      reportedCgpa: currentStudent.cgpa,
      transcriptUrl: resumeFileName || 'ananya_sharma_transcript.pdf',
      submissionDate: 'Just now',
      status: 'Pending',
    };

    setVerificationQueue((prev) => [newQueueItem, ...prev.filter((q) => q.studentId !== currentStudent.id)]);

    // Notify admin
    addNotification('admin', {
      title: 'New Student Profile Submission',
      message: `${currentStudent.name} (${currentStudent.shortBranch}) submitted updated technical profile & transcript.`,
      category: 'Deadlines',
    });
  };

  // 2. Student applies to drive
  const applyToDrive = (driveId) => {
    const drive = drives.find((d) => d.id === driveId);
    if (!drive) return null;

    // Check if already applied
    const existing = applications.find((a) => a.driveId === driveId);
    if (existing) return existing;

    // Simulate AI match calculation
    const isHighFit = drive.company.includes('TCS') || drive.company.includes('Cognizant');
    const fitScore = isHighFit ? 88 : drive.company.includes('Microsoft') ? 72 : 82;
    const level = fitScore >= 90 ? 'Highly Employable' : fitScore >= 80 ? 'Ready' : 'Developing';
    const status = fitScore >= 75 ? 'Shortlisted' : 'Rejected';

    const newApp = {
      id: `app-${Date.now()}`,
      driveId: drive.id,
      company: drive.company,
      role: drive.role,
      ctc: drive.ctcString,
      appliedDate: 'Today',
      status,
      fitScore,
      level,
      explanation: isHighFit
        ? `High Fit: Verified academic CGPA of ${currentStudent.cgpa} aligns with recruiter's tier-1 pool. Strong skill match across core requirements.`
        : `Below Threshold: The student's CGPA meets the eligibility criteria, but the required skill set shows a gap in specialized systems and mock benchmark is below 85.`,
      breakdown: [
        { factor: 'Skill & Tech-Stack Alignment', weight: 40, score: fitScore >= 80 ? 84 : 62 },
        { factor: 'CGPA & Academic Consistency', weight: 20, score: 88 },
        { factor: 'Mock Technical Interview', weight: 20, score: fitScore >= 80 ? 82 : 48 },
        { factor: 'Project Relevance & GitHub', weight: 10, score: 80 },
        { factor: 'Certifications', weight: 10, score: 65 },
      ],
      remediationUrl: status === 'Rejected' ? 'https://notion.so/bput-remediation' : undefined,
    };

    setApplications((prev) => [newApp, ...prev]);

    // Also update recruiter candidate pipeline!
    setPipeline((prev) => [
      {
        id: `pipe-${Date.now()}`,
        studentId: currentStudent.id,
        name: currentStudent.name,
        rollNo: currentStudent.rollNo,
        branch: currentStudent.branch,
        shortBranch: currentStudent.shortBranch,
        cgpa: currentStudent.cgpa,
        aiMatch: fitScore,
        pipelineStatus: status === 'Shortlisted' ? 'Technical Review' : 'Screening Completed',
        verifiedSkills: currentStudent.skills,
        interviewSlot: null,
        explanation: newApp.explanation,
        resumeUrl: 'ananya_sharma_resume.pdf',
        experienceYears: 'Academic Projects & Internships',
        projectsCount: 3,
      },
      ...prev,
    ]);

    // Add recruiter notification
    addNotification('recruiter', {
      title: 'New Candidate Applied',
      message: `${currentStudent.name} (${currentStudent.shortBranch}, CGPA ${currentStudent.cgpa}) applied for ${drive.role}. AI Match: ${fitScore}%.`,
      category: 'Shortlisting',
    });

    return newApp;
  };

  // 3. Admin approves student verification
  const approveStudent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, verified: true, verificationStatus: 'Verified' }
          : s
      )
    );

    setVerificationQueue((prev) => prev.filter((q) => q.studentId !== studentId));

    // Notify student
    addNotification('student', {
      title: 'Profile Officially Verified',
      message: 'Placement cell has approved your verified academic records, CGPA, and resume credentials.',
      category: 'Deadlines',
    });
  };

  // 4. Admin rejects student verification
  const rejectStudent = (studentId) => {
    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, verified: false, verificationStatus: 'Needs Revision' }
          : s
      )
    );

    setVerificationQueue((prev) => prev.filter((q) => q.studentId !== studentId));

    addNotification('student', {
      title: 'Profile Revision Requested',
      message: 'Placement cell requested a re-upload of your Semester VI authenticated grade sheet.',
      category: 'Deadlines',
    });
  };

  // 5. Admin resolves drive scheduling conflict
  const resolveDriveConflict = (driveId) => {
    setDrives((prev) =>
      prev.map((d) =>
        d.id === driveId
          ? {
              ...d,
              status: 'Verified',
              conflictDetails: null,
              slot: '14:00 - 17:00',
              venue: 'Computing Lab 2 (Rescheduled)',
            }
          : d
      )
    );

    addNotification('student', {
      title: 'Drive Conflict Resolved',
      message: 'Cognizant Technology drive rescheduled to conflict-free slot: Nov 02, 14:00 - 17:00 in Lab 2.',
      category: 'Drives',
    });

    addNotification('admin', {
      title: 'Conflict Successfully Mitigated',
      message: 'Cognizant Technology moved to Computing Lab 2. Zero venue or student overlap detected.',
      category: 'Drives',
    });
  };

  // 6. Admin assigns mentor to at-risk student
  const assignMentor = (riskId, mentorName) => {
    setAtRisk((prev) =>
      prev.map((item) =>
        item.id === riskId ? { ...item, assignedMentor: mentorName } : item
      )
    );

    addNotification('admin', {
      title: 'Academic Mentor Assigned',
      message: `${mentorName} has been assigned for personalized career guidance.`,
      category: 'Shortlisting',
    });
  };

  // 7. Recruiter schedules interview slot from Candidate Pipeline
  const scheduleInterviewSlot = (candidateId, slotTime, slotDate = '2026-11-05', customCompany) => {
    const candidate = pipeline.find((p) => p.id === candidateId || p.studentId === candidateId);
    const candidateName = candidate ? candidate.name : 'Candidate';
    const company = customCompany || getActiveRecruiterCompany();

    setPipeline((prev) =>
      prev.map((p) =>
        p.id === candidateId || p.studentId === candidateId
          ? { ...p, interviewSlot: `${slotDate} ${slotTime}`, pipelineStatus: 'Shortlisted for R2' }
          : p
      )
    );

    setRecruiterScheduledCount((prev) => prev + 1);

    // If scheduled for current student (Zahid Khan / s-1)
    if (candidate && (candidate.studentId === currentStudent.id || candidate.id === currentStudent.id)) {
      setStudentInterviews((prev) => [
        {
          id: `int-${Date.now()}`,
          company: company,
          role: 'Software Development Engineer (SDE)',
          date: slotDate,
          time: slotTime,
          mode: 'Virtual (Corporate Panel)',
          panel: 'Panel 1 - Core Systems & Cloud',
          status: 'Confirmed',
        },
        ...prev,
      ]);
    }

    // Mirror to an available cell in panelSlots so Interview Slots Grid updates in real-time
    setPanelSlots((prev) => {
      const allKeys = [];
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 5; c++) {
          allKeys.push(`${r}-${c}`);
        }
      }
      const freeKey = allKeys.find((k) => !prev[k]);
      if (freeKey) {
        return {
          ...prev,
          [freeKey]: {
            id: `slot-${Date.now()}`,
            studentId: candidate?.studentId || candidateId,
            name: candidateName,
            role: 'SDE-1',
            fit: candidate?.aiMatch || 90,
            roll: candidate?.rollNo || '21CS3042',
            date: slotDate,
            time: slotTime,
          },
        };
      }
      return prev;
    });

    addNotification('student', {
      title: 'Interview Slot Booked',
      message: `${company} has scheduled your technical interview for ${slotDate} at ${slotTime}.`,
      category: 'Shortlisting',
    });

    addNotification('recruiter', {
      title: 'Slot Confirmed with Candidate',
      message: `Interview locked for ${candidateName} on ${slotDate} at ${slotTime}.`,
      category: 'Drives',
    });

    addNotification('admin', {
      title: 'Corporate Slot Locked',
      message: `${company} scheduled technical interview with ${candidateName} (${slotDate} ${slotTime}).`,
      category: 'Drives',
    });
  };

  // 8. Recruiter locks a cell in Interview Slots Matrix (RecruiterSlots.jsx)
  const bookPanelSlot = (slotKey, candidate, dayLabel, timeLabel) => {
    const company = getActiveRecruiterCompany();
    const candidateName = candidate?.name || 'Candidate';
    const candidateId = candidate?.studentId || candidate?.id;

    setPanelSlots((prev) => ({
      ...prev,
      [slotKey]: {
        ...candidate,
        date: dayLabel,
        time: timeLabel,
      },
    }));

    setRecruiterScheduledCount((prev) => prev + 1);

    // If candidate exists in pipeline, update status
    if (candidateId) {
      setPipeline((prev) =>
        prev.map((p) =>
          p.studentId === candidateId || p.id === candidateId
            ? { ...p, interviewSlot: `${dayLabel} ${timeLabel}`, pipelineStatus: 'Shortlisted for R2' }
            : p
        )
      );
    }

    // If scheduled for current student (Zahid Khan / s-1), add directly to their timeline
    if (candidateId === currentStudent.id || candidateName === currentStudent.name) {
      setStudentInterviews((prev) => [
        {
          id: `int-${Date.now()}`,
          company: company,
          role: candidate?.role || 'Software Development Engineer (SDE-1)',
          date: dayLabel,
          time: timeLabel,
          mode: 'Virtual (Corporate Panel)',
          panel: 'Panel 1 - Technical Assessment',
          status: 'Confirmed',
        },
        ...prev,
      ]);
    }

    addNotification('student', {
      title: 'Interview Slot Booked',
      message: `${company} has scheduled your technical interview for ${dayLabel} (${timeLabel}).`,
      category: 'Shortlisting',
    });

    addNotification('recruiter', {
      title: 'Slot Confirmed with Candidate',
      message: `Interview locked for ${candidateName} on ${dayLabel} (${timeLabel}).`,
      category: 'Drives',
    });

    addNotification('admin', {
      title: 'Corporate Slot Locked',
      message: `${company} scheduled interview with ${candidateName} on ${dayLabel}.`,
      category: 'Drives',
    });
  };

  // 9. Recruiter releases a cell in Interview Slots Matrix
  const releasePanelSlot = (slotKey) => {
    const existing = panelSlots[slotKey];
    if (!existing) return;
    const company = getActiveRecruiterCompany();

    setPanelSlots((prev) => {
      const next = { ...prev };
      delete next[slotKey];
      return next;
    });

    setRecruiterScheduledCount((prev) => Math.max(0, prev - 1));

    // If candidate was current student, remove from their timeline
    if (existing.studentId === currentStudent.id || existing.name === currentStudent.name) {
      setStudentInterviews((prev) =>
        prev.filter((int) => !(int.date === existing.date && int.time === existing.time))
      );
    }

    addNotification('recruiter', {
      title: 'Slot Released',
      message: `Interview slot on ${existing.date || 'calendar'} released for ${existing.name}.`,
      category: 'Drives',
    });
  };

  // 8. Admin sends offer document reminder
  const sendOfferReminder = (offerId) => {
    setOffers((prev) =>
      prev.map((o) => (o.id === offerId ? { ...o, reminderSent: true } : o))
    );

    addNotification('student', {
      title: 'Document Submission Reminder',
      message: 'Placement cell reminds you to upload pending medical fitness certificate before due date.',
      category: 'Offers',
    });
  };

  // Notification utilities
  const addNotification = (role, notif) => {
    const newNotif = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      time: 'Just now',
      read: false,
      ...notif,
    };

    setNotifications((prev) => ({
      ...prev,
      [role]: [newNotif, ...(prev[role] || [])],
    }));
  };

  const markNotificationRead = (role, notifId) => {
    setNotifications((prev) => ({
      ...prev,
      [role]: prev[role].map((n) => (n.id === notifId ? { ...n, read: true } : n)),
    }));
  };

  const markAllNotificationsRead = (role) => {
    setNotifications((prev) => ({
      ...prev,
      [role]: prev[role].map((n) => ({ ...n, read: true })),
    }));
  };

  return (
    <StoreContext.Provider
      value={{
        students,
        currentStudent,
        drives,
        applications,
        verificationQueue,
        atRisk,
        pipeline,
        offers,
        notifications,
        analytics,
        panelSlots,
        recruiterScheduledCount,
        studentInterviews,
        hasToggledTheme,
        hasScrolledPipeline,
        markThemeToggled,
        markPipelineScrolled,
        submitProfile,
        applyToDrive,
        approveStudent,
        rejectStudent,
        resolveDriveConflict,
        assignMentor,
        scheduleInterviewSlot,
        bookPanelSlot,
        releasePanelSlot,
        sendOfferReminder,
        markNotificationRead,
        markAllNotificationsRead,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}

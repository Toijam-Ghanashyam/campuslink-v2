'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const SEEDED_DRIVES = [
  {
    id: 'd-msft',
    company: 'Microsoft India',
    company_name: 'Microsoft India',
    role: 'Software Development Engineer (Cloud & AI)',
    role_title: 'Software Development Engineer (Cloud & AI)',
    stream: 'IT / Software',
    skillsRequired: ['Data Structures & Algorithms', 'C++', 'Python', 'Distributed Systems', 'Azure'],
    required_skills: ['Data Structures & Algorithms', 'C++', 'Python', 'Distributed Systems', 'Azure'],
    ctcString: '₹44.0 LPA',
    min_ctc: 44,
    max_ctc: 52,
    date: 'Nov 18, 2026',
    venue: 'Auditorium Hall A / Teams',
    minCgpa: 8.0,
    status: 'Open',
    tier: 'TIER_1',
  },
  {
    id: 'd-infy',
    company: 'Infosys Limited',
    company_name: 'Infosys Limited',
    role: 'Specialist Programmer (SP)',
    role_title: 'Specialist Programmer (SP)',
    stream: 'IT / Software',
    skillsRequired: ['Java', 'Spring Boot', 'Data Structures', 'SQL', 'React'],
    required_skills: ['Java', 'Spring Boot', 'Data Structures', 'SQL', 'React'],
    ctcString: '₹9.5 LPA',
    min_ctc: 9.5,
    max_ctc: 11.5,
    date: 'Nov 22, 2026',
    venue: 'Virtual Online Assessment',
    minCgpa: 7.0,
    status: 'Open',
    tier: 'TIER_2',
  },
  {
    id: 'd-cog',
    company: 'Cognizant Technology',
    company_name: 'Cognizant Technology',
    role: 'Digital Specialist Engineer (GenC Next)',
    role_title: 'Digital Specialist Engineer (GenC Next)',
    stream: 'IT / Software',
    skillsRequired: ['Python', 'SQL', 'Cloud Fundamentals', 'Data Structures', 'REST APIs'],
    required_skills: ['Python', 'SQL', 'Cloud Fundamentals', 'Data Structures', 'REST APIs'],
    ctcString: '₹6.75 LPA',
    min_ctc: 6.75,
    max_ctc: 8.5,
    date: 'Nov 25, 2026',
    venue: 'Campus Lab 3',
    minCgpa: 6.5,
    status: 'Open',
    tier: 'TIER_3',
  },
  {
    id: 'd-tcs',
    company: 'TCS Digital',
    company_name: 'TCS Digital',
    role: 'System Engineer (Digital Innovations)',
    role_title: 'System Engineer (Digital Innovations)',
    stream: 'IT / Software',
    skillsRequired: ['Algorithms', 'Java', 'Python', 'Web Development', 'SQL'],
    required_skills: ['Algorithms', 'Java', 'Python', 'Web Development', 'SQL'],
    ctcString: '₹7.6 LPA',
    min_ctc: 7.6,
    max_ctc: 9.0,
    date: 'Nov 28, 2026',
    venue: 'TCS iON Hub',
    minCgpa: 7.0,
    status: 'Open',
    tier: 'TIER_2',
  },
  {
    id: 'd-atlassian',
    company: 'Atlassian India',
    company_name: 'Atlassian India',
    role: 'Software Engineer - Distributed Systems',
    role_title: 'Software Engineer - Distributed Systems',
    stream: 'IT / Software',
    skillsRequired: ['React', 'TypeScript', 'Java', 'Distributed Systems', 'System Design'],
    required_skills: ['React', 'TypeScript', 'Java', 'Distributed Systems', 'System Design'],
    ctcString: '₹55.0 LPA',
    min_ctc: 55,
    max_ctc: 72,
    date: 'Dec 02, 2026',
    venue: 'Atlassian Bengaluru R&D',
    minCgpa: 8.5,
    status: 'Open',
    tier: 'TIER_1',
  },
];

const SEEDED_INTERVIEWS = [
  {
    id: 'int-1',
    driveId: 'd-msft',
    company: 'Microsoft India',
    company_name: 'Microsoft India',
    role: 'Software Development Engineer (Cloud & AI)',
    role_title: 'Software Development Engineer (Cloud & AI)',
    date: 'Nov 20, 2026',
    time: '10:30 AM IST',
    mode: 'Online (Microsoft Teams)',
    status: 'Confirmed',
    panel: 'Panel A (Azure Distributed Systems & Core Services)',
  },
  {
    id: 'int-2',
    driveId: 'd-infy',
    company: 'Infosys Limited',
    company_name: 'Infosys Limited',
    role: 'Specialist Programmer (SP)',
    role_title: 'Specialist Programmer (SP)',
    date: 'Nov 24, 2026',
    time: '02:00 PM IST',
    mode: 'Online Video Assessment',
    status: 'Confirmed',
    panel: 'Panel 3 (Cloud Enterprise Modernization)',
  },
];

const SEEDED_STUDENTS = [
  {
    id: 'demo-student-id',
    name: 'Ananya Sharma',
    full_name: 'Ananya Sharma',
    roll_number: 'TU-2023-CS089',
    rollNumber: 'TU-2023-CS089',
    branch: 'Computer Science & Engineering',
    verified_cgpa: 8.94,
    cgpa: 8.94,
    mockScore: 78,
    readinessScore: 82,
    level: 'Ready',
    status: 'Ready',
  },
  {
    id: 'b05ca1bd-0a61-430f-a398-57fddab0f3f2',
    name: 'Meera Kulkarni',
    full_name: 'Meera Kulkarni',
    roll_number: 'TU-2024-CS045',
    rollNumber: 'TU-2024-CS045',
    branch: 'Computer Science & Engineering',
    verified_cgpa: 9.18,
    cgpa: 9.18,
    mockScore: 75,
    readinessScore: 70,
    level: 'Review',
    status: 'Review',
  },
  {
    id: 's-rohan',
    name: 'Rohan Verma',
    full_name: 'Rohan Verma',
    roll_number: 'TU-2023-EC219',
    rollNumber: 'TU-2023-EC219',
    branch: 'Electronics & Communication',
    verified_cgpa: 7.62,
    cgpa: 7.62,
    mockScore: 70,
    readinessScore: 68,
    level: 'Review',
    status: 'Review',
  },
];

const SEEDED_PIPELINE = [
  {
    id: 'pipe-1',
    studentId: 'demo-student-id',
    studentName: 'Ananya Sharma',
    rollNumber: 'TU-2023-CS089',
    branch: 'Computer Science & Engineering',
    cgpa: 8.94,
    company: 'Infosys Limited',
    role: 'Data Analyst',
    driveId: '49d09d96-6803-4c5c-a6e0-5b602b1d472a',
    aiMatch: 85,
    pipelineStatus: 'Interview Round 1',
    appliedAt: '2026-11-12T10:00:00Z',
  },
  {
    id: 'pipe-2',
    studentId: 'b05ca1bd-0a61-430f-a398-57fddab0f3f2',
    studentName: 'Meera Kulkarni',
    rollNumber: 'TU-2024-CS045',
    branch: 'Computer Science & Engineering',
    cgpa: 9.18,
    company: 'Infosys Limited',
    role: 'Data Analyst',
    driveId: '49d09d96-6803-4c5c-a6e0-5b602b1d472a',
    aiMatch: 54,
    pipelineStatus: 'Applied',
    appliedAt: '2026-11-12T22:30:00Z',
  },
  {
    id: 'pipe-3',
    studentId: 's-rohan',
    studentName: 'Rohan Verma',
    rollNumber: 'TU-2023-EC219',
    branch: 'Electronics & Communication',
    cgpa: 7.62,
    company: 'TCS / Infosys',
    role: 'Systems Engineer',
    driveId: 'cba6a5ca-50d9-4384-8eea-06f7cfcb8304',
    aiMatch: 50,
    pipelineStatus: 'Offered',
    appliedAt: '2026-11-11T14:20:00Z',
  },
];

const SEEDED_SESSIONS = {
  'demo-student-id': {
    studentId: 'demo-student-id',
    fullSessionVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    totalDurationSec: 180,
    integrityScore: 82,
    questionClips: [
      { questionNumber: 1, questionId: 1, category: 'Introduction', prompt: 'Walk us through your technical background and the most complex system you have built at BPUT.', startedAtSessionSec: 8, durationSec: 18 },
      { questionNumber: 2, questionId: 2, category: 'Data Structures', prompt: 'How would you design an LRU Cache with O(1) read and write operations? Explain the underlying data structures.', startedAtSessionSec: 32, durationSec: 16 },
      { questionNumber: 3, questionId: 3, category: 'Frontend Architecture', prompt: 'Explain how React reconciliation and virtual DOM diffing optimize rendering performance in data-heavy dashboards.', startedAtSessionSec: 54, durationSec: 18 },
      { questionNumber: 4, questionId: 4, category: 'Database Systems', prompt: 'When would you choose PostgreSQL composite indexing over a hash index, and how do you diagnose a slow query?', startedAtSessionSec: 78, durationSec: 17 },
      { questionNumber: 5, questionId: 5, category: 'System Design', prompt: 'Design a real-time conflict-free interview slot booking service handling 1,500 concurrent student requests.', startedAtSessionSec: 102, durationSec: 20 },
    ],
    proctoringEvents: [
      { id: 'evt-1', timestampSec: 28, type: 'HEAD_TURNED_AWAY', status: 'warning', reason: 'Head yaw turned > 72% away from display' },
      { id: 'evt-2', timestampSec: 72, type: 'EYE_GAZE_OFF_SCREEN', status: 'warning', reason: 'Blendshape eye gaze reading off-screen' },
      { id: 'evt-3', timestampSec: 96, type: 'MULTIPLE_FACES_DETECTED', status: 'violation', reason: 'Second individual detected in camera frame' },
      { id: 'evt-4', timestampSec: 124, type: 'TAB_SWITCH_OR_FOCUS_LOSS', status: 'violation', reason: 'Browser visibilitychange tab switch event' },
    ],
    completedAt: '2026-11-13T04:30:00Z',
  },
};

const StoreContext = createContext(null);

export function StoreProvider({ children, initialStudent = null, initialDrives = null, initialApps = null }) {
  const [currentStudent, setCurrentStudent] = useState(initialStudent || {
    id: 'demo-student-id',
    name: 'Ananya Sharma',
    full_name: 'Ananya Sharma',
    email: 'ananya.sharma@techuniv.edu.in',
    skills: [
      'React',
      'JavaScript',
      'TypeScript',
      'Python',
      'SQL',
      'Data Structures & Algorithms',
      'Git',
      'REST APIs',
    ],
    verified_cgpa: 8.94,
    active_backlogs: 0,
    is_locked: true,
    mockScore: 78,
    readinessScore: 82,
  });

  const [drives, setDrives] = useState(initialDrives || SEEDED_DRIVES);
  const [applications, setApplications] = useState(initialApps || [
    {
      id: 'app-seed-1',
      driveId: 'd-infy',
      drive_id: 'd-infy',
      status: 'Shortlisted',
      stage: 'INTERVIEW',
      fitScore: 92,
      appliedAt: '2026-11-10T10:00:00Z',
    },
  ]);
  const [studentInterviews, setStudentInterviews] = useState(SEEDED_INTERVIEWS);
  const [activeResearchDrive, setActiveResearchDrive] = useState(null);

  // AI Interview Sessions & Recruiter Pipeline State
  const [aiInterviewSessions, setAiInterviewSessions] = useState(SEEDED_SESSIONS);
  const [students, setStudents] = useState(SEEDED_STUDENTS);
  const [pipeline, setPipeline] = useState(SEEDED_PIPELINE);
  const [notifications, setNotifications] = useState({
    student: [],
    recruiter: [],
  });

  // Sync with localStorage if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('campuslink_current_student');
      if (stored) {
        setCurrentStudent((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
      const storedSessions = localStorage.getItem('campuslink_ai_interview_sessions');
      if (storedSessions) {
        setAiInterviewSessions(JSON.parse(storedSessions));
      }
    } catch (e) {}
  }, []);

  const addNotification = (role, notif) => {
    setNotifications((prev) => ({
      ...prev,
      [role]: [
        { id: `notif-${Date.now()}`, timestamp: new Date().toISOString(), ...notif },
        ...(prev[role] || []),
      ],
    }));
  };

  const saveAiInterviewResult = (payload) => {
    setAiInterviewSessions((prev) => {
      const next = {
        ...prev,
        [payload.studentId]: payload,
      };
      try {
        if (typeof window !== 'undefined') {
          // Store minimal metadata in localStorage (exclude huge blob urls if needed)
          localStorage.setItem('campuslink_ai_interview_sessions', JSON.stringify(next));
        }
      } catch (err) {}
      return next;
    });

    setStudents((prev) =>
      prev.map((s) =>
        s.id === payload.studentId
          ? { ...s, mockScore: 88, readinessScore: Math.max(s.readinessScore || 0, 86), level: 'Ready' }
          : s
      )
    );

    setCurrentStudent((prev) =>
      prev && prev.id === payload.studentId
        ? {
            ...prev,
            mockScore: 88,
            readiness_score: Math.max(prev.readiness_score || 0, 86),
            readinessScore: Math.max(prev.readinessScore || 0, 86),
            readiness_status: 'HIGHLY_READY',
            aiInterviewCompleted: true,
          }
        : prev
    );

    setPipeline((prev) =>
      prev.map((p) =>
        p.studentId === payload.studentId
          ? { ...p, aiMatch: Math.max(p.aiMatch || 0, 88), pipelineStatus: 'Shortlisted for R2' }
          : p
      )
    );

    const studentName = currentStudent?.name || currentStudent?.full_name || 'Candidate';
    addNotification('recruiter', {
      title: 'AI Video Interview Submitted',
      message: `${studentName} completed the 5-question AI video round (Full recording + 5 answer clips available).`,
      category: 'Shortlisting',
    });
  };

  const applyToDrive = (driveId) => {
    const existing = applications.find((a) => a.driveId === driveId || a.drive_id === driveId);
    if (existing) return existing;
    const newApp = {
      id: `app-${Date.now()}`,
      driveId,
      drive_id: driveId,
      status: 'Applied',
      stage: 'UNDER_REVIEW',
      fitScore: 89,
      appliedAt: new Date().toISOString(),
    };
    setApplications((prev) => [...prev, newApp]);
    return newApp;
  };

  const openCompanyResearch = (drive) => setActiveResearchDrive(drive);
  const closeCompanyResearch = () => setActiveResearchDrive(null);

  const value = {
    currentStudent,
    setCurrentStudent,
    drives,
    setDrives,
    applications,
    setApplications,
    studentInterviews,
    setStudentInterviews,
    activeResearchDrive,
    setActiveResearchDrive,
    openCompanyResearch,
    closeCompanyResearch,
    applyToDrive,
    aiInterviewSessions,
    setAiInterviewSessions,
    saveAiInterviewResult,
    students,
    setStudents,
    pipeline,
    setPipeline,
    notifications,
    addNotification,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    // Return sensible fallback state if accessed outside Provider
    return {
      currentStudent: {
        id: 'demo-student-id',
        name: 'Student',
        full_name: 'Student',
        skills: [
          'Python',
          'Data Structures & Algorithms',
          'SQL',
          'React',
          'JavaScript',
          'Git',
          'REST APIs',
        ],
        verified_cgpa: 8.5,
        active_backlogs: 0,
        is_locked: true,
        mockScore: 78,
        readinessScore: 82,
      },
      setCurrentStudent: () => {},
      drives: SEEDED_DRIVES,
      setDrives: () => {},
      applications: [],
      setApplications: () => {},
      studentInterviews: SEEDED_INTERVIEWS,
      setStudentInterviews: () => {},
      activeResearchDrive: null,
      setActiveResearchDrive: () => {},
      openCompanyResearch: () => {},
      closeCompanyResearch: () => {},
      applyToDrive: (driveId) => ({
        id: `app-${Date.now()}`,
        driveId,
        status: 'Applied',
        fitScore: 88,
      }),
      aiInterviewSessions: {},
      setAiInterviewSessions: () => {},
      saveAiInterviewResult: () => {},
      students: SEEDED_STUDENTS,
      setStudents: () => {},
      pipeline: SEEDED_PIPELINE,
      setPipeline: () => {},
      notifications: { student: [], recruiter: [] },
      addNotification: () => {},
    };
  }
  return context;
}

export default {
  StoreProvider,
  useStore,
};

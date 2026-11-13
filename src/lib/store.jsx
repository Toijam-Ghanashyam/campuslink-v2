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
    id: 's-zahid',
    name: 'Zahid Khan',
    full_name: 'Zahid Khan',
    roll_number: 'TU-2023-CS104',
    rollNumber: 'TU-2023-CS104',
    branch: 'Computer Science & Engineering',
    verified_cgpa: 8.75,
    cgpa: 8.75,
    skills: ['React', 'Node.js', 'PostgreSQL', 'Redis', 'Docker'],
    mockScore: 84,
    readinessScore: 88,
    level: 'Ready',
    status: 'Ready',
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
    totalDurationSec: 240,
    integrityScore: 82,
    questionClips: [
      {
        questionNumber: 1,
        questionId: 1,
        category: 'Introduction & Architecture',
        prompt: 'Walk us through your technical background and the most complex system you have built at BPUT.',
        startedAtSessionSec: 8,
        durationSec: 18,
        transcript: 'I have been developing full-stack applications with React, Node.js, and PostgreSQL at BPUT. My most complex project was an automated placement engine and concurrent slot dispatch system. I designed the architecture using optimistic concurrency locking to prevent double-booking across 1,500 students, and integrated real-time WebSocket feeds for live panel dispatch.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 2,
        questionId: 2,
        category: 'Data Structures',
        prompt: 'How would you design an LRU Cache with O(1) read and write operations? Explain the underlying data structures.',
        startedAtSessionSec: 30,
        durationSec: 16,
        transcript: 'To achieve O(1) time complexity for both read and write operations in an LRU Cache, I pair a doubly linked list with a hash map. The hash map stores key-node pointers for O(1) lookups. When an item is accessed or updated, it is unlinked and moved to the head of the doubly linked list in O(1). When capacity is exceeded, the least recently used node is evicted from the tail in O(1) and deleted from the hash map.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 3,
        questionId: 3,
        category: 'Frontend Architecture',
        prompt: 'Explain how React reconciliation and virtual DOM diffing optimize rendering performance in data-heavy dashboards.',
        startedAtSessionSec: 50,
        durationSec: 18,
        transcript: 'React reconciliation optimizes rendering by maintaining an in-memory Virtual DOM tree. During state mutations, React performs a heuristic O(n) diffing algorithm comparing the new fiber tree against the previous one. By checking stable keys and component types, it calculates the minimal mutation set and batches DOM updates into a single commit phase, avoiding expensive browser layout recalibrations and repaints.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 4,
        questionId: 4,
        category: 'Database Systems',
        prompt: 'When would you choose PostgreSQL composite indexing over a hash index, and how do you diagnose a slow query?',
        startedAtSessionSec: 72,
        durationSec: 17,
        transcript: 'A composite B-Tree index is ideal when queries filter or sort across multiple columns following the leftmost prefix rule, or when performing range scans. Hash indices only support equality checks and cannot optimize range queries or sorting. To diagnose a slow query, I inspect the execution plan using EXPLAIN ANALYZE, looking for sequential scans, high disk page fetches, and discrepancies between estimated and actual row counts.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 5,
        questionId: 5,
        category: 'System Design',
        prompt: 'Design a real-time conflict-free interview slot booking service handling 1,500 concurrent student requests.',
        startedAtSessionSec: 94,
        durationSec: 20,
        transcript: 'For 1,500 concurrent requests, I would implement an event-driven architecture with Redis for distributed atomic locking via Lua scripts or Redlock. When a student attempts to book a slot, Redis checks availability and holds a 5-minute reservation TTL atomically. Once confirmed, an event is emitted to Apache Kafka or RabbitMQ, and a background worker persists the booking to PostgreSQL with a unique constraint on interviewer and timeslot to guarantee zero double-bookings.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 6,
        questionId: 6,
        category: 'API Security',
        prompt: 'Compare stateless JWT authentication with session-based cookies. How do you mitigate token replay attacks?',
        startedAtSessionSec: 118,
        durationSec: 16,
        transcript: 'Stateless JWTs eliminate server-side session lookups by embedding cryptographic signatures, but revocation is challenging. Session cookies allow immediate revocation via Redis or database session stores. To prevent token replay attacks with JWTs, I issue short-lived access tokens of 15 minutes paired with rotating single-use refresh tokens stored in secure, HttpOnly, SameSite cookies with jti replay blacklists.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 7,
        questionId: 7,
        category: 'Concurrency & Runtimes',
        prompt: 'How does the Node.js event loop handle CPU-bound tasks vs. asynchronous I/O operations?',
        startedAtSessionSec: 138,
        durationSec: 15,
        transcript: 'Node.js delegates asynchronous I/O operations to libuv thread pools or kernel non-blocking interfaces (epoll/kqueue) without blocking the main V8 execution thread. For CPU-bound tasks like cryptography, compression, or machine learning, the single event loop thread gets starved. I offload heavy CPU work to Worker Threads via the worker_threads module or child processes.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 8,
        questionId: 8,
        category: 'Cloud & DevOps',
        prompt: 'Describe your strategy for zero-downtime deployment using Docker containers and CI/CD pipelines.',
        startedAtSessionSec: 158,
        durationSec: 16,
        transcript: 'I implement blue-green deployments orchestrated with Kubernetes or Docker Compose rolling updates behind an Nginx reverse proxy. The CI/CD pipeline builds immutable container images tagged by commit SHA, executes automated test suites, and provisions the green fleet. Traffic is switched only after readiness probes pass HTTP 200 health checks, with automated rollbacks if error rates spike.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 9,
        questionId: 9,
        category: 'Production Debugging',
        prompt: 'A production microservice is experiencing gradual memory leaks every 6 hours. How do you isolate and fix it?',
        startedAtSessionSec: 178,
        durationSec: 17,
        transcript: 'I take progressive heap snapshots using node --inspect and Chrome DevTools over the 6-hour interval. By comparing object retained sizes in heap dumps, I look for growing arrays, event listener closures holding large context references, or unevicted in-memory cache maps. Once isolated, I replace the leak with WeakMap references or bounded LRU caches with strict TTLs.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 10,
        questionId: 10,
        category: 'Resume-Claim Cross-Examination',
        isDynamicCrossExam: true,
        capturedKeyword: 'automated placement engine & concurrent slot dispatch',
        crossExaminedSkills: ['React', 'Node.js', 'PostgreSQL'],
        prompt: 'In Question 1, you highlighted building an automated placement engine & concurrent slot dispatch system. Your verified resume claims expertise in React, Node.js, and PostgreSQL. Walk us through how you designed the concurrency boundaries and database transactions using React and Node.js with PostgreSQL to eliminate race conditions and guarantee zero double-bookings under peak student load.',
        startedAtSessionSec: 200,
        durationSec: 22,
        transcript: 'When integrating React, Node.js, and PostgreSQL for the placement system, I separated read-heavy catalog queries from write transactions. In Node.js, I acquired an atomic Redis lock before opening a PostgreSQL transaction in SERIALIZABLE isolation. On the React frontend, I managed optimistic slot reservation timers backed by WebSocket heartbeats. If a student session expired before checkout, the Redis TTL automatically released the lock, preventing orphaned states without hammering the database.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
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
      driveId: '49d09d96-6803-4c5c-a6e0-5b602b1d472a',
      drive_id: '49d09d96-6803-4c5c-a6e0-5b602b1d472a',
      company: 'Infosys Limited',
      company_name: 'Infosys Limited',
      role: 'Data Analyst',
      role_title: 'Data Analyst',
      status: 'Video Assessment Called',
      stage: 'VIDEO_ASSESSMENT',
      videoAssessmentCalled: true,
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
      if (payload.applicationId) {
        next[payload.applicationId] = payload;
      }
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
        p.studentId === payload.studentId || (payload.applicationId && p.id === payload.applicationId)
          ? { ...p, aiMatch: Math.max(p.aiMatch || 0, 88), pipelineStatus: 'AI Video Round Archived' }
          : p
      )
    );

    const studentName = currentStudent?.name || currentStudent?.full_name || 'Candidate';
    addNotification('recruiter', {
      title: 'AI Video Interview Submitted',
      message: `${studentName} completed the 5-question AI video round with Groq Whisper transcriptions (Full recording + 5 clips).`,
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

  const callVideoAssessment = (studentId, driveId) => {
    setApplications((prev) =>
      prev.map((app) =>
        (!driveId || app.driveId === driveId || app.drive_id === driveId)
          ? {
              ...app,
              status: 'Video Assessment Called',
              stage: 'VIDEO_ASSESSMENT',
              videoAssessmentCalled: true,
              videoAssessmentCalledAt: new Date().toISOString(),
            }
          : app
      )
    );

    setPipeline((prev) =>
      prev.map((p) =>
        p.studentId === studentId
          ? { ...p, pipelineStatus: 'Video Assessment Called' }
          : p
      )
    );

    const studentName = currentStudent?.name || currentStudent?.full_name || 'Candidate';
    addNotification('student', {
      title: 'Recruiter Called for AI Video Assessment',
      message: 'You have been invited by the recruiter to complete your 5-question Live AI Technical Video Assessment.',
      category: 'Interview Call',
    });

    try {
      const targetDrive = drives.find((d) => d.id === driveId);
      const company = targetDrive?.company_name || 'Infosys Limited';
      const role = targetDrive?.role_title || 'Data Analyst';
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('campuslink_live_dispatch');
        bc.postMessage({
          companyName: company,
          roleTitle: role,
          driveId,
          timestamp: Date.now(),
        });
        bc.close();
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'campuslink_live_alert',
          JSON.stringify({
            companyName: company,
            roleTitle: role,
            driveId,
            timestamp: Date.now(),
          })
        );
        window.dispatchEvent(
          new CustomEvent('campuslink_live_event', {
            detail: { companyName: company, roleTitle: role, driveId, timestamp: Date.now() },
          })
        );
      }
    } catch (e) {}
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
    callVideoAssessment,
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
      callVideoAssessment: () => {},
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

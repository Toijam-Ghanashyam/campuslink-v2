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
    totalDurationSec: 150,
    integrityScore: 92,
    questionClips: [
      {
        questionNumber: 1,
        questionId: 1,
        category: 'Data Analytics & ETL Pipelines',
        prompt: 'Walk us through an end-to-end data analytics or machine learning pipeline you built. How did you handle data ingestion, missing values, anomaly detection, and preparing clean feature matrices for business stakeholder reporting?',
        startedAtSessionSec: 5,
        durationSec: 25,
        transcript: 'In my analytics project at BPUT, I built an end-to-end student performance and placement readiness pipeline. I ingested raw academic records, proctoring telemetry, and assessment logs across 2,000 students. For missing records, I applied domain-specific median imputation and eliminated multi-collinear attributes. I developed an automated anomaly detection script using Z-scores and IQR to flag skewed scores, and piped the cleaned data into interactive dashboards for placement officers.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 2,
        questionId: 2,
        category: 'Advanced SQL & Relational Queries',
        prompt: 'In SQL, how do window functions like ROW_NUMBER(), RANK(), and DENSE_RANK() differ? Provide an example of how you would write a query to find the top 3 highest-performing students per engineering branch.',
        startedAtSessionSec: 32,
        durationSec: 26,
        transcript: 'ROW_NUMBER() assigns a unique sequential integer to each row without gaps. RANK() assigns identical ranks to ties but skips subsequent rank numbers. DENSE_RANK() assigns identical ranks to ties without skipping subsequent integers. To find the top 3 highest-performing students per branch, I write a Common Table Expression using DENSE_RANK() OVER (PARTITION BY branch ORDER BY verified_cgpa DESC) as rnk, and then query the CTE where rnk <= 3.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 3,
        questionId: 3,
        category: 'Dimensional Data Modeling & Warehousing',
        prompt: 'Compare Star schema and Snowflake schema in enterprise data warehousing. How do you model Slowly Changing Dimensions (SCD Type 2) to preserve historical candidate placement audit trails?',
        startedAtSessionSec: 60,
        durationSec: 28,
        transcript: 'A Star schema features a central fact table surrounded by denormalized dimension tables, optimizing for fast query reads and simpler joins. A Snowflake schema normalizes dimension tables into sub-dimensions, reducing data redundancy at the cost of more complex multi-table joins. For preserving historical candidate audit trails, I implement SCD Type 2 by adding start_date, end_date, and is_current boolean flags, creating an immutable new row whenever a candidate status mutates.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 4,
        questionId: 4,
        category: 'Python for Data Analytics & Optimization',
        prompt: 'How does vectorization in Pandas and NumPy drastically outperform standard Python iterative for-loops on 10,000,000 rows? Explain the underlying memory contiguous layout and C-level SIMD operations.',
        startedAtSessionSec: 90,
        durationSec: 27,
        transcript: 'Standard Python for-loops suffer severe overhead because every iteration incurs dynamic type inspection, reference counting, and boxing in Python objects. NumPy and Pandas utilize homogeneous C-contiguous array blocks stored linearly in RAM. Operations on these contiguous buffers trigger hardware-level SIMD (Single Instruction, Multiple Data) CPU registers and cache-line prefetching, executing arithmetic concurrently across entire vectors with zero interpreter loop overhead.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 5,
        questionId: 5,
        category: 'Business Intelligence & Metric Anomaly Detection',
        prompt: 'Design an automated, real-time analytics dashboard for university leadership tracking placement conversion velocity, branch-wise package variances, and sudden drop-offs in recruiter assessment completions.',
        startedAtSessionSec: 120,
        durationSec: 26,
        transcript: 'I design a three-tier streaming analytics architecture. Events from student submissions and recruiter decisions are ingested into an event queue and processed using continuous window aggregations. The dashboard visualizes real-time conversion funnels from Application to Video Assessment to Offer. To catch sudden drop-offs, I establish automated Z-score threshold monitors that trigger alerts if interview completion velocity deviates more than 2 standard deviations below the 7-day moving average.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
    ],
    proctoringEvents: [
      { id: 'evt-1', timestampSec: 28, type: 'HEAD_TURNED_AWAY', status: 'warning', reason: 'Head yaw turned > 72% away from display' },
      { id: 'evt-2', timestampSec: 72, type: 'EYE_GAZE_OFF_SCREEN', status: 'warning', reason: 'Blendshape eye gaze reading off-screen' },
    ],
    completedAt: '2026-11-13T04:30:00Z',
  },
  'vikramaditya': {
    studentId: 'vikramaditya',
    studentName: 'Vikramaditya Das',
    rollNumber: 'TU-2023-EE112',
    fullSessionVideoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    totalDurationSec: 160,
    integrityScore: 100,
    questionClips: [
      {
        questionNumber: 1,
        questionId: 1,
        category: 'Google Systems & Architecture',
        prompt: 'Walk us through the most technically complex software system you have architected at BPUT. How did you design for low latency, fault tolerance, and clean modular boundaries relevant to Google-scale software development?',
        startedAtSessionSec: 6,
        durationSec: 28,
        transcript: 'I am an engineering senior at BPUT with a focus on scalable systems and low-latency services. My most technically rigorous project was an automated campus placement dispatch system. I architected the service with Node.js and PostgreSQL using optimistic concurrency control to prevent double-booking across 1,500 students. I separated read-heavy catalog queries from write transactions using Redis caching, and integrated WebSocket feeds for sub-100ms real-time panel updates.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 2,
        questionId: 2,
        category: 'Data Structures & Algorithmic Complexity',
        prompt: 'In a high-throughput Google service handling billions of queries, how would you design an in-memory LRU Cache with strict O(1) time complexity for both get and put operations? Explain the underlying pointer manipulation and eviction policy.',
        startedAtSessionSec: 36,
        durationSec: 29,
        transcript: 'To guarantee strict O(1) time complexity for both get and put operations, I pair a doubly linked list with a hash map. The hash map maps cache keys to pointers of nodes in the doubly linked list. When a key is accessed or added, the corresponding node is unlinked and spliced to the head of the list in O(1). When capacity is exceeded, the least recently used node is evicted from the tail in O(1) and purged from the hash map.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 3,
        questionId: 3,
        category: 'Distributed Systems & Concurrency',
        prompt: 'How does Google ensure data consistency across globally distributed storage systems like Spanner or Bigtable? How would you manage concurrent write conflicts without bottlenecking distributed transaction throughput?',
        startedAtSessionSec: 68,
        durationSec: 30,
        transcript: 'Google achieves external consistency at global scale in Spanner using TrueTime API, which leverages synchronized atomic clocks and GPS receivers to assign monotonically increasing commit timestamps. For concurrent write conflicts, Spanner employs multi-version concurrency control (MVCC) paired with two-phase locking and Paxos consensus. In my own designs, I minimize write contention by partitioning data across deterministic shard keys and using optimistic locking with lease TTLs in Redis.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 4,
        questionId: 4,
        category: 'Database Systems & Query Optimization',
        prompt: 'When would you choose a B-Tree composite index over a Hash index in PostgreSQL or Spanner, and how do you diagnose and eliminate an unindexed sequential scan causing high disk I/O in production?',
        startedAtSessionSec: 100,
        durationSec: 28,
        transcript: 'A composite B-Tree index is mandatory when queries filter or sort across multiple columns following the leftmost prefix rule, or perform range queries with inequalities. Hash indices only support equality lookups and cannot optimize range scans or ORDER BY clauses. To diagnose a slow query, I inspect the execution plan using EXPLAIN ANALYZE, identifying sequential table scans, excessive disk page fetches, and row estimation miscalculations, and add partial or covering indexes.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
      {
        questionNumber: 5,
        questionId: 5,
        category: 'High-Scale System Design',
        prompt: 'Design a real-time, conflict-free interview and drive slot reservation service that handles 100,000 concurrent student requests during campus drive-day rush. Walk us through your caching, distributed locking, and database write pipeline.',
        startedAtSessionSec: 130,
        durationSec: 28,
        transcript: 'For 100,000 concurrent requests, I would employ an event-driven architecture fronted by an API gateway with token-bucket rate limiting. When a candidate attempts to book a slot, an atomic Redis Lua script checks availability and acquires a distributed reservation lease with a 5-minute TTL. Once validated, an event is published to Apache Kafka, and a background consumer batches write transactions into PostgreSQL with unique constraints on (interviewer_id, timeslot) to guarantee zero double-bookings.',
        model: 'whisper-large-v3-turbo',
        transcribedBy: 'Groq Whisper Large v3 Turbo',
      },
    ],
    proctoringEvents: [
      { id: 'evt-1', timestampSec: 15, status: 'verified', reason: 'Identity verified with 100% face match' },
      { id: 'evt-2', timestampSec: 80, status: 'verified', reason: 'Continuous direct eye contact with proctoring mesh' },
    ],
    completedAt: '2026-11-13T07:15:00Z',
  },
};
SEEDED_SESSIONS['TU-2023-EE112'] = SEEDED_SESSIONS['vikramaditya'];
SEEDED_SESSIONS['vikramaditya-das'] = SEEDED_SESSIONS['vikramaditya'];

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

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

const StoreContext = createContext(null);

export function StoreProvider({ children, initialStudent = null, initialDrives = null, initialApps = null }) {
  const [currentStudent, setCurrentStudent] = useState(initialStudent || {
    id: 'demo-student-id',
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

  // Sync with localStorage if present
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem('campuslink_current_student');
      if (stored) {
        setCurrentStudent((prev) => ({ ...prev, ...JSON.parse(stored) }));
      }
    } catch (e) {}
  }, []);

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
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    // Return sensible fallback state if accessed outside Provider
    return {
      currentStudent: {
        id: 'default-student',
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
    };
  }
  return context;
}

export default {
  StoreProvider,
  useStore,
};

'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { applyToPlacementDrive, updateStudentSkills, updateStudentProjects } from '@/app/actions/placement';
import {
  rankDrivesForStudent,
  RankedPlacementDrive,
  normalizeSkills,
} from '@/lib/compatibility-matcher';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RecommendedProjectBlueprint } from '@/types/projects';

type SortFilter = 'BEST_SUITED' | 'HIGH_MATCH' | 'TIER_1' | 'HIGHEST_CTC' | 'DATE';

const DEMO_STARTER_SKILLS = [
  'Python',
  'Data Structures & Algorithms',
  'React',
  'JavaScript',
  'SQL',
  'Git',
  'REST APIs',
];

export default function StudentDrivesPage() {
  const [rawDrives, setRawDrives] = useState<any[]>([]);
  const [student, setStudent] = useState<any>(null);
  const [studentSkills, setStudentSkills] = useState<string[]>([]);
  const [studentProjects, setStudentProjects] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  // Search & Sorting Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [sortFilter, setSortFilter] = useState<SortFilter>('BEST_SUITED');

  // Resume Upload Modal State for Job Application
  const [selectedDrive, setSelectedDrive] = useState<any>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);

  // Portfolio Readiness Check Modal State
  const [showPortfolioCheckModal, setShowPortfolioCheckModal] = useState(false);
  const [portfolioCheckDrive, setPortfolioCheckDrive] = useState<any>(null);
  const [loadingPortfolioRecs, setLoadingPortfolioRecs] = useState(false);
  const [portfolioRecs, setPortfolioRecs] = useState<{
    matchedSkills: string[];
    missingSkills: string[];
    projects: RecommendedProjectBlueprint[];
    reasoning?: string;
  } | null>(null);
  const [copiedBulletId, setCopiedBulletId] = useState<string | null>(null);

  // Resume Skills Re-Scan Modal State
  const [showRescanModal, setShowRescanModal] = useState(false);
  const [scanFile, setScanFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanNotice, setScanNotice] = useState<string | null>(null);

  // Quick Manual Skill Addition
  const [newSkillInput, setNewSkillInput] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  const supabase = createClient();

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    let currentSkills: string[] = [];
    let currentProjects: any[] = [];

    if (user) {
      const { data: profile } = await supabase
        .from('student_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      setStudent(profile);

      // Extract skills from profile.skills or user_metadata.skills
      if (profile && Array.isArray(profile.skills) && profile.skills.length > 0) {
        currentSkills = profile.skills;
      } else if (user.user_metadata?.skills && Array.isArray(user.user_metadata.skills)) {
        currentSkills = user.user_metadata.skills;
      }

      setStudentSkills(currentSkills);

      // Extract projects from profile.projects or user_metadata.projects
      if (profile && Array.isArray(profile.projects) && profile.projects.length > 0) {
        currentProjects = profile.projects;
      } else if (user.user_metadata?.projects && Array.isArray(user.user_metadata.projects)) {
        currentProjects = user.user_metadata.projects;
      }

      setStudentProjects(currentProjects);

      if (profile) {
        const { data: apps } = await supabase
          .from('drive_applications')
          .select('*')
          .eq('student_id', profile.id);

        const appMap: Record<string, any> = {};
        apps?.forEach((a) => {
          appMap[a.drive_id] = a;
        });
        setMyApplications(appMap);
      }
    }

    const { data: driveList } = await supabase
      .from('placement_drives')
      .select('*')
      .order('drive_date', { ascending: true });

    setRawDrives(driveList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute AI Suitability Ranking & Compatibility for all drives
  const rankedDrives: RankedPlacementDrive[] = useMemo(() => {
    return rankDrivesForStudent(
      rawDrives,
      studentSkills,
      student?.verified_cgpa ?? 7.5,
      student?.active_backlogs ?? 0
    );
  }, [rawDrives, studentSkills, student]);

  // Auto-open project recommendations if arriving from ?driveId=...&openRecs=true
  useEffect(() => {
    if (typeof window === 'undefined' || rankedDrives.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const driveId = params.get('driveId');
    const openRecs = params.get('openRecs');
    if (driveId && openRecs === 'true') {
      const targetDrive = rankedDrives.find((d) => d.id === driveId);
      if (targetDrive) {
        fetchProjectRecsForDrive(targetDrive);
        // Clean URL parameter without reload
        const newUrl = window.location.pathname;
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [rankedDrives]);

  // Apply User Filtering / Sorting on top of ranked drives
  const displayedDrives = useMemo(() => {
    let list = [...rankedDrives];

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.company_name.toLowerCase().includes(q) ||
          d.role_title.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.compatibility.matchedSkills.some((s) => s.toLowerCase().includes(q))
      );
    }

    // Filter / Sort tabs
    switch (sortFilter) {
      case 'BEST_SUITED':
        // Keep default AI rank (descending by compatibility score)
        return list.sort((a, b) => a.suitabilityRank - b.suitabilityRank);
      case 'HIGH_MATCH':
        // Only 70%+ match
        return list.filter((d) => d.compatibility.score >= 70);
      case 'TIER_1':
        return list.sort((a, b) => {
          if (a.tier === 'TIER_1' && b.tier !== 'TIER_1') return -1;
          if (b.tier === 'TIER_1' && a.tier !== 'TIER_1') return 1;
          return a.suitabilityRank - b.suitabilityRank;
        });
      case 'HIGHEST_CTC':
        return list.sort((a, b) => (Number(b.max_ctc) || 0) - (Number(a.max_ctc) || 0));
      case 'DATE':
        return list.sort(
          (a, b) =>
            new Date(a.drive_date || 0).getTime() - new Date(b.drive_date || 0).getTime()
        );
      default:
        return list;
    }
  }, [rankedDrives, searchQuery, sortFilter]);

  // Skill Management: Add Skill
  const handleAddSkill = async (skillToAdd?: string) => {
    const target = (skillToAdd || newSkillInput).trim();
    if (!target) return;

    const updated = normalizeSkills([...studentSkills, target]);
    setStudentSkills(updated);
    setNewSkillInput('');

    setSavingSkills(true);
    await updateStudentSkills(updated);
    setSavingSkills(false);
  };

  // Skill Management: Remove Skill
  const handleRemoveSkill = async (skillToRemove: string) => {
    const updated = studentSkills.filter(
      (s) => s.toLowerCase() !== skillToRemove.toLowerCase()
    );
    setStudentSkills(updated);

    setSavingSkills(true);
    await updateStudentSkills(updated);
    setSavingSkills(false);
  };

  // Skill Management: Seed Starter Skills if empty
  const handleLoadStarterSkills = async () => {
    const updated = normalizeSkills([...studentSkills, ...DEMO_STARTER_SKILLS]);
    setStudentSkills(updated);
    setSavingSkills(true);
    await updateStudentSkills(updated);
    setSavingSkills(false);
  };

  // Resume Re-Scan Parser
  const handlePerformResumeScan = async () => {
    if (!scanFile) {
      alert('Please select a PDF resume.');
      return;
    }

    setScanning(true);
    setScanNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', scanFile);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        alert(json.error || 'Failed to parse resume PDF.');
        setScanning(false);
        return;
      }

      const extractedSkills: string[] = json.data?.skills || [];
      const extractedProjects: any[] = json.data?.projects || [];

      if (extractedSkills.length === 0 && extractedProjects.length === 0) {
        setScanNotice('Resume parsed, but no technical skills or projects were detected. You can add them manually.');
      } else {
        const merged = normalizeSkills([...studentSkills, ...extractedSkills]);
        setStudentSkills(merged);
        await updateStudentSkills(merged);

        if (extractedProjects.length > 0) {
          setStudentProjects(extractedProjects);
          await updateStudentProjects(extractedProjects);
        }

        setScanNotice(
          `✨ Successfully extracted ${extractedSkills.length} skills and ${extractedProjects.length} projects! All placement drives re-ranked.`
        );
      }
    } catch (err: any) {
      alert(`Resume scan error: ${err.message}`);
    } finally {
      setScanning(false);
    }
  };

  const fetchProjectRecsForDrive = async (drive: any) => {
    setPortfolioCheckDrive(drive);
    setShowPortfolioCheckModal(true);
    setLoadingPortfolioRecs(true);
    setPortfolioRecs(null);

    try {
      const res = await fetch('/api/recommend-projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ driveId: drive.id }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || 'Failed to fetch recommendations');
      }
      setPortfolioRecs({
        matchedSkills: json.matchedSkills || [],
        missingSkills: json.missingSkills || [],
        projects: json.projects || [],
        reasoning: json.reasoning || '',
      });
    } catch (err: any) {
      console.error('Error fetching project recs:', err);
    } finally {
      setLoadingPortfolioRecs(false);
    }
  };

  const handleCopyBullets = (projectTitle: string, bullets: string[]) => {
    const text = bullets.map((b) => `• ${b}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopiedBulletId(projectTitle);
    setTimeout(() => setCopiedBulletId(null), 2500);
  };

  const handleProceedToApplyAnyway = () => {
    const target = portfolioCheckDrive;
    setShowPortfolioCheckModal(false);
    if (target) {
      setSelectedDrive(target);
      setResumeFile(null);
      setEvalResult(null);
    }
  };

  const handleApplyClick = (drive: any) => {
    if (student && !student.is_locked) {
      if (student.verification_status === 'MISMATCH_LOCKED' || student.rejection_reason) {
        alert(
          `Profile Locked (Dataset Mismatch):\n${student.rejection_reason}\n\nPlease go to your Student Dashboard and click "Fix This Data & Re-Verify" to unlock drive applications.`
        );
      } else {
        alert(
          'Academic Record Pending Verification: Under PEP Rule 1, your academic record must be verified and locked by your College Placement Cell before submitting drive applications.'
        );
      }
      return;
    }

    // Intercept: if student is verified BUT has 0 projects, open Portfolio Readiness Check!
    if (student?.is_locked && (!studentProjects || studentProjects.length === 0)) {
      fetchProjectRecsForDrive(drive);
      return;
    }

    setSelectedDrive(drive);
    setResumeFile(null);
    setEvalResult(null);
  };

  const handleConfirmApplication = async () => {
    if (!selectedDrive || !resumeFile) {
      alert('Please select a PDF resume.');
      return;
    }

    setUploading(true);

    // 1. Pass through PEP Engine verification
    const applyRes = await applyToPlacementDrive(selectedDrive.id);
    if (!applyRes.success) {
      alert(`Policy Check Blocked: ${applyRes.error}`);
      setUploading(false);
      return;
    }

    // 2. Fetch the newly created application ID
    const { data: appData } = await supabase
      .from('drive_applications')
      .select('id')
      .eq('drive_id', selectedDrive.id)
      .eq('student_id', student.id)
      .single();

    if (!appData) {
      alert('Failed to retrieve application record.');
      setUploading(false);
      return;
    }

    // 3. Trigger AI screening endpoint
    const formData = new FormData();
    formData.append('file', resumeFile);
    formData.append('application_id', appData.id);
    formData.append('role_title', selectedDrive.role_title);
    formData.append('tier', selectedDrive.tier);

    const screenRes = await fetch('/api/screen-resume', {
      method: 'POST',
      body: formData,
    });

    const screenData = await screenRes.json();
    setUploading(false);

    if (screenData.success) {
      setEvalResult(screenData);
      loadData();
    } else {
      alert(`AI Screening Error: ${screenData.error}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 p-8 text-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading placement portal & computing compatibility ranking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Active Placement Drives</h1>
            <p className="text-sm text-slate-400">
              AI Job Compatibility Ranking &amp; Resume Skill Match Engine
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/student/live-status">
              <Button variant="outline" size="sm" className="border-indigo-600/40 text-indigo-400 hover:bg-indigo-950/40 text-xs">
                Live Dispatch
              </Button>
            </Link>
            <Link href="/student/remediation">
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Monaco Remediation
              </Button>
            </Link>
            {student && (
              <div className="text-right text-xs text-slate-400 pl-2 border-l border-slate-800">
                <p>Roll: <span className="text-slate-200 font-medium">{student.roll_number}</span></p>
                <p>CGPA: <span className="text-emerald-400 font-semibold">{Number(student.verified_cgpa).toFixed(2)}</span></p>
              </div>
            )}
          </div>
        </header>

        {/* PEP Rule 1 Notice if pending lock or mismatch locked */}
        {student && !student.is_locked && (student.verification_status === 'MISMATCH_LOCKED' || Boolean(student.rejection_reason)) ? (
          <div className="rounded-lg border-2 border-rose-600/80 bg-rose-950/40 p-4 text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
            <div className="flex items-start gap-3">
              <span className="text-xl">🔒</span>
              <div>
                <p className="font-bold text-rose-300 text-sm">PEP Rule 1 Notice: Profile Locked (Dataset Mismatch Detected)</p>
                <p className="text-rose-200/90 mt-0.5">
                  Your profile details do not match the official college dataset: <span className="font-semibold text-white">{student.rejection_reason}</span>. Drive applications are locked until you correct your details.
                </p>
              </div>
            </div>
            <Link href="/student" className="shrink-0">
              <Button size="sm" className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md">
                🛠️ Fix on Dashboard
              </Button>
            </Link>
          </div>
        ) : student && !student.is_locked ? (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 p-4 text-xs text-amber-300 flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-200">PEP Rule 1 Notice: Academic Record Awaiting TPO Lock</p>
              <p className="text-amber-300/80 mt-0.5">
                Your profile is undergoing verification by your College Placement Cell. You can review job compatibility, skill gaps, and rankings below. Application submissions will unlock once verified.
              </p>
            </div>
          </div>
        ) : null}

        {/* RESUME SKILLS AI MATCH PROFILER BAR */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🎯</span>
                <h2 className="text-base font-bold text-slate-100">
                  Your Resume Skills Profile
                </h2>
                <Badge className="bg-indigo-500/20 text-indigo-300 border-indigo-500/40 text-[10px]">
                  {studentSkills.length} Verified Skills
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Compatibility scores and rankings are dynamically matched against these skills from your resume.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setScanFile(null);
                  setScanNotice(null);
                  setShowRescanModal(true);
                }}
                className="border-indigo-600/40 text-indigo-300 hover:bg-indigo-950/40 text-xs h-8"
              >
                📄 Scan / Update Resume PDF
              </Button>
              {studentSkills.length === 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLoadStarterSkills}
                  disabled={savingSkills}
                  className="border-emerald-600/40 text-emerald-300 hover:bg-emerald-950/40 text-xs h-8"
                >
                  ⚡ Load Sample Skills
                </Button>
              )}
            </div>
          </div>

          {/* Skill Pills */}
          <div className="space-y-3">
            {studentSkills.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2">
                {studentSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 border border-slate-700/80 px-3 py-1 text-xs text-slate-200 shadow-sm"
                  >
                    <span className="text-emerald-400 text-xs font-bold">✓</span>
                    <span>{skill}</span>
                    <button
                      onClick={() => handleRemoveSkill(skill)}
                      className="text-slate-400 hover:text-rose-400 font-bold ml-0.5 text-xs focus:outline-none"
                      title="Remove skill"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-700 p-4 text-center text-xs text-slate-400 space-y-2">
                <p>No technical skills detected yet on your profile.</p>
                <p className="text-slate-500">
                  Upload your resume PDF or click "Load Sample Skills" to activate personalized AI compatibility rankings!
                </p>
              </div>
            )}

            {/* Quick Add Skill Input */}
            <div className="flex items-center gap-2 pt-1 max-w-md">
              <Input
                type="text"
                placeholder="Add skill (e.g. Docker, Spring Boot, MongoDB)"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                className="h-8 text-xs border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!newSkillInput.trim() || savingSkills}
                onClick={() => handleAddSkill()}
                className="h-8 text-xs px-3 bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                + Add
              </Button>
            </div>
          </div>
        </section>

        {/* FILTER & SORT BAR */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-900 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setSortFilter('BEST_SUITED')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sortFilter === 'BEST_SUITED'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>🔥</span> Best Suited (AI Ranked)
            </button>
            <button
              onClick={() => setSortFilter('HIGH_MATCH')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sortFilter === 'HIGH_MATCH'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>⭐</span> 70%+ Match
            </button>
            <button
              onClick={() => setSortFilter('TIER_1')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sortFilter === 'TIER_1'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💎</span> Tier 1 First
            </button>
            <button
              onClick={() => setSortFilter('HIGHEST_CTC')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sortFilter === 'HIGHEST_CTC'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>💰</span> Highest CTC
            </button>
            <button
              onClick={() => setSortFilter('DATE')}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                sortFilter === 'DATE'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>📅</span> Drive Date
            </button>
          </div>

          {/* Search Box */}
          <div className="w-full md:w-72">
            <Input
              type="text"
              placeholder="Search by company, role, or skill..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 text-xs border-slate-800 bg-slate-900 text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* RANKED DRIVES GRID */}
        {displayedDrives.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-12 text-center text-slate-400 space-y-2">
            <p className="text-lg">No placement drives found matching your criteria.</p>
            <p className="text-xs text-slate-500">
              Try adjusting your search query or switching to "Best Suited (AI Ranked)".
            </p>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {displayedDrives.map((drive) => {
              const application = myApplications[drive.id];
              const compat = drive.compatibility;

              // Color helper for compatibility score badge
              const getBadgeColor = (rating: string) => {
                switch (rating) {
                  case 'EXCEPTIONAL':
                    return 'bg-emerald-950/90 text-emerald-400 border-emerald-500/50';
                  case 'STRONG':
                    return 'bg-indigo-950/90 text-indigo-300 border-indigo-500/50';
                  case 'MODERATE':
                    return 'bg-amber-950/90 text-amber-300 border-amber-500/50';
                  case 'DEVELOPING':
                  default:
                    return 'bg-rose-950/90 text-rose-300 border-rose-500/50';
                }
              };

              // Color helper for progress bar
              const getBarColor = (rating: string) => {
                switch (rating) {
                  case 'EXCEPTIONAL':
                    return 'bg-emerald-500';
                  case 'STRONG':
                    return 'bg-indigo-500';
                  case 'MODERATE':
                    return 'bg-amber-500';
                  case 'DEVELOPING':
                  default:
                    return 'bg-rose-500';
                }
              };

              return (
                <Card
                  key={drive.id}
                  className={`border-slate-800 bg-slate-900 text-slate-100 flex flex-col justify-between transition-all hover:border-slate-700 shadow-md ${
                    drive.suitabilityRank === 1
                      ? 'ring-1 ring-amber-500/50 shadow-amber-950/20'
                      : ''
                  }`}
                >
                  <CardHeader className="pb-3 space-y-2">
                    {/* Top Row: Rank & Tier */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {drive.suitabilityRank === 1 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border border-yellow-500/40 px-2 py-0.5 text-[10px] font-bold text-yellow-300">
                            🏆 #1 Best Fit
                          </span>
                        )}
                        {drive.suitabilityRank === 2 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-600 px-2 py-0.5 text-[10px] font-semibold text-slate-200">
                            🥈 #2 Fit
                          </span>
                        )}
                        {drive.suitabilityRank === 3 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-800 border border-slate-600 px-2 py-0.5 text-[10px] font-semibold text-amber-200">
                            🥉 #3 Fit
                          </span>
                        )}
                        {drive.suitabilityRank > 3 && (
                          <span className="text-[10px] font-medium text-slate-400">
                            Rank #{drive.suitabilityRank}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {studentProjects.length === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-950/80 border border-amber-600/60 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                            ⚠️ 0 Projects on Resume
                          </span>
                        )}
                        <Badge
                          variant={
                            drive.tier === 'TIER_1'
                              ? 'destructive'
                              : drive.tier === 'TIER_2'
                              ? 'default'
                              : 'secondary'
                          }
                          className="text-[10px]"
                        >
                          {drive.tier}
                        </Badge>
                      </div>
                    </div>

                    {/* Company Name & Role Title */}
                    <div>
                      <CardTitle className="text-xl font-bold">{drive.company_name}</CardTitle>
                      <p className="text-xs text-slate-400 mt-0.5">{drive.role_title}</p>
                    </div>

                    {/* Compatibility Score Banner */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 font-medium">Resume Match:</span>
                        <span
                          className={`font-bold px-2 py-0.5 rounded border text-[11px] ${getBadgeColor(
                            compat.rating
                          )}`}
                        >
                          🎯 {compat.score}% • {compat.ratingLabel}
                        </span>
                      </div>
                      {/* Visual progress bar */}
                      <div className="h-2 w-full rounded-full bg-slate-950 overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${getBarColor(
                            compat.rating
                          )}`}
                          style={{ width: `${compat.score}%` }}
                        />
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pt-1 flex-1 flex flex-col justify-between">
                    <div className="space-y-3">
                      {/* CTC & Academic Cutoff */}
                      <div className="flex items-center justify-between text-xs border-y border-slate-800/80 py-2">
                        <span className="font-bold text-emerald-400 text-sm">
                          ₹{drive.min_ctc} - ₹{drive.max_ctc} LPA
                        </span>
                        <span
                          className={`font-medium ${
                            compat.cgpaEligible ? 'text-slate-400' : 'text-rose-400'
                          }`}
                        >
                          Cutoff: {drive.cgpa_cutoff} CGPA{' '}
                          {!compat.cgpaEligible && '(Ineligible)'}
                        </span>
                      </div>

                      {/* Matched Skills */}
                      {compat.matchedSkills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-emerald-400 mb-1 flex items-center gap-1">
                            <span>✓</span> Matched Skills ({compat.matchedSkills.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {compat.matchedSkills.slice(0, 5).map((m) => (
                              <span
                                key={m}
                                className="rounded bg-emerald-950/60 border border-emerald-700/50 px-2 py-0.5 text-[10px] text-emerald-300 font-medium"
                              >
                                {m}
                              </span>
                            ))}
                            {compat.matchedSkills.length > 5 && (
                              <span className="text-[10px] text-slate-400 self-center">
                                +{compat.matchedSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Missing Skill Gaps */}
                      {compat.missingSkills.length > 0 && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase text-amber-400 mb-1 flex items-center gap-1">
                            <span>⚠️</span> Missing Skill Gaps ({compat.missingSkills.length}):
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {compat.missingSkills.slice(0, 4).map((g) => (
                              <span
                                key={g}
                                className="rounded bg-amber-950/50 border border-amber-700/40 px-2 py-0.5 text-[10px] text-amber-300"
                              >
                                {g}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* AI Natural Summary */}
                      <p className="text-[11px] text-slate-400 italic bg-slate-950/60 p-2 rounded border border-slate-800/80">
                        "{compat.summary}"
                      </p>
                    </div>

                    {/* Bottom Action Area */}
                    <div className="space-y-2 pt-2">
                      {/* One-click Remediation & AI Project Recommendation CTAs */}
                      <div className="space-y-1.5 mb-1.5">
                        {compat.missingSkills.length > 0 && (
                          <Link href={compat.remediationPath || '/student/remediation'}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full text-[11px] h-7 border-indigo-700/50 text-indigo-300 hover:bg-indigo-950/50"
                            >
                              ⚡ Prepare Missing Skills in Monaco &rarr;
                            </Button>
                          </Link>
                        )}
                        {studentProjects.length === 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchProjectRecsForDrive(drive)}
                            className="w-full text-[11px] h-7 border-amber-600/50 text-amber-300 hover:bg-amber-950/40 font-medium flex items-center justify-center gap-1"
                          >
                            <span>💡</span> Get Project Ideas &rarr;
                          </Button>
                        )}
                      </div>

                      {application ? (
                        <div className="rounded-md border border-slate-800 bg-slate-950 p-3 text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Application Stage:</span>
                            <span className="font-semibold text-indigo-400">{application.stage}</span>
                          </div>
                          {application.ai_fit_score && (
                            <div className="flex justify-between">
                              <span className="text-slate-400">Screening Fit Score:</span>
                              <span className="font-semibold text-emerald-400">{application.ai_fit_score}%</span>
                            </div>
                          )}
                          {application.ai_feedback_summary && (
                            <p className="text-slate-300 italic pt-1 border-t border-slate-800/80 text-[11px]">
                              "{application.ai_feedback_summary}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleApplyClick(drive)}
                          className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold"
                        >
                          Apply with Resume
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: RESUME RE-SCAN & SKILL EXTRACTION */}
      <Dialog open={showRescanModal} onOpenChange={setShowRescanModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Scan Resume with Gemini AI</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Upload your updated PDF resume. Gemini will extract technical skills, programming languages, and frameworks to re-rank all placement drives specifically for you.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Resume Document (PDF)</label>
              <Input
                type="file"
                accept="application/pdf"
                onChange={(e) => {
                  setScanFile(e.target.files?.[0] || null);
                  setScanNotice(null);
                }}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>

            {scanNotice && (
              <div className="rounded-md border border-emerald-800/60 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                {scanNotice}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handlePerformResumeScan}
                disabled={scanning || !scanFile}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-xs"
              >
                {scanning ? 'Extracting Skills with Gemini...' : 'Extract & Re-Rank Jobs'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRescanModal(false)}
                className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Done
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL: APPLICATION SUBMISSION WITH RESUME */}
      <Dialog open={!!selectedDrive} onOpenChange={() => setSelectedDrive(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Apply to {selectedDrive?.company_name}</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Upload your PDF resume. The system will evaluate your eligibility and compute your screening rubric for {selectedDrive?.role_title}.
            </DialogDescription>
          </DialogHeader>

          {!evalResult ? (
            <div className="space-y-4 py-2">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Resume Document (PDF)</label>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>

              <Button
                onClick={handleConfirmApplication}
                disabled={uploading || !resumeFile}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs"
              >
                {uploading ? 'Analyzing Resume with Gemini...' : 'Submit & Analyze'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4">
                <p className="text-xs uppercase font-semibold text-emerald-400">AI Fit Score</p>
                <p className="text-3xl font-bold text-emerald-300">{evalResult.fit_score}%</p>
                <p className="text-xs text-slate-300 mt-2">{evalResult.summary}</p>
              </div>
              <Button
                onClick={() => setSelectedDrive(null)}
                className="w-full bg-slate-800 hover:bg-slate-700 text-xs"
              >
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: PORTFOLIO READINESS CHECK (AI PROJECT RECOMMENDATIONS) */}
      <Dialog open={showPortfolioCheckModal} onOpenChange={setShowPortfolioCheckModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between gap-2 pr-6">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 text-lg">
                  💡
                </span>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    Portfolio Readiness Check — {portfolioCheckDrive?.company_name}
                  </DialogTitle>
                  <p className="text-xs text-amber-300/90 font-medium mt-0.5">
                    Role: {portfolioCheckDrive?.role_title} ({portfolioCheckDrive?.tier})
                  </p>
                </div>
              </div>
              <Badge className="bg-amber-950 text-amber-300 border border-amber-700/60 text-[10px] shrink-0">
                ⚠️ 0 Projects Detected on Resume
              </Badge>
            </div>
            <DialogDescription className="text-slate-400 text-xs mt-2 leading-relaxed">
              Recruiters at <strong className="text-white">{portfolioCheckDrive?.company_name}</strong> evaluate candidate hands-on depth based on technical projects. Below are 3 bespoke, production-grade project blueprints generated by our Open-Weight LLM engine (Qwen / GPT-OSS) that leverage your existing skills to bridge your missing JD requirements.
            </DialogDescription>
          </DialogHeader>

          {loadingPortfolioRecs ? (
            <div className="py-14 text-center space-y-3">
              <div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
              <p className="text-sm font-semibold text-indigo-300 animate-pulse">
                Consulting Groq Open-Weight Engine (Qwen 27B / GPT-OSS 20B)...
              </p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Synthesizing high-impact project blueprints tailored to {portfolioCheckDrive?.company_name}&apos;s domain requirements and your skill profile.
              </p>
            </div>
          ) : portfolioRecs ? (
            <div className="space-y-4 py-2">
              {/* Forced Chain-of-Thought Reasoning Box */}
              {portfolioRecs.reasoning && (
                <div className="rounded-xl border border-indigo-800/40 bg-indigo-950/20 p-3.5 text-xs text-indigo-200 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-300 uppercase tracking-wider text-[11px]">
                    <span>🧠</span> Architectural Skill Gap Reasoning &amp; Suitability Analysis
                  </div>
                  <p className="leading-relaxed text-slate-300 text-xs">
                    {portfolioRecs.reasoning}
                  </p>
                </div>
              )}

              {/* 3 Project Blueprints */}
              <div className="space-y-4">
                {portfolioRecs.projects.map((proj, idx) => {
                  const isCopied = copiedBulletId === proj.title;

                  return (
                    <Card
                      key={idx}
                      className="border-slate-800 bg-slate-950/90 text-slate-100 p-4 rounded-xl space-y-3 shadow-md hover:border-slate-700 transition-colors"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-800 pb-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-base text-white">
                              {idx + 1}. {proj.title}
                            </span>
                            <Badge
                              className={`text-[10px] font-semibold ${
                                proj.difficulty === 'Advanced'
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : proj.difficulty === 'Intermediate'
                                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                                  : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              }`}
                            >
                              {proj.difficulty}
                            </Badge>
                            <span className="text-[11px] text-slate-400">
                              ⏱️ ~{proj.estimatedHours} Hours
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {proj.problemStatement}
                          </p>
                        </div>

                        <div className="rounded-lg border border-emerald-600/40 bg-emerald-950/40 px-3 py-1 text-center shrink-0">
                          <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 block">
                            Suitability
                          </span>
                          <span className="text-sm font-black text-emerald-300">
                            {proj.suitabilityScore}%
                          </span>
                        </div>
                      </div>

                      {/* Skills Leveraged vs Missing Bridged */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center gap-1">
                            <span>✓</span> Existing Skills Leveraged:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {proj.existingSkillsUsed.map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-700/40 text-[10px] font-medium"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-lg bg-slate-900/80 p-2.5 border border-slate-800 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-amber-400 flex items-center gap-1">
                            <span>🎯</span> Missing Skills Bridged:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {proj.missingSkillsTargeted.map((sk) => (
                              <span
                                key={sk}
                                className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-700/40 text-[10px] font-medium"
                              >
                                {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 3-Step MVP Roadmap */}
                      <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800/80 space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 block">
                          🚀 3-Weekend MVP Milestones:
                        </span>
                        <ul className="space-y-1 text-xs text-slate-300">
                          {proj.mvpMilestones.map((m, mIdx) => (
                            <li key={mIdx} className="flex items-start gap-2">
                              <span className="text-indigo-400 font-mono text-[11px] font-bold shrink-0">
                                0{mIdx + 1}.
                              </span>
                              <span>{m}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Resume Bullets + Copy Button */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 text-xs">
                        <div className="space-y-1 flex-1">
                          <span className="text-[10px] font-bold uppercase text-slate-400 block">
                            ATS-Ready Resume Bullets:
                          </span>
                          {proj.resumeBulletPoints.map((b, bIdx) => (
                            <p key={bIdx} className="text-slate-300 italic text-[11px] leading-relaxed">
                              • {b}
                            </p>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyBullets(proj.title, proj.resumeBulletPoints)}
                          className="shrink-0 text-xs border-indigo-700/60 hover:bg-indigo-950/50 text-indigo-300 h-8"
                        >
                          {isCopied ? '✓ Copied to Clipboard!' : '📋 Copy Resume Bullets'}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <Button
                  variant="outline"
                  onClick={handleProceedToApplyAnyway}
                  className="w-full sm:w-auto text-xs border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Proceed to Apply Anyway &rarr;
                </Button>
                <Button
                  onClick={() => setShowPortfolioCheckModal(false)}
                  className="w-full sm:w-auto text-xs bg-indigo-600 hover:bg-indigo-500 font-bold px-6"
                >
                  🛠️ I&apos;ll Build This First
                </Button>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs">
              No recommendations available.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

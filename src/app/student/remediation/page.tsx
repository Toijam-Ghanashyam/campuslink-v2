'use client';

import { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CandidateRoadmap, RoadmapMilestone, SkillDifficulty } from '@/types/roadmap';
import { CURATED_PRACTICE_PROBLEMS, PracticeProblem } from '@/lib/curated-problems';

// Dynamically import Monaco Editor to avoid SSR hydration mismatch
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

function RemediationStudioContent() {
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get('appId');
  const urlDriveTitle = searchParams.get('driveTitle') || searchParams.get('company');
  const urlRole = searchParams.get('role');
  const urlMissingSkills = searchParams.get('missingSkills');
  const urlAutoGenerate = searchParams.get('autoGenerate');

  const [activeTab, setActiveTab] = useState<'roadmap' | 'sandbox'>('roadmap');
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<CandidateRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<CandidateRoadmap | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [hasAutoTriggered, setHasAutoTriggered] = useState<boolean>(false);
  const [missingSkillsFocus, setMissingSkillsFocus] = useState<string[]>(
    urlMissingSkills ? urlMissingSkills.split(',').map((s) => s.trim()).filter(Boolean) : []
  );

  // Curated LeetCode Studio State
  const [activeProblem, setActiveProblem] = useState<PracticeProblem>(CURATED_PRACTICE_PROBLEMS[0]);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState<string>(CURATED_PRACTICE_PROBLEMS[0].starterCode.python);
  const [output, setOutput] = useState<string>('');
  const [executing, setExecuting] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<any[] | null>(null);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState<number>(0);
  const [showSolutionModal, setShowSolutionModal] = useState<boolean>(false);

  // Custom Generator form state
  const [targetCompanyInput, setTargetCompanyInput] = useState<string>(urlDriveTitle || '');
  const [targetRoleInput, setTargetRoleInput] = useState<string>(urlRole || '');

  const supabase = createClient();

  useEffect(() => {
    if (urlDriveTitle) setTargetCompanyInput(urlDriveTitle);
    if (urlRole) setTargetRoleInput(urlRole);
    if (urlMissingSkills) {
      setMissingSkillsFocus(urlMissingSkills.split(',').map((s) => s.trim()).filter(Boolean));
    }
  }, [urlDriveTitle, urlRole, urlMissingSkills]);

  // Load existing feedback and roadmaps
  useEffect(() => {
    async function initData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('student_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        // 1. Fetch Diagnostic Feedback
        const { data: apps } = await supabase
          .from('drive_applications')
          .select(`
            id,
            ai_fit_score,
            ai_feedback_summary,
            stage,
            placement_drives ( company_name, role_title )
          `)
          .eq('student_id', profile.id)
          .not('ai_feedback_summary', 'is', null);

        setFeedbackHistory(apps || []);

        // 2. Fetch existing roadmaps
        try {
          const res = await fetch('/api/generate-roadmap');
          const data = await res.json();
          if (data.roadmaps && data.roadmaps.length > 0) {
            setRoadmaps(data.roadmaps);
            setActiveRoadmap(data.roadmaps[0]);
          }
        } catch (e) {
          console.error('Failed to load existing roadmaps:', e);
        }

        // 3. Auto-trigger generation if navigating with autoGenerate or missingSkills from drives page
        if (!hasAutoTriggered) {
          if (urlAutoGenerate === 'true' || urlMissingSkills) {
            setHasAutoTriggered(true);
            const missingArr = urlMissingSkills
              ? urlMissingSkills.split(',').map((s) => s.trim()).filter(Boolean)
              : [];
            setMissingSkillsFocus(missingArr);
            await handleGenerateRoadmap(
              urlAppId || undefined,
              urlDriveTitle || undefined,
              urlRole || undefined,
              true,
              missingArr
            );
          } else if (urlAppId) {
            setHasAutoTriggered(true);
            handleGenerateRoadmap(urlAppId, urlDriveTitle || undefined, urlRole || undefined);
          }
        }
      }
    }
    initData();
  }, [urlAppId, urlAutoGenerate, urlMissingSkills, urlDriveTitle, urlRole, hasAutoTriggered]);

  const handleGenerateRoadmap = async (
    applicationId?: string,
    companyName?: string,
    roleTitle?: string,
    forceRegenerate: boolean = false,
    missingSkills?: string[]
  ) => {
    setGenerating(true);
    setActiveTab('roadmap');

    const targetCo = companyName || targetCompanyInput || 'Tech Enterprise';
    const targetRo = roleTitle || targetRoleInput || 'Software Engineer';
    const effectiveMissing =
      missingSkills && missingSkills.length > 0 ? missingSkills : missingSkillsFocus;

    if (effectiveMissing.length > 0) {
      setGenerationStatus(
        `Targeting missing skills: ${effectiveMissing.slice(0, 3).join(', ')} for ${targetCo}...`
      );
    } else {
      setGenerationStatus('Synthesizing high-velocity roadmap with Gemini Ultra-Fast Engine...');
    }

    try {
      setTimeout(() => {
        setGenerationStatus('Calibrating skill timelines (Easy: 1-2 wks, Medium: 3-6 wks, Hard: 8-12 wks)...');
      }, 700);

      setTimeout(() => {
        setGenerationStatus('Curating YouTube deep-dives & official documentation links...');
      }, 1500);

      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicationId || undefined,
          companyName: targetCo,
          roleTitle: targetRo,
          missingSkills: effectiveMissing.length > 0 ? effectiveMissing : undefined,
          forceRegenerate,
        }),
      });

      const data = await res.json();
      if (data.roadmap) {
        const newRoadmap: CandidateRoadmap = {
          id: data.roadmap.id,
          studentId: data.roadmap.student_id || data.roadmap.studentId,
          applicationId: data.roadmap.application_id || applicationId,
          companyName: data.roadmap.company_name || targetCo,
          roleTitle: data.roadmap.role_title || targetRo,
          targetRole: data.roadmap.target_role || targetRo,
          totalDurationWeeks: data.roadmap.total_duration_weeks || data.roadmap.totalDurationWeeks || 8,
          missingSkills: data.roadmap.missing_skills || data.roadmap.missingSkills || effectiveMissing,
          milestones: data.roadmap.milestones || [],
          createdAt: data.roadmap.created_at || new Date().toISOString(),
        };

        setRoadmaps((prev) => [newRoadmap, ...prev.filter((r) => r.id !== newRoadmap.id)]);
        setActiveRoadmap(newRoadmap);

        // Preload first milestone problem into Monaco coding workspace
        if (newRoadmap.milestones && newRoadmap.milestones.length > 0) {
          const firstMs = newRoadmap.milestones[0];
          if (firstMs.curatedProblems && firstMs.curatedProblems.length > 0) {
            const prob = firstMs.curatedProblems[0];
            setActiveProblem(prob);
            setCode(prob.starterCode[language] || prob.starterCode.python);
            setOutput(`🎯 Targeted Remediation: Loaded challenge "${prob.title}" for missing skill "${firstMs.skillName}". Practice ready in Monaco!`);
          }
        }
      } else {
        alert(data.error || 'Failed to generate roadmap');
      }
    } catch (err: any) {
      alert(`Error generating roadmap: ${err.message}`);
    }

    setGenerating(false);
    setGenerationStatus('');
  };

  const handleSelectProblem = (prob: PracticeProblem) => {
    setActiveProblem(prob);
    setCode(prob.starterCode[language] || prob.starterCode.python);
    setOutput(`Loaded NeetCode/Blind 75: ${prob.title} (${prob.difficulty})`);
    setTestResults(null);
    setSelectedTestCaseIdx(0);
    setActiveTab('sandbox');
  };

  const handlePracticeMilestone = (milestone: RoadmapMilestone) => {
    if (milestone.curatedProblems && milestone.curatedProblems.length > 0) {
      handleSelectProblem(milestone.curatedProblems[0]);
    } else if (milestone.starterCodeSnippet) {
      const targetLang = milestone.language || 'python';
      setLanguage(targetLang);
      setCode(milestone.starterCodeSnippet);
      setOutput(`Loaded project starter for: ${milestone.skillName}`);
      setActiveTab('sandbox');
    } else {
      setActiveTab('sandbox');
    }
  };

  const handleLanguageChange = (newLang: 'python' | 'javascript' | 'cpp' | 'java') => {
    setLanguage(newLang);
    setCode(activeProblem.starterCode[newLang] || '');
    setTestResults(null);
  };

  const handleResetCode = () => {
    setCode(activeProblem.starterCode[language] || '');
    setTestResults(null);
    setOutput('Reset code back to starter template.');
  };

  const handleInsertSolution = () => {
    if (confirm('Replace your current code with the reference editorial solution?')) {
      setCode(activeProblem.referenceSolution[language] || '');
      setShowSolutionModal(false);
      setOutput('Loaded reference editorial solution into editor.');
    }
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setOutput('Compiling and executing code on zero-cost runner...');

    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          sourceCode: code,
        }),
      });

      const data = await res.json();
      if (data.run) {
        setOutput(data.run.output || 'Execution complete (no output returned).');
      } else if (data.error) {
        setOutput(`Error: ${data.error}`);
      } else {
        setOutput(JSON.stringify(data, null, 2));
      }
    } catch (err: any) {
      setOutput(`Failed to execute: ${err.message}`);
    }
    setExecuting(false);
  };

  const handleRunTests = async () => {
    setExecuting(true);
    setOutput('Evaluating code against LeetCode test cases...');
    setTestResults(null);

    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          sourceCode: code,
          functionName: activeProblem.functionName,
          testCases: activeProblem.testCases,
        }),
      });

      const data = await res.json();
      if (data.run?.testResults) {
        setTestResults(data.run.testResults);
        setOutput(data.run.output);
      } else if (data.run?.output) {
        setOutput(data.run.output);
      } else if (data.error) {
        setOutput(`Grading Error: ${data.error}`);
      }
    } catch (err: any) {
      setOutput(`Execution failed: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const getDifficultyBadge = (diff: SkillDifficulty, duration: number, hours: number) => {
    switch (diff) {
      case 'HARD':
        return (
          <Badge className="bg-rose-950 text-rose-300 border border-rose-800 text-[11px] font-semibold">
            HARD • {duration} Weeks (~{hours} hrs)
          </Badge>
        );
      case 'MEDIUM':
        return (
          <Badge className="bg-amber-950 text-amber-300 border border-amber-800 text-[11px] font-semibold">
            MEDIUM • {duration} Weeks (~{hours} hrs)
          </Badge>
        );
      case 'EASY':
      default:
        return (
          <Badge className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[11px] font-semibold">
            EASY • {duration} Weeks (~{hours} hrs)
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/student" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                &larr; Back to Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
              Native Remediation Studio &amp; AI Roadmap
            </h1>
            <p className="text-sm text-slate-400">
              Personalized Skill Gap Remediation • Calibrated Timelines • Interactive Code Sandbox
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/student/drives">
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Drives
              </Button>
            </Link>
            <Link href="/student/live-status">
              <Button variant="outline" size="sm" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Live Status
              </Button>
            </Link>
          </div>
        </header>

        {/* Missing Skills Targeted Remediation Banner */}
        {missingSkillsFocus.length > 0 && (
          <div className="rounded-xl border border-indigo-600/50 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/60 p-4 shadow-lg text-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <h3 className="text-sm font-bold text-indigo-200">
                  Targeted Skill Remediation for {targetCompanyInput || 'Placement Drive'} ({targetRoleInput || 'Target Role'})
                </h3>
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
                  {missingSkillsFocus.length} Missing Gaps
                </Badge>
              </div>
              <p className="text-xs text-slate-300">
                Roadmap calibrated specifically to bridge the exact technical competencies missing from your resume:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {missingSkillsFocus.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-amber-950/80 border border-amber-600/60 px-2.5 py-0.5 text-[11px] text-amber-200 font-medium"
                  >
                    ⚠️ {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  handleGenerateRoadmap(
                    urlAppId || undefined,
                    targetCompanyInput,
                    targetRoleInput,
                    true,
                    missingSkillsFocus
                  )
                }
                disabled={generating}
                className="border-indigo-700 text-indigo-300 hover:bg-indigo-950 text-xs h-8"
              >
                🔄 Re-Generate
              </Button>
              <Button
                size="sm"
                onClick={() => setActiveTab('sandbox')}
                className="bg-indigo-600 hover:bg-indigo-500 text-xs h-8 font-semibold"
              >
                💻 Open Monaco Studio
              </Button>
            </div>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('roadmap')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'roadmap'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>🗺️</span> Skill Remediation Roadmaps
            {roadmaps.length > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                {roadmaps.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`pb-3 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'sandbox'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>💻</span> Curated LeetCode Studio
            <Badge variant="outline" className="text-[10px] border-emerald-500/60 text-emerald-400 bg-emerald-950/40">
              Blind 75
            </Badge>
          </button>
        </div>

        {/* ===================== TAB 1: ROADMAP STUDIO ===================== */}
        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {/* Quick Generator Bar for Rejected Application or Custom Role */}
            <Card className="border-slate-800 bg-slate-900 text-slate-100 p-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-200">Generate Upskilling Roadmap</h3>
                  <p className="text-xs text-slate-400">
                    AI analyzes your interview feedback and builds a difficulty-calibrated timeline with curated YouTube tutorials and official docs.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                  <Input
                    placeholder="Company (e.g. Google, TCS)"
                    value={targetCompanyInput}
                    onChange={(e) => setTargetCompanyInput(e.target.value)}
                    className="h-8 text-xs bg-slate-950 border-slate-800 w-36"
                  />
                  <Input
                    placeholder="Role (e.g. Backend SDE)"
                    value={targetRoleInput}
                    onChange={(e) => setTargetRoleInput(e.target.value)}
                    className="h-8 text-xs bg-slate-950 border-slate-800 w-36"
                  />
                  <Button
                    onClick={() => handleGenerateRoadmap(undefined, targetCompanyInput, targetRoleInput, true, missingSkillsFocus)}
                    disabled={generating || !targetCompanyInput.trim() || !targetRoleInput.trim()}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-500 text-xs h-8 text-white gap-1"
                  >
                    {generating ? 'Generating...' : '🚀 Generate Roadmap'}
                  </Button>
                </div>
              </div>

              {generating && (
                <div className="mt-3 p-3 rounded bg-indigo-950/40 border border-indigo-800/60 flex items-center gap-3">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent" />
                  <span className="text-xs text-indigo-300 font-medium animate-pulse">
                    {generationStatus}
                  </span>
                </div>
              )}
            </Card>

            {/* Diagnostic Feedback from Past Drives */}
            {feedbackHistory.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs uppercase font-semibold text-slate-400">Past Drive Rejection Feedback &amp; Diagnostics</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {feedbackHistory.map((item, idx) => (
                    <Card key={idx} className="border-slate-800 bg-slate-900/80 text-slate-100">
                      <CardContent className="p-3.5 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-200">
                            {item.placement_drives?.company_name} • {item.placement_drives?.role_title}
                          </span>
                          <Badge variant="outline" className="text-rose-400 border-rose-800/60 text-[10px]">
                            {item.stage}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-300 italic line-clamp-2">
                          "{item.ai_feedback_summary}"
                        </p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleGenerateRoadmap(item.id, item.placement_drives?.company_name, item.placement_drives?.role_title)}
                          className="text-[11px] text-indigo-400 hover:text-indigo-300 p-0 h-auto"
                        >
                          Generate Roadmap from this feedback &rarr;
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Roadmap Switcher Pill Bar */}
            {roadmaps.length > 0 && (
              <div className="space-y-2 p-3 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs uppercase font-bold text-slate-300 tracking-wider flex items-center gap-1.5">
                    <span>📚</span>
                    <span>Your Saved Career Roadmaps ({roadmaps.length})</span>
                  </span>
                  {activeRoadmap && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={generating}
                      onClick={() => handleGenerateRoadmap(activeRoadmap.applicationId, activeRoadmap.companyName, activeRoadmap.roleTitle, true)}
                      className="h-7 text-[11px] border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 flex items-center gap-1"
                    >
                      <span>🔄</span>
                      <span>Regenerate Active Plan</span>
                    </Button>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {roadmaps.map((rm) => {
                    const isActive = activeRoadmap?.id === rm.id;
                    return (
                      <button
                        key={rm.id}
                        type="button"
                        onClick={() => setActiveRoadmap(rm)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${
                          isActive
                            ? 'bg-indigo-950 border-indigo-500 text-indigo-200 shadow-lg ring-1 ring-indigo-500/50'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                        }`}
                      >
                        <span>{isActive ? '📌' : '📄'}</span>
                        <span className="font-bold text-slate-100">{rm.companyName}</span>
                        <span className="text-[10px] text-indigo-300 font-mono">({rm.roleTitle})</span>
                        {isActive && (
                          <Badge className="bg-indigo-600 text-[9px] px-1.5 py-0 h-4">
                            Active
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Roadmap View */}
            {activeRoadmap ? (
              <div className="space-y-6">
                {/* Roadmap Summary Header */}
                <Card className="border-indigo-900/60 bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 text-slate-100 p-5">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-indigo-600 text-[11px]">Active Plan</Badge>
                        <span className="text-xs text-slate-400">Target Role</span>
                      </div>
                      <h2 className="text-2xl font-bold text-slate-100 mt-1">
                        {activeRoadmap.companyName} • {activeRoadmap.roleTitle}
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Targeted Remediation Plan based on Real Market Feedback
                      </p>
                    </div>

                    <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 p-3 rounded-lg">
                      <div className="text-center px-2">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Total Time</div>
                        <div className="text-lg font-extrabold text-indigo-400">
                          {activeRoadmap.totalDurationWeeks} Weeks
                        </div>
                      </div>
                      <div className="h-8 w-px bg-slate-800" />
                      <div className="text-center px-2">
                        <div className="text-xs text-slate-400 uppercase font-semibold">Milestones</div>
                        <div className="text-lg font-extrabold text-emerald-400">
                          {activeRoadmap.milestones.length}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Missing Skills Tags */}
                  {activeRoadmap.missingSkills && activeRoadmap.missingSkills.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/80">
                      <span className="text-xs text-slate-400 mr-2 font-semibold">Identified Skill Deficits:</span>
                      <div className="inline-flex flex-wrap gap-1.5 mt-1">
                        {activeRoadmap.missingSkills.map((sk, i) => (
                          <Badge key={i} variant="outline" className="text-rose-400 border-rose-900/80 bg-rose-950/30 text-[10px]">
                            {sk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {/* Milestones Timeline */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    Sequential Learning Path &amp; Milestones
                  </h3>

                  {activeRoadmap.milestones.map((ms: RoadmapMilestone, idx: number) => (
                    <Card key={idx} className="border-slate-800 bg-slate-900/90 text-slate-100 overflow-hidden">
                      <div className="p-5 space-y-4">
                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-400 font-extrabold text-xs border border-indigo-500/40">
                              {ms.milestoneNumber || idx + 1}
                            </span>
                            <div>
                              <h4 className="text-base font-bold text-slate-100">{ms.skillName}</h4>
                              <span className="text-[11px] text-slate-400">{ms.category}</span>
                            </div>
                          </div>
                          <div>
                            {getDifficultyBadge(ms.difficulty, ms.durationWeeks, ms.estimatedHours)}
                          </div>
                        </div>

                        {/* Description & Topics */}
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {ms.description}
                        </p>

                        {ms.topics && ms.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ms.topics.map((t, ti) => (
                              <span key={ti} className="text-[11px] bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                                • {t}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Curated Resources: YouTube & Official Docs */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                          {/* YouTube Tutorials */}
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400">
                              <span>▶️</span> Curated YouTube Deep Dives
                            </div>
                            <div className="space-y-1.5">
                              {ms.youtubeResources && ms.youtubeResources.length > 0 ? (
                                ms.youtubeResources.map((yt, yi) => (
                                  <a
                                    key={yi}
                                    href={yt.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-2 rounded bg-slate-900 hover:bg-slate-850 text-xs text-slate-200 hover:text-white border border-slate-800 transition-colors"
                                  >
                                    <div className="font-medium line-clamp-1">{yt.title}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">Channel: {yt.source} &bull; Watch on YouTube &rarr;</div>
                                  </a>
                                ))
                              ) : (
                                <p className="text-[11px] text-slate-500">Video guides listed in syllabus.</p>
                              )}
                            </div>
                          </div>

                          {/* Documentation Links */}
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2">
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-400">
                              <span>📖</span> Official Documentation &amp; Reference
                            </div>
                            <div className="space-y-1.5">
                              {ms.documentationResources && ms.documentationResources.length > 0 ? (
                                ms.documentationResources.map((doc, di) => (
                                  <a
                                    key={di}
                                    href={doc.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-2 rounded bg-slate-900 hover:bg-slate-850 text-xs text-slate-200 hover:text-white border border-slate-800 transition-colors"
                                  >
                                    <div className="font-medium line-clamp-1">{doc.title}</div>
                                    <div className="text-[10px] text-slate-400 mt-0.5">{doc.source} &bull; Read Docs &rarr;</div>
                                  </a>
                                ))
                              ) : (
                                <p className="text-[11px] text-slate-500">Reference specs available.</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Curated Blind 75 / NeetCode Practice Problems */}
                        {ms.curatedProblems && ms.curatedProblems.length > 0 && (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                                <span>🧩</span>
                                <span>Curated NeetCode / Blind 75 Coding Challenges</span>
                              </span>
                              <span className="text-[10px] text-slate-500">{ms.curatedProblems.length} challenges</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ms.curatedProblems.map((prob: PracticeProblem) => (
                                <div
                                  key={prob.id}
                                  onClick={() => handleSelectProblem(prob)}
                                  className="rounded-md border border-slate-800/80 bg-slate-900 p-2.5 hover:border-indigo-500/60 hover:bg-slate-850 cursor-pointer transition flex items-center justify-between"
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-semibold text-slate-200">{prob.title}</span>
                                      <Badge
                                        variant="outline"
                                        className={`text-[9px] px-1 py-0 ${
                                          prob.difficulty === 'Easy'
                                            ? 'border-emerald-600/60 text-emerald-300'
                                            : prob.difficulty === 'Medium'
                                            ? 'border-amber-600/60 text-amber-300'
                                            : 'border-rose-600/60 text-rose-300'
                                        }`}
                                      >
                                        {prob.difficulty}
                                      </Badge>
                                    </div>
                                    <span className="text-[10px] text-slate-500 block mt-0.5">{prob.topicTag}</span>
                                  </div>
                                  <Button size="sm" variant="ghost" className="h-6 text-[11px] text-indigo-400 hover:text-indigo-300 p-0">
                                    Solve in Monaco →
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Practical Portfolio Project & Sandbox CTA */}
                        {ms.practicalProject && (
                          <div className="rounded-lg border border-indigo-900/50 bg-indigo-950/20 p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">
                                Portfolio Project Challenge
                              </span>
                              <p className="text-xs text-slate-200 font-medium mt-0.5">
                                {ms.practicalProject}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handlePracticeMilestone(ms)}
                              className="bg-indigo-600 hover:bg-indigo-500 text-xs shrink-0 gap-1.5"
                            >
                              <span>⚡</span> Practice in Sandbox
                            </Button>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="border-slate-800 bg-slate-900 p-12 text-center text-slate-400 space-y-3">
                <div className="text-3xl">🗺️</div>
                <h4 className="text-base font-semibold text-slate-200">No Roadmaps Generated Yet</h4>
                <p className="text-xs max-w-md mx-auto">
                  Click "Generate Roadmap" above or select one of your past drive applications to build an AI-powered study timeline.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* ===================== TAB 2: CURATED LEETCODE MONACO STUDIO ===================== */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Problem List & Problem Description (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Problem Selector Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h2 className="text-xs uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                    <span>🧩</span>
                    <span>Curated Blind 75 / NeetCode 150</span>
                  </h2>
                  <span className="text-[11px] text-indigo-400 font-medium">
                    {CURATED_PRACTICE_PROBLEMS.length} Problems
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-slate-950/50 rounded-lg border border-slate-800/80">
                  {CURATED_PRACTICE_PROBLEMS.map((prob) => {
                    const isSelected = activeProblem.id === prob.id;
                    return (
                      <button
                        key={prob.id}
                        type="button"
                        onClick={() => handleSelectProblem(prob)}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-md border transition text-left flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <span>{prob.title}</span>
                        <span
                          className={`text-[9px] px-1 py-0 rounded ${
                            prob.difficulty === 'Easy'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : prob.difficulty === 'Medium'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                              : 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          }`}
                        >
                          {prob.difficulty}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Problem Workspace */}
              <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-xl overflow-hidden">
                <CardHeader className="p-4 pb-3 border-b border-slate-800/80 bg-slate-950/40">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-bold ${
                            activeProblem.difficulty === 'Easy'
                              ? 'border-emerald-600/60 text-emerald-400 bg-emerald-950/30'
                              : activeProblem.difficulty === 'Medium'
                              ? 'border-amber-600/60 text-amber-400 bg-amber-950/30'
                              : 'border-rose-600/60 text-rose-400 bg-rose-950/30'
                          }`}
                        >
                          {activeProblem.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px] bg-slate-800 text-slate-300">
                          {activeProblem.topicTag}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg font-bold text-slate-100 mt-2">
                        {activeProblem.title}
                      </CardTitle>
                    </div>

                    <a
                      href={activeProblem.leetcodeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 border border-amber-600/40 bg-amber-950/30 px-2 py-1 rounded transition hover:border-amber-500"
                    >
                      <span>LeetCode</span>
                      <span>↗</span>
                    </a>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-4 max-h-[520px] overflow-y-auto text-xs text-slate-300 leading-relaxed font-sans">
                  <div className="whitespace-pre-wrap">{activeProblem.description}</div>

                  {activeProblem.testCases && activeProblem.testCases.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/80 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Sample Public Test Cases
                      </span>
                      {activeProblem.testCases.slice(0, 2).map((tc, idx) => (
                        <div key={idx} className="bg-slate-950 p-2.5 rounded border border-slate-800/80 font-mono text-[11px] space-y-1">
                          <div className="text-slate-400">
                            <span className="text-indigo-400">Input:</span> {tc.inputDisplay}
                          </div>
                          <div className="text-emerald-400">
                            <span className="text-slate-400">Expected:</span> {JSON.stringify(tc.expected)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Monaco Code Editor & Test Runner Console (7 cols) */}
            <div className="lg:col-span-7 space-y-4">
              {/* Studio Header & Action Bar */}
              <div className="flex flex-wrap justify-between items-center bg-slate-900 p-3 rounded-t-xl border border-slate-800 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-300">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="java">Java 21 (OpenJDK)</option>
                    <option value="python">Python 3.12 (CPython)</option>
                    <option value="javascript">Node.js 20 (Local V8)</option>
                    <option value="cpp">C++20 (GCC 13 Wandbox)</option>
                  </select>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleResetCode}
                    className="h-7 text-[11px] text-slate-400 hover:text-slate-200"
                  >
                    ↺ Reset Template
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSolutionModal(true)}
                    className="h-7 text-[11px] text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 border border-amber-600/30"
                  >
                    💡 Solution
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRunCode}
                    disabled={executing}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-200 hover:bg-slate-800 text-xs h-8"
                  >
                    Run Code
                  </Button>

                  <Button
                    onClick={handleRunTests}
                    disabled={executing}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-500 font-semibold text-white text-xs h-8 shadow flex items-center gap-1.5"
                  >
                    <span>🧪</span>
                    <span>{executing ? 'Judging...' : 'Run LeetCode Tests'}</span>
                  </Button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="border-x border-slate-800 overflow-hidden bg-[#1e1e1e]">
                <Editor
                  height="380px"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                  }}
                />
              </div>

              {/* LeetCode Test Case Results & Console */}
              <div className="rounded-b-xl border border-slate-800 bg-slate-900 p-4 space-y-3 shadow-lg">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Test Results &amp; Console Output
                  </span>

                  {testResults && (
                    <div className="flex items-center gap-1.5">
                      {testResults.map((tr, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setSelectedTestCaseIdx(idx)}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold transition ${
                            selectedTestCaseIdx === idx
                              ? tr.passed
                                ? 'bg-emerald-600 text-white'
                                : 'bg-rose-600 text-white'
                              : tr.passed
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
                              : 'bg-rose-950/80 text-rose-300 border border-rose-800/80'
                          }`}
                        >
                          {tr.passed ? '✓' : '✗'} Case {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Test Case Inspection Panel */}
                {testResults && testResults[selectedTestCaseIdx] && (
                  <div className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-2 font-mono text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-800/80">
                      <span className="font-bold flex items-center gap-1.5">
                        {testResults[selectedTestCaseIdx].passed ? (
                          <span className="text-emerald-400">✅ Test Case {selectedTestCaseIdx + 1}: Passed</span>
                        ) : (
                          <span className="text-rose-400">❌ Test Case {selectedTestCaseIdx + 1}: Failed</span>
                        )}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {testResults[selectedTestCaseIdx].runtimeMs}ms
                      </span>
                    </div>

                    <div className="space-y-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">Input:</span>{' '}
                        <span className="text-slate-300">{testResults[selectedTestCaseIdx].input}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expected:</span>{' '}
                        <span className="text-emerald-400">
                          {JSON.stringify(testResults[selectedTestCaseIdx].expected)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">Your Output:</span>{' '}
                        <span className={testResults[selectedTestCaseIdx].passed ? 'text-emerald-400' : 'text-rose-400'}>
                          {testResults[selectedTestCaseIdx].error
                            ? `Runtime Error: ${testResults[selectedTestCaseIdx].error}`
                            : JSON.stringify(testResults[selectedTestCaseIdx].actual)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Standard Console Output */}
                <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap bg-slate-950 p-3 rounded-lg border border-slate-800/80 max-h-32 overflow-y-auto">
                  {output || 'Click "Run LeetCode Tests" to evaluate your solution against test cases.'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* Reference Editorial Solution Modal */}
        <Dialog open={showSolutionModal} onOpenChange={setShowSolutionModal}>
          <DialogContent className="max-w-2xl bg-slate-900 border-slate-800 text-slate-100 p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-base font-bold text-amber-300 flex items-center gap-2">
                    <span>💡 Reference Editorial Solution:</span>
                    <span>{activeProblem.title}</span>
                  </DialogTitle>
                  <p className="text-xs text-slate-400 mt-1">
                    Language: <span className="text-indigo-400 font-mono uppercase font-semibold">{language}</span>
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-3">
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto max-h-80 leading-relaxed">
                {activeProblem.referenceSolution?.[language] || 'No reference solution available for this language.'}
              </pre>

              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(activeProblem.referenceSolution?.[language] || '');
                    alert('Copied solution to clipboard!');
                  }}
                  className="border-slate-700 text-xs text-slate-300 hover:bg-slate-800"
                >
                  📋 Copy Solution
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSolutionModal(false)}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Close
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleInsertSolution}
                    className="bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold"
                  >
                    Insert into Editor
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default function StudentRemediationStudio() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-100">Loading Remediation Studio...</div>}>
      <RemediationStudioContent />
    </Suspense>
  );
}

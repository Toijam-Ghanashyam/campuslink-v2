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
import { CandidateRoadmap, RoadmapMilestone, SkillDifficulty } from '@/types/roadmap';

// Dynamically import Monaco Editor to avoid SSR hydration mismatch
const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const STARTER_CHALLENGES = [
  {
    id: 'cs-dsa-1',
    title: 'Two Sum & In-Memory Indexing',
    difficulty: 'Easy',
    topic: 'Data Structures & Algorithms',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. Optimize for O(N) runtime.',
    starterCode: {
      python: `def two_sum(nums, target):\n    # Write your solution here\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))`,
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\nconsole.log(twoSum([2, 7, 11, 15], 9));`,
      cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\n\nint main() {\n    std::cout << "[0, 1]" << std::endl;\n    return 0;\n}`,
    },
  },
  {
    id: 'cs-db-1',
    title: 'Idempotent Retry & Dead-Letter Queue Logic',
    difficulty: 'Medium',
    topic: 'Backend Systems & Concurrency',
    description:
      'Simulate an idempotent task handler: Given a duplicate event payload with unique UUID, acknowledge without executing duplicate side-effects.',
    starterCode: {
      python: `processed_ids = set()\n\ndef process_event(event_id, payload):\n    if event_id in processed_ids:\n        return "SKIPPED_IDEMPOTENT"\n    processed_ids.add(event_id)\n    return f"PROCESSED: {payload}"\n\nprint(process_event("evt_1", "UserRegistered"))\nprint(process_event("evt_1", "UserRegistered"))`,
      javascript: `const processed = new Set();\nfunction processEvent(id, data) {\n  if (processed.has(id)) return "SKIPPED_IDEMPOTENT";\n  processed.add(id);\n  return \`PROCESSED: \${data}\`;\n}\nconsole.log(processEvent("evt_1", "UserRegistered"));\nconsole.log(processEvent("evt_1", "UserRegistered"));`,
      cpp: `// Idempotency simulation\n#include <iostream>\nint main() {\n    std::cout << "PROCESSED\\nSKIPPED_IDEMPOTENT\\n";\n    return 0;\n}`,
    },
  },
];

function RemediationStudioContent() {
  const searchParams = useSearchParams();
  const urlAppId = searchParams.get('appId');
  const urlDriveTitle = searchParams.get('driveTitle');
  const urlRole = searchParams.get('role');

  const [activeTab, setActiveTab] = useState<'roadmap' | 'sandbox'>('roadmap');
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<CandidateRoadmap[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<CandidateRoadmap | null>(null);
  const [generating, setGenerating] = useState<boolean>(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  // Monaco Sandbox State
  const [activeChallenge, setActiveChallenge] = useState(STARTER_CHALLENGES[0]);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp'>('python');
  const [code, setCode] = useState<string>(activeChallenge.starterCode.python);
  const [output, setOutput] = useState<string>('');
  const [executing, setExecuting] = useState<boolean>(false);

  // Custom Generator form state
  const [targetCompanyInput, setTargetCompanyInput] = useState<string>(urlDriveTitle || '');
  const [targetRoleInput, setTargetRoleInput] = useState<string>(urlRole || '');

  const supabase = createClient();

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

        // 3. Auto-trigger generation if navigating with appId from rejection CTA
        if (urlAppId) {
          handleGenerateRoadmap(urlAppId, urlDriveTitle || undefined, urlRole || undefined);
        }
      }
    }
    initData();
  }, [urlAppId]);

  const handleGenerateRoadmap = async (applicationId?: string, companyName?: string, roleTitle?: string) => {
    setGenerating(true);
    setActiveTab('roadmap');
    setGenerationStatus('Synthesizing high-velocity roadmap with Gemini Ultra-Fast Engine...');

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
          companyName: companyName || targetCompanyInput || 'Tech Enterprise',
          roleTitle: roleTitle || targetRoleInput || 'Software Engineer',
        }),
      });

      const data = await res.json();
      if (data.roadmap) {
        const newRoadmap: CandidateRoadmap = {
          id: data.roadmap.id,
          studentId: data.roadmap.student_id || data.roadmap.studentId,
          applicationId: data.roadmap.application_id || applicationId,
          companyName: data.roadmap.company_name || companyName || targetCompanyInput,
          roleTitle: data.roadmap.role_title || roleTitle || targetRoleInput,
          targetRole: data.roadmap.target_role || roleTitle || targetRoleInput,
          totalDurationWeeks: data.roadmap.total_duration_weeks || data.roadmap.totalDurationWeeks || 8,
          missingSkills: data.roadmap.missing_skills || data.roadmap.missingSkills || [],
          milestones: data.roadmap.milestones || [],
          pri_snapshot: data.roadmap.pri_snapshot || data.roadmap.priSnapshot,
          priSnapshot: data.roadmap.pri_snapshot || data.roadmap.priSnapshot,
          createdAt: data.roadmap.created_at || new Date().toISOString(),
        };

        setRoadmaps((prev) => [newRoadmap, ...prev.filter((r) => r.id !== newRoadmap.id)]);
        setActiveRoadmap(newRoadmap);
      } else {
        alert(data.error || 'Failed to generate roadmap');
      }
    } catch (err: any) {
      alert(`Error generating roadmap: ${err.message}`);
    }

    setGenerating(false);
    setGenerationStatus('');
  };

  const handlePracticeMilestone = (milestone: RoadmapMilestone) => {
    if (milestone.starterCodeSnippet) {
      const targetLang = milestone.language || 'python';
      setLanguage(targetLang);
      setCode(milestone.starterCodeSnippet);
      setActiveChallenge({
        id: `milestone-${milestone.milestoneNumber}`,
        title: `${milestone.skillName} (Milestone #${milestone.milestoneNumber})`,
        difficulty: milestone.difficulty,
        topic: milestone.category,
        description: milestone.practicalProject || milestone.description,
        starterCode: {
          python: milestone.starterCodeSnippet,
          javascript: milestone.starterCodeSnippet,
          cpp: '// Implement challenge in C++',
        },
      });
      setOutput(`Loaded project sandbox for: ${milestone.skillName}`);
      setActiveTab('sandbox');
    } else {
      setActiveTab('sandbox');
    }
  };

  const handleSelectChallenge = (challenge: typeof STARTER_CHALLENGES[0]) => {
    setActiveChallenge(challenge);
    setCode(challenge.starterCode[language] || challenge.starterCode.python);
    setOutput('');
  };

  const handleLanguageChange = (newLang: 'python' | 'javascript' | 'cpp') => {
    setLanguage(newLang);
    setCode(activeChallenge.starterCode[newLang] || '');
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setOutput('Compiling and executing against test sandbox...');

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
            <span>💻</span> Monaco Practice Sandbox
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
                    onClick={() => handleGenerateRoadmap(urlAppId || undefined)}
                    disabled={generating}
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

                {/* Skill Vector Gap Matrix (PRI Delta) */}
                {(() => {
                  const snapshot: any = activeRoadmap.pri_snapshot || activeRoadmap.priSnapshot;
                  if (!snapshot) return null;

                  const vectorDeltas = snapshot.vectorDelta || snapshot.vector_delta || [];
                  const studentVec = snapshot.studentVector || snapshot.student_vector || {};
                  const roleVec = snapshot.roleVector || snapshot.role_vector || {};

                  return (
                    <Card className="border-indigo-900/60 bg-slate-900/90 text-slate-100 p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-600 text-[10px]">PRI Delta Analysis</Badge>
                            <h3 className="text-base font-bold text-slate-100">
                              Candidate Skill Vector vs Role Benchmark
                            </h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            Mathematical gap analysis across 8 core engineering dimensions. Positive delta (&Delta;) denotes required upskilling.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-right">
                            <span className="text-[10px] text-slate-400 block uppercase font-medium">PRI Score</span>
                            <span className="text-base font-extrabold text-amber-400">
                              {snapshot.priScore ?? snapshot.pri_score ?? '--'}%
                            </span>
                          </div>
                          {snapshot.cosineSimilarity !== undefined && (
                            <div className="px-3 py-1.5 rounded bg-slate-950 border border-slate-800 text-right">
                              <span className="text-[10px] text-slate-400 block uppercase font-medium">Cosine Match</span>
                              <span className="text-base font-mono font-bold text-indigo-400">
                                {(Number(snapshot.cosineSimilarity) * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 3 Pillars Score Strip */}
                      {(snapshot.eAcademic !== undefined || snapshot.e_academic !== undefined) && (
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Academic Pillar (20%)</span>
                            <span className="text-sm font-bold text-indigo-300">
                              {snapshot.eAcademic ?? snapshot.e_academic} / 100
                            </span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">Practical Projects (50%)</span>
                            <span className="text-sm font-bold text-indigo-300">
                              {snapshot.ePractical ?? snapshot.e_practical} / 100
                            </span>
                          </div>
                          <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800/80">
                            <span className="text-[10px] text-slate-400 uppercase block font-semibold">CS Fundamentals (30%)</span>
                            <span className="text-sm font-bold text-indigo-300">
                              {snapshot.eEval ?? snapshot.e_eval} / 100
                            </span>
                          </div>
                        </div>
                      )}

                      {/* 8-Dimension Vector Comparison Bars */}
                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                          <span>Skill Dimension</span>
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-slate-500 inline-block" /> Role Benchmark (V_role)
                            </span>
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-indigo-500 inline-block" /> Candidate Evaluated (V_s)
                            </span>
                            <span>Delta Gap</span>
                          </div>
                        </div>

                        <div className="space-y-2.5">
                          {vectorDeltas.map((item: any, idx: number) => {
                            const roleVal = Number(item.roleScore ?? roleVec[item.key] ?? 7);
                            const studentVal = Number(item.studentScore ?? studentVec[item.key] ?? 0);
                            const delta = Number(item.delta ?? (roleVal - studentVal));
                            const hasDeficit = delta > 0;

                            return (
                              <div
                                key={idx}
                                className={`p-2.5 rounded-lg border transition-colors ${
                                  hasDeficit
                                    ? 'bg-rose-950/15 border-rose-900/40'
                                    : 'bg-slate-950/60 border-slate-800/80'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-semibold text-slate-200">{item.label}</span>
                                    <span className="text-[10px] font-mono text-slate-500">({item.key})</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">
                                      Candidate: <strong className="text-indigo-300">{studentVal}/10</strong> vs Role: <strong className="text-slate-300">{roleVal}/10</strong>
                                    </span>
                                    <Badge
                                      className={`text-[10px] px-2 py-0.5 font-bold ${
                                        hasDeficit
                                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                      }`}
                                    >
                                      {hasDeficit ? `+${delta.toFixed(1)} Deficit` : '✓ Benchmark Met'}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Stacked Visual Comparison Track */}
                                <div className="space-y-1">
                                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden flex">
                                    <div
                                      className={`h-full transition-all rounded-full ${hasDeficit ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                      style={{ width: `${Math.min(100, (studentVal / 10) * 100)}%` }}
                                      title={`Candidate: ${studentVal}/10`}
                                    />
                                  </div>
                                  <div className="w-full bg-slate-950/60 rounded-full h-1 overflow-hidden">
                                    <div
                                      className="bg-slate-600 h-full rounded-full"
                                      style={{ width: `${Math.min(100, (roleVal / 10) * 100)}%` }}
                                      title={`Target Benchmark: ${roleVal}/10`}
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-800/80">
                        ⚡ The sequential milestones below have been dynamically prioritized to eliminate the highest deficit gaps first.
                      </div>
                    </Card>
                  );
                })()}

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

        {/* ===================== TAB 2: MONACO CODE SANDBOX ===================== */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Challenges Panel */}
            <div className="space-y-3">
              <h2 className="text-xs uppercase font-semibold text-slate-400">Curated Practice Modules</h2>
              {STARTER_CHALLENGES.map((ch) => (
                <Card
                  key={ch.id}
                  onClick={() => handleSelectChallenge(ch)}
                  className={`cursor-pointer transition-colors border-slate-800 ${
                    activeChallenge.id === ch.id ? 'bg-indigo-950/40 border-indigo-600' : 'bg-slate-900 hover:bg-slate-850'
                  }`}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary" className="text-[10px]">{ch.topic}</Badge>
                      <span className="text-[10px] text-amber-400 font-medium">{ch.difficulty}</span>
                    </div>
                    <CardTitle className="text-sm font-bold text-slate-100 mt-2">{ch.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 text-xs text-slate-400 line-clamp-2">
                    {ch.description}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Monaco Interactive Sandbox & Console */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex justify-between items-center bg-slate-900 p-3 rounded-t-lg border border-slate-800">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-slate-300">Language:</span>
                  <select
                    value={language}
                    onChange={(e) => handleLanguageChange(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded px-2.5 py-1"
                  >
                    <option value="python">Python 3.10</option>
                    <option value="javascript">Node.js 18</option>
                    <option value="cpp">C++ (GCC 10)</option>
                  </select>
                </div>

                <Button
                  onClick={handleRunCode}
                  disabled={executing}
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-xs h-8"
                >
                  {executing ? 'Executing Sandbox...' : 'Run Code'}
                </Button>
              </div>

              <div className="border border-slate-800 rounded-b-lg overflow-hidden bg-[#1e1e1e]">
                <Editor
                  height="340px"
                  language={language}
                  theme="vs-dark"
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              </div>

              {/* Execution Console Output */}
              <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                  Sandbox Console Output
                </span>
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre-wrap bg-slate-950 p-3 rounded border border-slate-800/80 max-h-36 overflow-y-auto">
                  {output || 'Click "Run Code" to compile and execute output against test runners.'}
                </pre>
              </div>
            </div>
          </div>
        )}
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

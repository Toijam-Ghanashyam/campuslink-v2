'use client';

import React, { useEffect, useState, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Play, Rocket, ExternalLink, Code2, Map } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CandidateRoadmap, RoadmapMilestone, SkillDifficulty } from '@/types/roadmap';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { Tabs } from '@/components/editorial/Tabs';
import { Card } from '@/components/editorial/Card';
import { Stamp } from '@/components/editorial/Stamp';
import { MarginNote } from '@/components/editorial/MarginNote';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

const STARTER_CHALLENGES = [
  {
    id: 'cs-dsa-1',
    title: 'Two Sum & In-Memory Indexing',
    difficulty: 'Easy',
    topic: 'Data Structures & Algorithms',
    description:
      'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target in O(N) time.',
    starterCode: {
      python: `def two_sum(nums, target):\n    hashmap = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in hashmap:\n            return [hashmap[complement], i]\n        hashmap[num] = i\n    return []\n\nprint(two_sum([2, 7, 11, 15], 9))`,
      javascript: `function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const complement = target - nums[i];\n    if (map.has(complement)) return [map.get(complement), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}\nconsole.log(twoSum([2, 7, 11, 15], 9));`,
      cpp: `#include <iostream>\nint main() {\n    std::cout << "[0, 1]" << std::endl;\n    return 0;\n}`,
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
      cpp: `#include <iostream>\nint main() {\n    std::cout << "PROCESSED\\nSKIPPED_IDEMPOTENT\\n";\n    return 0;\n}`,
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
  const [generating, setGenerating] = useState(false);

  // Monaco Sandbox State
  const [activeChallenge, setActiveChallenge] = useState(STARTER_CHALLENGES[0]);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp'>('python');
  const [code, setCode] = useState<string>(STARTER_CHALLENGES[0].starterCode.python);
  const [output, setOutput] = useState<string>('');
  const [executing, setExecuting] = useState(false);

  const [targetCompanyInput, setTargetCompanyInput] = useState<string>(urlDriveTitle || '');
  const [targetRoleInput, setTargetRoleInput] = useState<string>(urlRole || '');

  const supabase = createClient();
  const { toast } = useToast();

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

        try {
          const res = await fetch('/api/generate-roadmap');
          const data = await res.json();
          if (data.roadmaps && data.roadmaps.length > 0) {
            const normalized = data.roadmaps.map((r: any) => ({
              id: r.id,
              studentId: r.student_id || r.studentId,
              applicationId: r.application_id || r.applicationId,
              companyName: r.company_name || r.companyName,
              roleTitle: r.role_title || r.roleTitle,
              targetRole: r.target_role || r.targetRole,
              totalDurationWeeks: r.total_duration_weeks || r.totalDurationWeeks || 8,
              missingSkills: r.missing_skills || r.missingSkills || [],
              milestones: r.milestones || [],
              createdAt: r.created_at || r.createdAt,
            }));
            setRoadmaps(normalized);
            setActiveRoadmap(normalized[0]);
          }
        } catch (e) {
          console.error(e);
        }

        if (urlAppId) {
          handleGenerateRoadmap(urlAppId, urlDriveTitle || undefined, urlRole || undefined);
        }
      }
    }
    initData();
  }, [urlAppId]);

  const handleGenerateRoadmap = async (
    applicationId?: string,
    companyName?: string,
    roleTitle?: string
  ) => {
    setGenerating(true);
    setActiveTab('roadmap');

    try {
      const res = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId: applicationId || undefined,
          companyName: companyName || targetCompanyInput || 'Enterprise Partner',
          roleTitle: roleTitle || targetRoleInput || 'Software Engineer',
        }),
      });

      const data = await res.json();
      if (data.roadmap) {
        const r = data.roadmap;
        const newRoadmap: CandidateRoadmap = {
          id: r.id,
          studentId: r.student_id || r.studentId,
          applicationId: r.application_id || applicationId,
          companyName: r.company_name || r.companyName || companyName || targetCompanyInput,
          roleTitle: r.role_title || r.roleTitle || roleTitle || targetRoleInput,
          targetRole: r.target_role || r.targetRole || roleTitle || targetRoleInput,
          totalDurationWeeks: r.total_duration_weeks || r.totalDurationWeeks || 8,
          missingSkills: r.missing_skills || r.missingSkills || [],
          milestones: r.milestones || [],
          createdAt: r.created_at || new Date().toISOString(),
        };

        setRoadmaps((prev) => [newRoadmap, ...prev.filter((item) => item.id !== newRoadmap.id)]);
        setActiveRoadmap(newRoadmap);
        toast('Skill Remediation Roadmap synthesized!', 'jade');
      } else {
        toast(data.error || 'Failed to generate roadmap', 'brick');
      }
    } catch (err: any) {
      toast(`Error: ${err.message}`, 'brick');
    } finally {
      setGenerating(false);
    }
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
    }
    setActiveTab('sandbox');
  };

  const handleRunCode = async () => {
    setExecuting(true);
    setOutput('Executing in sandboxed runner...');
    try {
      const res = await fetch('/api/run-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language, sourceCode: code }),
      });
      const data = await res.json();
      setOutput(data.run?.output || data.error || 'Execution complete.');
    } catch (err: any) {
      setOutput(`Execution error: ${err.message}`);
    } finally {
      setExecuting(false);
    }
  };

  const renderDifficultyStamp = (diff: SkillDifficulty, weeks: number, hours: number) => {
    const tone = diff === 'HARD' ? 'brick' : diff === 'MEDIUM' ? 'ochre' : 'jade';
    return (
      <Stamp tone={tone}>
        {diff} · {weeks} WKS (~{hours} HRS)
      </Stamp>
    );
  };

  return (
    <AppShell role="student">
      <PageTransition className="space-y-6">
        <Masthead
          context="04 · NATIVE REMEDIATION STUDIO & MONACO SANDBOX"
          title="Skill Remediation & Code Studio."
          lede="Turn drive screening diagnostics into a calibrated engineering study plan with curated YouTube lectures, official docs, and an in-browser Python / Node.js / C++ runner."
        />

        <Tabs
          tabs={[
            { id: 'roadmap', label: 'AI Skill Roadmaps', count: roadmaps.length },
            { id: 'sandbox', label: 'Monaco Practice Sandbox' },
          ]}
          value={activeTab}
          onChange={(id: any) => setActiveTab(id)}
        />

        {activeTab === 'roadmap' && (
          <div className="space-y-6">
            {/* Generator Bar */}
            <Card className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                  GEMINI ROADMAP SYNTHESIZER
                </span>
                <h3 className="font-display font-semibold text-lg text-fg">
                  Generate Custom Target Role Roadmap
                </h3>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Target Company (e.g. Google)"
                  value={targetCompanyInput}
                  onChange={(e) => setTargetCompanyInput(e.target.value)}
                  className="h-9 px-3 rounded-control border border-line bg-bg text-xs text-fg w-40"
                />
                <input
                  type="text"
                  placeholder="Role (e.g. Cloud SDE)"
                  value={targetRoleInput}
                  onChange={(e) => setTargetRoleInput(e.target.value)}
                  className="h-9 px-3 rounded-control border border-line bg-bg text-xs text-fg w-40"
                />
                <Button
                  variant="primary"
                  icon={Rocket}
                  loading={generating}
                  onClick={() => handleGenerateRoadmap()}
                >
                  {generating ? 'Synthesizing...' : 'Generate Roadmap'}
                </Button>
              </div>
            </Card>

            {/* Past Drive Diagnostic History */}
            {feedbackHistory.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2">
                {feedbackHistory.map((item, idx) => (
                  <Card key={idx} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-display font-semibold text-sm text-fg">
                        {item.placement_drives?.company_name} · {item.placement_drives?.role_title}
                      </span>
                      <Stamp tone={item.stage === 'REJECTED' ? 'brick' : 'ochre'}>
                        {item.stage}
                      </Stamp>
                    </div>
                    <MarginNote label="SCREENING DIAGNOSTIC">
                      &ldquo;{item.ai_feedback_summary}&rdquo;
                    </MarginNote>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        handleGenerateRoadmap(
                          item.id,
                          item.placement_drives?.company_name,
                          item.placement_drives?.role_title
                        )
                      }
                    >
                      Synthesize Plan from This Audit &rarr;
                    </Button>
                  </Card>
                ))}
              </div>
            )}

            {/* Active Roadmap Display */}
            {activeRoadmap ? (
              <div className="space-y-5">
                <Card object className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
                    <div>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-accent font-semibold">
                        ACTIVE REMEDIATION PLAN
                      </span>
                      <h2 className="font-display text-2xl font-bold text-fg mt-0.5">
                        {activeRoadmap.companyName} — {activeRoadmap.roleTitle}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-xs">
                      <div>
                        <span className="text-fg-soft block text-[10px]">DURATION</span>
                        <strong className="text-fg text-base">{activeRoadmap.totalDurationWeeks} Weeks</strong>
                      </div>
                      <div className="h-6 w-px bg-line" />
                      <div>
                        <span className="text-fg-soft block text-[10px]">MILESTONES</span>
                        <strong className="text-jade text-base">{activeRoadmap.milestones?.length || 0}</strong>
                      </div>
                    </div>
                  </div>

                  {activeRoadmap.missingSkills?.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] uppercase text-fg-soft">
                        IDENTIFIED SKILL GAPS:
                      </span>
                      {activeRoadmap.missingSkills.map((sk, i) => (
                        <Stamp key={i} tone="brick">
                          {sk}
                        </Stamp>
                      ))}
                    </div>
                  )}
                </Card>

                {/* Sequential Milestones */}
                <div className="space-y-4">
                  {activeRoadmap.milestones?.map((ms: RoadmapMilestone, idx: number) => (
                    <Card key={idx} className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
                        <div className="flex items-center gap-3">
                          <span className="w-7 h-7 rounded-full bg-accent-tint border border-accent/40 font-mono text-xs font-bold text-accent-deep flex items-center justify-center">
                            0{ms.milestoneNumber || idx + 1}
                          </span>
                          <div>
                            <h4 className="font-display font-semibold text-lg text-fg">
                              {ms.skillName}
                            </h4>
                            <span className="font-mono text-[10px] uppercase text-fg-soft">
                              {ms.category}
                            </span>
                          </div>
                        </div>
                        {renderDifficultyStamp(ms.difficulty, ms.durationWeeks, ms.estimatedHours)}
                      </div>

                      <p className="text-xs text-fg leading-relaxed">{ms.description}</p>

                      {/* Resources Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3 rounded-control bg-bg border border-line space-y-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-brick block">
                            ▶️ CURATED YOUTUBE DEEP DIVES
                          </span>
                          {ms.youtubeResources?.map((yt, yi) => (
                            <a
                              key={yi}
                              href={yt.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2 rounded bg-surface border border-line hover:border-fg/40 text-xs text-fg transition"
                            >
                              <span className="truncate pr-2">{yt.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-fg-soft shrink-0" />
                            </a>
                          ))}
                        </div>

                        <div className="p-3 rounded-control bg-bg border border-line space-y-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider font-semibold text-accent-deep block">
                            📖 OFFICIAL DOCUMENTATION
                          </span>
                          {ms.documentationResources?.map((doc, di) => (
                            <a
                              key={di}
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center justify-between p-2 rounded bg-surface border border-line hover:border-fg/40 text-xs text-fg transition"
                            >
                              <span className="truncate pr-2">{doc.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-fg-soft shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>

                      {ms.practicalProject && (
                        <div className="p-3.5 rounded-control bg-accent-tint/20 border border-accent/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="font-mono text-[10px] uppercase font-bold text-accent-deep block">
                              PORTFOLIO CAPSTONE CHALLENGE
                            </span>
                            <p className="text-xs text-fg mt-0.5">{ms.practicalProject}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={Code2}
                            onClick={() => handlePracticeMilestone(ms)}
                          >
                            Practice in Sandbox
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <Card className="p-12 text-center space-y-2">
                <h4 className="font-display text-lg font-semibold text-fg">
                  No Active Roadmaps Yet
                </h4>
                <p className="text-xs text-fg-soft">
                  Enter a target company and role above to synthesize a personalized learning timeline.
                </p>
              </Card>
            )}
          </div>
        )}

        {/* TAB 2: MONACO SANDBOX */}
        {activeTab === 'sandbox' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <span className="font-mono text-[10.5px] uppercase tracking-wider text-fg-soft font-semibold block">
                PRACTICE MODULES
              </span>
              {STARTER_CHALLENGES.map((ch) => (
                <Card
                  key={ch.id}
                  hover
                  onClick={() => {
                    setActiveChallenge(ch);
                    setCode(ch.starterCode[language] || ch.starterCode.python);
                    setOutput('');
                  }}
                  className={
                    activeChallenge.id === ch.id ? 'border-accent bg-accent-tint/15' : ''
                  }
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] text-fg-soft">{ch.topic}</span>
                    <Stamp tone="ochre">{ch.difficulty}</Stamp>
                  </div>
                  <h4 className="font-display font-semibold text-sm text-fg">{ch.title}</h4>
                  <p className="text-xs text-fg-soft mt-1 line-clamp-2">{ch.description}</p>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-t-object border border-line bg-surface">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs text-fg-soft">RUNTIME:</span>
                  <select
                    value={language}
                    onChange={(e) => {
                      const nextLang = e.target.value as 'python' | 'javascript' | 'cpp';
                      setLanguage(nextLang);
                      setCode(activeChallenge.starterCode[nextLang] || '');
                    }}
                    className="h-8 px-2.5 rounded-control border border-line bg-bg font-mono text-xs text-fg"
                  >
                    <option value="python">Python 3.10 (Gemini Runner)</option>
                    <option value="javascript">Node.js 20 (Local Host Runner)</option>
                    <option value="cpp">C++ GCC (Gemini Runner)</option>
                  </select>
                </div>

                <Button
                  size="sm"
                  variant="primary"
                  icon={Play}
                  loading={executing}
                  onClick={handleRunCode}
                >
                  {executing ? 'Running...' : 'Run Code'}
                </Button>
              </div>

              <div className="rounded-b-object overflow-hidden border border-line bg-[#1e1e1e]">
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

              <Card className="space-y-2">
                <span className="font-mono text-[10px] uppercase tracking-wider font-bold text-fg-soft block">
                  SANDBOX EXECUTION STDOUT / STDERR
                </span>
                <pre className="font-mono text-xs text-jade bg-bg p-3.5 rounded-control border border-line whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {output || 'Click "Run Code" to execute in the sandbox.'}
                </pre>
              </Card>
            </div>
          </div>
        )}
      </PageTransition>
    </AppShell>
  );
}

export default function StudentRemediationStudio() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-xs">Loading Studio...</div>}>
      <RemediationStudioContent />
    </Suspense>
  );
}

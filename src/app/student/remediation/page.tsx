'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

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

export default function StudentRemediationStudio() {
  const [feedbackHistory, setFeedbackHistory] = useState<any[]>([]);
  const [activeChallenge, setActiveChallenge] = useState(STARTER_CHALLENGES[0]);
  const [language, setLanguage] = useState<'python' | 'javascript' | 'cpp'>('python');
  const [code, setCode] = useState<string>(activeChallenge.starterCode.python);
  const [output, setOutput] = useState<string>('');
  const [executing, setExecuting] = useState<boolean>(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchDiagnosticFeedback() {
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
            ai_fit_score,
            ai_feedback_summary,
            stage,
            placement_drives ( company_name, role_title )
          `)
          .eq('student_id', profile.id)
          .not('ai_feedback_summary', 'is', null);

        setFeedbackHistory(apps || []);
      }
    }
    fetchDiagnosticFeedback();
  }, []);

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

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="border-b border-slate-800 pb-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
            Native Student Remediation Studio
          </h1>
          <p className="text-sm text-slate-400">
            Personalized Skill Gap Remediation &amp; Interactive Code Sandbox
          </p>
        </header>

        {/* AI Diagnostic Gap Analysis Feed */}
        <div className="space-y-2">
          <h2 className="text-xs uppercase font-semibold text-slate-400">
            Diagnostic Gap Analysis &amp; Screening Audits
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {feedbackHistory.length === 0 ? (
              <Card className="border-slate-800 bg-slate-900 p-4 text-xs text-slate-400 col-span-2">
                No past rejections or gap analyses logged. Complete a drive screening to unlock custom targets.
              </Card>
            ) : (
              feedbackHistory.map((item, idx) => (
                <Card key={idx} className="border-slate-800 bg-slate-900 text-slate-100">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-200">
                        {item.placement_drives?.company_name} ({item.placement_drives?.role_title})
                      </span>
                      <Badge variant="outline" className="text-emerald-400 border-emerald-800">
                        Match: {item.ai_fit_score}%
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-300 italic">
                      "{item.ai_feedback_summary}"
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Code Sandbox Section */}
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
      </div>
    </div>
  );
}


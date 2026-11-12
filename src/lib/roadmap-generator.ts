import { GoogleGenAI } from '@google/genai';
import { CandidateRoadmap, RoadmapMilestone } from '../types/roadmap';
import { getCuratedProblemsForTopics, normalizeTopicTag } from './curated-problems';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY, apiVersion: 'v1beta' });

// Fast model priority chain: reliable ultra-fast production models
const FAST_MODEL_CHAIN = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-3.8-flash',
];

export async function synthesizeRoadmapAI(params: {
  targetCompany: string;
  targetRole: string;
  feedback?: string;
  missingSkills?: string[];
  verifiedCgpa?: number;
  branch?: string;
}) {
  const {
    targetCompany,
    targetRole,
    feedback = '',
    missingSkills = [],
    verifiedCgpa = 7.8,
    branch = 'Computer Science & Engineering',
  } = params;

  const roleLower = targetRole.toLowerCase();
  let defaultFeedback = `Comprehensive technical assessment for ${targetCompany} (${targetRole}) requiring industry-grade competence.`;
  if (roleLower.includes('frontend') || roleLower.includes('ui') || roleLower.includes('web') || roleLower.includes('react')) {
    defaultFeedback = `Requires mastery of modern frontend architecture (React/Next.js), state management, browser rendering performance, responsive UI/Tailwind, and TypeScript.`;
  } else if (roleLower.includes('devops') || roleLower.includes('cloud') || roleLower.includes('sre') || roleLower.includes('infra')) {
    defaultFeedback = `Requires deep expertise in container orchestration (Kubernetes, Docker), Infrastructure as Code (Terraform), CI/CD automation pipelines, and cloud observability.`;
  } else if (roleLower.includes('data') || roleLower.includes('ml') || roleLower.includes('ai') || roleLower.includes('intelligence')) {
    defaultFeedback = `Requires solid foundations in data processing pipelines, SQL/NoSQL databases, Python analytical libraries (Pandas/NumPy), and machine learning deployments.`;
  } else if (roleLower.includes('mobile') || roleLower.includes('android') || roleLower.includes('ios') || roleLower.includes('flutter')) {
    defaultFeedback = `Requires proficiency in mobile app architecture, client-server sync, memory management, and responsive native user interfaces.`;
  } else {
    defaultFeedback = `Requires algorithmic optimization (LeetCode/Blind 75), clean backend service architecture, concurrency, and database query performance tailored for ${targetCompany}.`;
  }

  const effectiveFeedback = feedback.trim() || defaultFeedback;

  const missingClause = missingSkills.length > 0
    ? `\nCRITICAL DIRECTIVE - TARGET SPECIFIC MISSING SKILLS:
The candidate's resume evaluation for this drive identified specific missing technical gaps: [${missingSkills.join(', ')}].
You MUST dedicate milestones specifically to mastering each of these missing skills: ${missingSkills.join(', ')}.
Assign the missing skill names as the milestone "skillName" so the student directly bridges their deficiencies for ${targetCompany}.`
    : '';

  const prompt = `You are a Principal Software Architect and Lead Engineering Career Mentor.
A student candidate was evaluated for a campus placement drive at "${targetCompany}" for the specialized role of "${targetRole}".
Target Role: "${targetRole}"
Target Enterprise: "${targetCompany}"
Diagnostic Technical Feedback: "${effectiveFeedback}"
${missingClause}
Student verified CGPA: ${verifiedCgpa}, Branch: ${branch}.

Synthesize a high-velocity, structured Remediation Learning Roadmap with 3 to 4 focused, high-impact milestones tailored STRICTLY to "${targetRole}" at "${targetCompany}".
CRITICAL: Do NOT generate generic backend milestones if the role is Frontend, DevOps, Data, Mobile, or QA. Every milestone, practical project, and code snippet MUST directly align with the core tech stack of "${targetRole}".

STRICT TIMELINE & DIFFICULTY CALIBRATION:
- "EASY" skills: 1 to 2 weeks (10-15 study hrs).
- "MEDIUM" skills: 3 to 6 weeks (30-50 study hrs).
- "HARD" skills: 8 to 12 weeks (80-120 study hrs).

For each milestone, provide:
- 2 high-quality YouTube resources with specific video title and search URL ("https://www.youtube.com/results?search_query=...").
- 2 authoritative documentation links (e.g. MDN, postgresql.org, docs.python.org, react.dev, kubernetes.io, etc.).
- A concrete practical project description to prove mastery in their GitHub portfolio.
- A concise, runnable starter code snippet (15-30 lines in python or javascript).

Return ONLY valid JSON matching this schema:
{
  "totalDurationWeeks": number,
  "missingSkills": ["string"],
  "milestones": [
    {
      "milestoneNumber": number,
      "skillName": "string",
      "category": "string",
      "topicTag": "arrays-hashing" | "two-pointers" | "sliding-window" | "stack" | "binary-search" | "linked-list" | "trees" | "graphs" | "dynamic-programming" | "sql",
      "difficulty": "EASY" | "MEDIUM" | "HARD",
      "durationWeeks": number,
      "estimatedHours": number,
      "description": "string",
      "topics": ["string"],
      "youtubeResources": [
        { "title": "string", "url": "https://www.youtube.com/results?search_query=...", "source": "string", "type": "YOUTUBE" }
      ],
      "documentationResources": [
        { "title": "string", "url": "https://...", "source": "string", "type": "DOCUMENTATION" }
      ],
      "practicalProject": "string",
      "language": "python" | "javascript",
      "starterCodeSnippet": "string"
    }
  ]
}`;

  let parsedResponse: any = null;
  let lastError: any = null;

  for (const modelName of FAST_MODEL_CHAIN) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      if (response?.text) {
        const cleaned = response.text.replace(/```json/gi, '').replace(/```/g, '').trim();
        parsedResponse = JSON.parse(cleaned);
        if (parsedResponse?.milestones && Array.isArray(parsedResponse.milestones)) {
          break;
        }
      }
    } catch (err: any) {
      console.warn(`[Roadmap AI] Model ${modelName} failed or unavailable:`, err?.message || err);
      lastError = err;
    }
  }

  if (!parsedResponse || !parsedResponse.milestones) {
    // Resilient fallback in the rare event of complete upstream AI outage
    parsedResponse = getFallbackRoadmap(targetCompany, targetRole, missingSkills);
  } else if (missingSkills.length > 0 && (!parsedResponse.missingSkills || parsedResponse.missingSkills.length === 0)) {
    parsedResponse.missingSkills = missingSkills;
  }

  // Enrich each milestone with exact Blind 75 / NeetCode 150 curated practice problems
  if (parsedResponse?.milestones && Array.isArray(parsedResponse.milestones)) {
    parsedResponse.milestones = parsedResponse.milestones.map((ms: any, idx: number) => {
      const topicTag = ms.topicTag || normalizeTopicTag(ms.skillName + ' ' + (ms.category || ''));
      const curated = getCuratedProblemsForTopics([topicTag, ...(ms.topics || [])], 2);
      return {
        ...ms,
        id: ms.id || `ms-${idx + 1}-${Date.now()}`,
        topicTag,
        curatedProblems: curated,
      };
    });
  }

  return parsedResponse;
}

function getFallbackRoadmap(targetCompany: string, targetRole: string, missingSkills?: string[]) {
  if (missingSkills && missingSkills.length > 0) {
    const totalWeeks = Math.max(4, missingSkills.length * 2);
    return {
      totalDurationWeeks: totalWeeks,
      missingSkills,
      milestones: missingSkills.map((skill, idx) => ({
        milestoneNumber: idx + 1,
        skillName: skill,
        category: 'Remediation & Skill Bridge',
        difficulty: (idx === 0 ? 'EASY' : idx === 1 ? 'MEDIUM' : 'HARD') as any,
        durationWeeks: idx === 0 ? 2 : 3,
        estimatedHours: idx === 0 ? 15 : 30,
        description: `Comprehensive ramp-up and practical mastery in ${skill} required for ${targetRole} at ${targetCompany}.`,
        topics: [`Core Concepts of ${skill}`, `System Integration & Practical Patterns`, `Interview Problem Solving in ${skill}`],
        youtubeResources: [
          {
            title: `${skill} Complete Crash Course & Interview Preparation`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill)}+crash+course+interview`,
            source: 'YouTube Engineering',
            type: 'YOUTUBE' as const,
          },
          {
            title: `${skill} Deep Dive & Architecture Patterns`,
            url: `https://www.youtube.com/results?search_query=${encodeURIComponent(skill)}+architecture+deep+dive`,
            source: 'freeCodeCamp',
            type: 'YOUTUBE' as const,
          },
        ],
        documentationResources: [
          {
            title: `${skill} Official Documentation & Guides`,
            url: `https://devdocs.io/#q=${encodeURIComponent(skill)}`,
            source: 'Official Docs',
            type: 'DOCUMENTATION' as const,
          },
        ],
        practicalProject: `Build a production-grade project demonstrating end-to-end practical mastery in ${skill}.`,
        language: 'python' as const,
        starterCodeSnippet: `# Remediation Project Starter for ${skill}\n# Role: ${targetRole} @ ${targetCompany}\n\ndef solve_milestone():\n    print("Remediation milestone for ${skill} initialized.")\n\nif __name__ == "__main__":\n    solve_milestone()\n`,
      })),
    };
  }

  return {
    totalDurationWeeks: 8,
    missingSkills: ['Database Query Optimization', 'Asynchronous Systems & Event Loop', 'System Architecture & Caching'],
    milestones: [
      {
        milestoneNumber: 1,
        skillName: 'Database Indexing & Query Execution Plans',
        category: 'Backend & Data Systems',
        difficulty: 'MEDIUM',
        durationWeeks: 4,
        estimatedHours: 35,
        description: 'Master B-tree indexing, EXPLAIN ANALYZE execution inspection, and query cost reduction.',
        topics: ['B-Tree vs Hash Indexes', 'EXPLAIN ANALYZE', 'N+1 Query Resolution', 'Connection Pooling'],
        youtubeResources: [
          {
            title: 'Database Indexing Explained - Hussein Nasser',
            url: 'https://www.youtube.com/results?search_query=hussein+nasser+database+indexing',
            source: 'Hussein Nasser',
            type: 'YOUTUBE',
          },
          {
            title: 'PostgreSQL EXPLAIN ANALYZE Deep Dive',
            url: 'https://www.youtube.com/results?search_query=postgres+explain+analyze+tutorial',
            source: 'freeCodeCamp',
            type: 'YOUTUBE',
          },
        ],
        documentationResources: [
          {
            title: 'PostgreSQL Official Documentation: Index Types',
            url: 'https://www.postgresql.org/docs/current/indexes-types.html',
            source: 'PostgreSQL Docs',
            type: 'DOCUMENTATION',
          },
        ],
        practicalProject: 'Build a high-volume benchmark CLI comparing sequential scan vs multi-column indexed queries over 1,000,000 synthetic records.',
        language: 'python',
        starterCodeSnippet: `import time\nimport sqlite3\n\n# Benchmark Indexed vs Unindexed Search\nconn = sqlite3.connect(':memory:')\ncur = conn.cursor()\ncur.execute('CREATE TABLE users (id INTEGER PRIMARY KEY, email TEXT, score REAL)')\n\ndata = [(i, f'user_{i}@campus.edu', i * 0.1) for i in range(100_000)]\ncur.executemany('INSERT INTO users VALUES (?, ?, ?)', data)\nconn.commit()\n\nt0 = time.perf_counter()\ncur.execute('SELECT * FROM users WHERE email = ?', ('user_99999@campus.edu',))\nres = cur.fetchone()\nprint(f'Unindexed scan: {(time.perf_counter() - t0)*1000:.3f}ms')\n`,
      },
      {
        milestoneNumber: 2,
        skillName: 'Distributed Caching & Invalidation Architecture',
        category: 'System Design & Scalability',
        difficulty: 'HARD',
        durationWeeks: 4,
        estimatedHours: 45,
        description: 'Implement Cache-Aside, Write-Through, and stampede mitigation patterns with Redis.',
        topics: ['Cache Invalidation', 'Redis TTL Strategies', 'Cache Stampede & Mutex Locks', 'Session Clustering'],
        youtubeResources: [
          {
            title: 'System Design: Redis Caching Patterns',
            url: 'https://www.youtube.com/results?search_query=redis+caching+patterns+system+design',
            source: 'NeetCode',
            type: 'YOUTUBE',
          },
        ],
        documentationResources: [
          {
            title: 'Redis Official Documentation: Cache Management',
            url: 'https://redis.io/docs/latest/develop/use/patterns/',
            source: 'Redis Docs',
            type: 'DOCUMENTATION',
          },
        ],
        practicalProject: 'Design a resilient distributed rate limiter and read-through caching proxy with Prometheus metrics.',
        language: 'python',
        starterCodeSnippet: `class CacheAsideProxy:\n    def __init__(self):\n        self.cache = {}\n        self.db_calls = 0\n\n    def get_data(self, key):\n        if key in self.cache:\n            return f'CACHE HIT: {self.cache[key]}'\n        self.db_calls += 1\n        data = f'value_for_{key}'\n        self.cache[key] = data\n        return f'CACHE MISS: {data}'\n\nproxy = CacheAsideProxy()\nprint(proxy.get_data('catalog_42'))\nprint(proxy.get_data('catalog_42'))\n`,
      },
    ],
  };
}

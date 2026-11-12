import { GoogleGenAI } from '@google/genai';
import { SkillDeltaItem } from '../types/pri';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Fast model priority chain: ultra-fast lite models first (<4s), falling back to deeper models
const FAST_MODEL_CHAIN = [
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.8-flash',
];

export async function synthesizeRoadmapAI(params: {
  targetCompany: string;
  targetRole: string;
  feedback?: string;
  verifiedCgpa?: number;
  branch?: string;
  skillGapDelta?: SkillDeltaItem[];
  priScore?: number;
}) {
  const {
    targetCompany,
    targetRole,
    feedback = '',
    verifiedCgpa = 7.8,
    branch = 'Computer Science & Engineering',
    skillGapDelta,
    priScore,
  } = params;

  let deficitBlock = '';
  if (skillGapDelta && skillGapDelta.length > 0) {
    const positiveGaps = skillGapDelta.filter((d) => d.delta > 0);
    if (positiveGaps.length > 0) {
      deficitBlock = `\nMATHEMATICAL PRI VECTOR DEFICIT ANALYSIS (Role benchmark V_role vs Candidate V_s):
${positiveGaps.map((d) => `- ${d.label} (${d.key}): Required ${d.roleScore}/10, Candidate evaluated ${d.studentScore}/10 (Deficit Delta: +${d.delta})`).join('\n')}
MANDATORY: Prioritize roadmap milestones directly targeting these specific deficits in descending order of delta gap.\n`;
    }
  }

  const prompt = `You are a Principal Software Architect and Lead Engineering Career Mentor.
A student candidate was evaluated for a campus placement drive at "${targetCompany}" for the role of "${targetRole}".
${priScore !== undefined ? `Placement Readiness Index (PRI): ${priScore}/100.` : ''}
Diagnostic Feedback from Screening/Interview: "${feedback || 'Needs stronger proficiency in core algorithmic optimization, system design tradeoffs, and backend database query execution.'}"
Student verified CGPA: ${verifiedCgpa}, Branch: ${branch}.
${deficitBlock}
Synthesize a high-velocity, structured Remediation Learning Roadmap with 3 to 4 focused, high-impact milestones to close every technical deficit.

STRICT TIMELINE & DIFFICULTY CALIBRATION:
- "EASY" skills (e.g. Basic SQL Queries, Git branching/PRs, DOM APIs, CSS Grid): 1 to 2 weeks (10-15 study hrs).
- "MEDIUM" skills (e.g. Indexing & Query Plans, Redis Caching, Docker containerization, REST/GraphQL design, Async Concurrency): 3 to 6 weeks (30-50 study hrs).
- "HARD" skills (e.g. Distributed Consensus Raft/Paxos, High-throughput Kafka pipelines, Database Internals, Low-level Memory Management, High-scale System Design): 8 to 12 weeks (80-120 study hrs).

For each milestone, provide:
- 2 high-quality YouTube resources with specific video title and search URL ("https://www.youtube.com/results?search_query=...").
- 2 authoritative documentation links (e.g. MDN, postgresql.org, docs.python.org, react.dev, etc.).
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
          temperature: 0.2,
        },
      });

      if (response?.text) {
        parsedResponse = JSON.parse(response.text);
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
    if (lastError) {
      console.warn('[Roadmap AI] Upstream models unavailable, engaging algorithmic fallback:', lastError?.message);
    }
    // Resilient fallback in the rare event of complete upstream AI outage
    parsedResponse = getFallbackRoadmap(targetCompany, targetRole);
  }

  return parsedResponse;
}

function getFallbackRoadmap(_targetCompany?: string, _targetRole?: string) {
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

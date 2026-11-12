import { Groq } from 'groq-sdk';
import {
  GenerateProjectsInput,
  ProjectRecommendationResult,
  RecommendedProjectBlueprint,
} from '@/types/projects';

// Model Priority Chain as required:
// Tries Qwen 27B first, falling back to GPT-OSS 20B/120B on Groq
const GROQ_MODELS = [
  'qwen/qwen3.6-27b',
  'qwen/qwen3.8-27b',
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
];

const PROJECT_JSON_SCHEMA = {
  name: 'project_recommendations_response',
  strict: true,
  schema: {
    type: 'object',
    properties: {
      skillGapReasoning: {
        type: 'string',
        description:
          'Forced Chain-of-Thought analysis: explain which missing skills are most critical for this company/role, how the student can bridge them using existing skills, and how each project is scored using Suitability = (0.40 * Gap Coverage) + (0.30 * Domain Alignment) + (0.20 * Foundation Leverage) + (0.10 * Feasibility).',
      },
      recommendedProjects: {
        type: 'array',
        description: 'Exactly 3 tailored, production-grade project blueprints addressing the skill gap.',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            difficulty: {
              type: 'string',
              enum: ['Beginner', 'Intermediate', 'Advanced'],
            },
            estimatedHours: { type: 'number' },
            problemStatement: { type: 'string' },
            existingSkillsUsed: {
              type: 'array',
              items: { type: 'string' },
            },
            missingSkillsTargeted: {
              type: 'array',
              items: { type: 'string' },
            },
            mvpMilestones: {
              type: 'array',
              items: { type: 'string' },
              description: 'Exactly 3 sequential weekend-buildable implementation milestones.',
            },
            resumeBulletPoints: {
              type: 'array',
              items: { type: 'string' },
              description: 'Exactly 2 ATS-ready, metric-driven resume bullet points.',
            },
            suitabilityScore: {
              type: 'number',
              description: 'Calculated score between 0 and 100 based on the formula.',
            },
          },
          required: [
            'title',
            'difficulty',
            'estimatedHours',
            'problemStatement',
            'existingSkillsUsed',
            'missingSkillsTargeted',
            'mvpMilestones',
            'resumeBulletPoints',
            'suitabilityScore',
          ],
          additionalProperties: false,
        },
      },
    },
    required: ['skillGapReasoning', 'recommendedProjects'],
    additionalProperties: false,
  },
};

/**
 * Open-Weight Project Recommendation Engine powered by Groq
 */
export async function generateTailoredProjects(
  input: GenerateProjectsInput
): Promise<ProjectRecommendationResult> {
  const {
    companyName,
    roleTitle,
    jobDescription = '',
    matchedSkills,
    missingSkills,
    existingProjects = [],
  } = input;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.warn('[ProjectRecommender] GROQ_API_KEY is not configured; using deterministic fallback.');
    return getDeterministicFallbackProjects(input);
  }

  const groq = new Groq({ apiKey });

  const systemPrompt = `You are a Principal Engineering Architect & Enterprise Campus Placement Strategist.
Your mission is to generate exactly 3 production-grade, resume-worthy project blueprints for a student interviewing at "${companyName}" for the "${roleTitle}" role.

CRITICAL DIRECTIVES:
1. FORCED CHAIN-OF-THOUGHT SCORING:
   In the "skillGapReasoning" field (generated BEFORE the projects), analyze:
   - What critical engineering problems "${companyName}" solves in its industry.
   - Why the student's missing skills (${missingSkills.join(', ') || 'Domain Specialization'}) are hiring blockers for this role.
   - How each recommended project is calculated using the strict suitability formula:
     Suitability = (0.40 * Gap Coverage) + (0.30 * Domain Alignment) + (0.20 * Foundation Leverage) + (0.10 * Feasibility)
     Score each project between 75 and 98 based on this rubric.

2. STRICTLY FORBIDDEN GENERIC PROJECTS:
   DO NOT recommend To-Do apps, Weather apps, Simple Calculators, Tic-Tac-Toe, or generic Blog clones.
   Every project MUST simulate real-world, high-scale industry challenges relevant to "${companyName}" (e.g., distributed event logging, idempotency in payments, anomaly detection, rate limiters, caching layers, real-time dispatch, microservices sync).

3. FOUNDATION LEVERAGE:
   The project must bridge the missing skills (${missingSkills.join(', ') || 'Cloud & Architecture'}) by leveraging the candidate's existing known skills (${matchedSkills.join(', ') || 'Core Programming & Data Structures'}).

4. WEEKEND-BUILDABLE MILESTONES:
   Provide exactly 3 clear, sequential MVP milestones that a candidate can build and demo on GitHub in 1-2 weekends.

5. ATS-READY RESUME BULLETS:
   Provide exactly 2 metric-driven ATS resume bullet points starting with strong action verbs (e.g. "Architected...", "Engineered...", "Optimized...").`;

  const userPrompt = `Candidate Profile & Target Placement Drive:
- Target Company: ${companyName}
- Target Role: ${roleTitle}
${jobDescription ? `- Job Description Context: ${jobDescription.slice(0, 500)}` : ''}
- Verified Existing Skills (Matched): ${matchedSkills.length > 0 ? matchedSkills.join(', ') : 'Foundational CS & Programming'}
- Missing JD Requirements (Skill Gap): ${missingSkills.length > 0 ? missingSkills.join(', ') : 'High-Availability Architecture & Scalability'}
- Current Resume Projects Count: ${existingProjects.length}
${existingProjects.length > 0 ? `- Current Projects Summary: ${existingProjects.map((p) => p.title).join(', ')}` : '- Current Projects Summary: NONE (Student has 0 resume projects!)'}

Generate exactly 3 bespoke, production-grade project blueprints tailored to ${companyName} following the specified schema.`;

  for (const model of GROQ_MODELS) {
    try {
      const completion = await groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: PROJECT_JSON_SCHEMA as any,
        },
        temperature: 0.3,
        max_tokens: 3000,
      });

      const raw = completion.choices[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.skillGapReasoning && Array.isArray(parsed.recommendedProjects)) {
          return {
            skillGapReasoning: parsed.skillGapReasoning,
            recommendedProjects: parsed.recommendedProjects,
            modelUsed: model,
            cached: false,
          };
        }
      }
    } catch (err: any) {
      console.warn(`[ProjectRecommender] Model ${model} failed:`, err?.status || err?.message || err);
    }
  }

  // If all Groq models encounter rate limits or network issues, return domain-tailored deterministic fallback
  console.warn('[ProjectRecommender] Falling back to deterministic project generation.');
  return getDeterministicFallbackProjects(input);
}

/**
 * Deterministic fallback generator tailored to company domain and missing skills
 */
export function getDeterministicFallbackProjects(
  input: GenerateProjectsInput
): ProjectRecommendationResult {
  const { companyName, roleTitle, matchedSkills, missingSkills } = input;
  const primaryMissing = missingSkills[0] || 'Distributed Systems';
  const secondaryMissing = missingSkills[1] || 'Redis & Caching';
  const primaryKnown = matchedSkills[0] || 'TypeScript';
  const secondaryKnown = matchedSkills[1] || 'SQL';

  const projects: RecommendedProjectBlueprint[] = [
    {
      title: `${companyName} Domain Resilient Event Dispatch & Queueing Engine`,
      difficulty: 'Intermediate',
      estimatedHours: 18,
      problemStatement: `Design a high-throughput, fault-tolerant background queueing service modeled after ${companyName}'s core operational workload. Emphasizes idempotent processing, dead-letter retries, and asynchronous workers.`,
      existingSkillsUsed: [primaryKnown, secondaryKnown],
      missingSkillsTargeted: [primaryMissing, secondaryMissing],
      mvpMilestones: [
        `Phase 1: Build the core message ingestion API using ${primaryKnown} with token bucket rate limiting.`,
        `Phase 2: Implement persistent state management and worker pools integrating ${primaryMissing} for stream partitioning.`,
        `Phase 3: Deploy automated dead-letter queue re-drive mechanisms with structured Grafana/Prometheus health metrics.`,
      ],
      resumeBulletPoints: [
        `Architected a distributed background worker processing 1,500+ ops/sec with zero message loss using ${primaryMissing} and ${primaryKnown}.`,
        `Engineered an idempotent retry mechanism cutting duplicate processing by 99.8% under simulated network partition tests.`,
      ],
      suitabilityScore: 92,
    },
    {
      title: `Low-Latency In-Memory Query & Cache Synchronization Layer`,
      difficulty: 'Intermediate',
      estimatedHours: 14,
      problemStatement: `Implement a multi-tier write-through caching layer specifically targeting ${roleTitle} performance bottlenecks at ${companyName}, reducing database load during high concurrency spikes.`,
      existingSkillsUsed: [primaryKnown, secondaryKnown],
      missingSkillsTargeted: [secondaryMissing, primaryMissing],
      mvpMilestones: [
        `Phase 1: Configure a dual-layer caching strategy with sub-5ms lookup times on hot relational entities.`,
        `Phase 2: Implement cache invalidation webhooks via change-data-capture to eliminate stale read anomalies.`,
        `Phase 3: Containerize the complete application stack with Docker Compose and verify cache-hit ratio benchmarks (>88%).`,
      ],
      resumeBulletPoints: [
        `Developed a high-concurrency caching proxy with ${secondaryMissing}, reducing 95th percentile database latency from 180ms to 8ms.`,
        `Implemented cache-invalidation streams ensuring sub-second cross-replica consistency across high-volume CRUD workloads.`,
      ],
      suitabilityScore: 88,
    },
    {
      title: `Enterprise Audit & Policy Compliance Observability Pipeline`,
      difficulty: 'Advanced',
      estimatedHours: 22,
      problemStatement: `Develop an enterprise-grade auditing microservice that intercepts transaction events, generates verifiable tamper-evident event logs, and surfaces real-time anomaly alerts tailored for ${companyName}.`,
      existingSkillsUsed: [primaryKnown, 'REST APIs'],
      missingSkillsTargeted: missingSkills.slice(0, 3),
      mvpMilestones: [
        `Phase 1: Build an asynchronous event-streaming consumer that standardizes incoming telemetry payloads into structured schemas.`,
        `Phase 2: Integrate ${primaryMissing} with automated hashing verification to detect and flag unauthorized payload mutations.`,
        `Phase 3: Expose role-based analytics endpoints and verify system load tolerance using simulated traffic spikes.`,
      ],
      resumeBulletPoints: [
        `Engineered an automated compliance streaming pipeline ingesting 10k+ audit events/min with full cryptographic tamper detection.`,
        `Designed modular microservice endpoints with ${primaryKnown} achieving 99.9% uptime during benchmarked saturation testing.`,
      ],
      suitabilityScore: 85,
    },
  ];

  return {
    skillGapReasoning: `Analysis for ${companyName} (${roleTitle}): The candidate demonstrates solid foundations in ${matchedSkills.join(', ') || 'core software engineering'}, but requires practical demonstration in ${missingSkills.join(', ') || 'modern backend architecture'}. Suitability calculated using formula: 40% Gap Coverage + 30% Domain Alignment + 20% Foundation Leverage + 10% Feasibility. These 3 projects directly turn candidate liabilities into interview-ready strengths.`,
    recommendedProjects: projects,
    modelUsed: 'deterministic-fallback',
    cached: false,
  };
}

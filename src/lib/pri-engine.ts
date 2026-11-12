import {
  SkillDimensionKey,
  SkillVector,
  SkillDeltaItem,
  PRICalculationInput,
  PRIEvaluationResult,
} from '@/types/pri';

export const SKILL_KEYS: SkillDimensionKey[] = [
  'dsa',
  'system_design',
  'backend_apis',
  'databases',
  'cloud_devops',
  'frontend_ui',
  'testing_cicd',
  'cs_fundamentals',
];

export const SKILL_LABELS: Record<SkillDimensionKey, string> = {
  dsa: 'Data Structures & Algorithms',
  system_design: 'System Design & Scalability',
  backend_apis: 'Backend APIs & Microservices',
  databases: 'Databases & Query Optimization',
  cloud_devops: 'Cloud & DevOps Infrastructure',
  frontend_ui: 'Frontend & UI Engineering',
  testing_cicd: 'Testing & CI/CD Automation',
  cs_fundamentals: 'Core CS & OS Fundamentals',
};

export const DEFAULT_ROLE_VECTOR: SkillVector = {
  dsa: 8,
  system_design: 7,
  backend_apis: 8,
  databases: 7,
  cloud_devops: 6,
  frontend_ui: 6,
  testing_cicd: 6,
  cs_fundamentals: 8,
};

/**
 * Computes the Academic Score E_academic on a 0-100 scale:
 * E_academic(i) = (verifiedCgpa / 10) * 100 - min(activeBacklogs * 10, 30)
 * Clamped strictly to [0, 100].
 */
export function computeAcademicScore(verifiedCgpa: number, activeBacklogs: number = 0): number {
  const safeCgpa = Math.max(0, Math.min(10, verifiedCgpa || 0));
  const safeBacklogs = Math.max(0, activeBacklogs || 0);
  const penalty = Math.min(safeBacklogs * 10, 30);
  const score = (safeCgpa / 10) * 100 - penalty;
  return Number(Math.max(0, Math.min(100, score)).toFixed(2));
}

/**
 * Computes Cosine Similarity between candidate vector V_s and role requirements V_role.
 * CosSim = sum(V_s[k] * V_r[k]) / (sqrt(sum(V_s[k]^2)) * sqrt(sum(V_r[k]^2)))
 * Returns a scalar in [0, 1] rounded to 4 decimals.
 */
export function computeCosineSimilarity(
  vStudent?: Partial<SkillVector> | null,
  vRole?: Partial<SkillVector> | null
): number {
  const sVec = vStudent || {};
  const rVec = vRole || DEFAULT_ROLE_VECTOR;

  let dotProduct = 0;
  let magS = 0;
  let magR = 0;

  for (const k of SKILL_KEYS) {
    const s = Math.max(0, Math.min(10, Number(sVec[k]) || 0));
    const r = Math.max(0, Math.min(10, Number(rVec[k] ?? DEFAULT_ROLE_VECTOR[k])));
    dotProduct += s * r;
    magS += s * s;
    magR += r * r;
  }

  if (magS === 0 || magR === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(magS) * Math.sqrt(magR));
  return Number(Math.max(0, Math.min(1, similarity)).toFixed(4));
}

/**
 * Computes the per-dimension skill vector delta: V_role[k] - V_s[k]
 * Sorted descending by delta (highest deficit first).
 */
export function computeVectorDelta(
  vStudent?: Partial<SkillVector> | null,
  vRole?: Partial<SkillVector> | null
): SkillDeltaItem[] {
  const sVec = vStudent || {};
  const rVec = vRole || DEFAULT_ROLE_VECTOR;

  const deltas: SkillDeltaItem[] = SKILL_KEYS.map((k) => {
    const roleScore = Math.max(0, Math.min(10, Number(rVec[k] ?? DEFAULT_ROLE_VECTOR[k])));
    const studentScore = Math.max(0, Math.min(10, Number(sVec[k]) || 0));
    const delta = Number((roleScore - studentScore).toFixed(2));
    return {
      key: k,
      label: SKILL_LABELS[k],
      roleScore,
      studentScore,
      delta,
    };
  });

  return deltas.sort((a, b) => b.delta - a.delta);
}

/**
 * Computes Explainable Placement Readiness Index (PRI) Matrix:
 * PRI(i) = 0.20 * E_academic(i) + 0.50 * E_practical(i) + 0.30 * E_eval(i)
 */
export function calculatePRI(input: PRICalculationInput): PRIEvaluationResult {
  const threshold = input.threshold !== undefined && input.threshold !== null ? Number(input.threshold) : 70.0;
  const eAcademic = Number(Math.max(0, Math.min(100, input.eAcademic || 0)).toFixed(2));
  const ePractical = Number(Math.max(0, Math.min(100, input.ePractical || 0)).toFixed(2));
  const eEval = Number(Math.max(0, Math.min(100, input.eEval || 0)).toFixed(2));

  const rawPri = 0.2 * eAcademic + 0.5 * ePractical + 0.3 * eEval;
  const priScore = Number(Math.max(0, Math.min(100, rawPri)).toFixed(2));

  const roleVector: SkillVector = {
    dsa: input.vRole?.dsa ?? DEFAULT_ROLE_VECTOR.dsa,
    system_design: input.vRole?.system_design ?? DEFAULT_ROLE_VECTOR.system_design,
    backend_apis: input.vRole?.backend_apis ?? DEFAULT_ROLE_VECTOR.backend_apis,
    databases: input.vRole?.databases ?? DEFAULT_ROLE_VECTOR.databases,
    cloud_devops: input.vRole?.cloud_devops ?? DEFAULT_ROLE_VECTOR.cloud_devops,
    frontend_ui: input.vRole?.frontend_ui ?? DEFAULT_ROLE_VECTOR.frontend_ui,
    testing_cicd: input.vRole?.testing_cicd ?? DEFAULT_ROLE_VECTOR.testing_cicd,
    cs_fundamentals: input.vRole?.cs_fundamentals ?? DEFAULT_ROLE_VECTOR.cs_fundamentals,
  };

  const studentVector: SkillVector = {
    dsa: Math.max(0, Math.min(10, Number(input.vStudent?.dsa) || 0)),
    system_design: Math.max(0, Math.min(10, Number(input.vStudent?.system_design) || 0)),
    backend_apis: Math.max(0, Math.min(10, Number(input.vStudent?.backend_apis) || 0)),
    databases: Math.max(0, Math.min(10, Number(input.vStudent?.databases) || 0)),
    cloud_devops: Math.max(0, Math.min(10, Number(input.vStudent?.cloud_devops) || 0)),
    frontend_ui: Math.max(0, Math.min(10, Number(input.vStudent?.frontend_ui) || 0)),
    testing_cicd: Math.max(0, Math.min(10, Number(input.vStudent?.testing_cicd) || 0)),
    cs_fundamentals: Math.max(0, Math.min(10, Number(input.vStudent?.cs_fundamentals) || 0)),
  };

  const cosineSimilarity = computeCosineSimilarity(studentVector, roleVector);
  const vectorDelta = computeVectorDelta(studentVector, roleVector);
  const belowThreshold = priScore < threshold;
  const topGaps = vectorDelta.filter((d) => d.delta > 0);

  return {
    priScore,
    eAcademic,
    ePractical,
    eEval,
    threshold,
    belowThreshold,
    cosineSimilarity,
    studentVector,
    roleVector,
    vectorDelta,
    topGaps,
  };
}


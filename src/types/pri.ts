export type SkillDimensionKey =
  | 'dsa'
  | 'system_design'
  | 'backend_apis'
  | 'databases'
  | 'cloud_devops'
  | 'frontend_ui'
  | 'testing_cicd'
  | 'cs_fundamentals';

export type SkillVector = Record<SkillDimensionKey, number>;

export interface SkillDeltaItem {
  key: SkillDimensionKey;
  label: string;
  roleScore: number;
  studentScore: number;
  delta: number; // roleScore - studentScore (positive indicates deficit)
}

export interface PRICalculationInput {
  eAcademic: number;
  ePractical: number;
  eEval: number;
  threshold?: number;
  vStudent?: Partial<SkillVector> | null;
  vRole?: Partial<SkillVector> | null;
}

export interface PRIEvaluationResult {
  priScore: number;
  eAcademic: number;
  ePractical: number;
  eEval: number;
  threshold: number;
  belowThreshold: boolean;
  cosineSimilarity: number;
  studentVector: SkillVector;
  roleVector: SkillVector;
  vectorDelta: SkillDeltaItem[];
  topGaps: SkillDeltaItem[];
}

export interface PRISnapshot {
  priScore: number;
  threshold: number;
  belowThreshold: boolean;
  eAcademic: number;
  ePractical: number;
  eEval: number;
  cosineSimilarity: number;
  studentVector?: Partial<SkillVector>;
  roleVector?: Partial<SkillVector>;
  vectorDelta?: SkillDeltaItem[];
  pri_score?: number;
  e_academic?: number;
  e_practical?: number;
  e_eval?: number;
  cosine_similarity?: number;
  student_vector?: Partial<SkillVector>;
  role_vector?: Partial<SkillVector>;
  vector_delta?: SkillDeltaItem[];
}

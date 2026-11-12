export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';

export interface StudentProject {
  title: string;
  techStack?: string[];
  description?: string;
  githubUrl?: string;
  liveUrl?: string;
}

export interface RecommendedProjectBlueprint {
  title: string;
  difficulty: ProjectDifficulty;
  estimatedHours: number;
  problemStatement: string;
  existingSkillsUsed: string[];
  missingSkillsTargeted: string[];
  mvpMilestones: string[];
  resumeBulletPoints: string[];
  suitabilityScore: number;
}

export interface ProjectRecommendationResult {
  skillGapReasoning: string;
  recommendedProjects: RecommendedProjectBlueprint[];
  modelUsed?: string;
  cached?: boolean;
}

export type PortfolioSuitabilityLevel =
  | 'EMPTY'
  | 'INSUFFICIENT_PROJECTS'
  | 'UNSUITABLE_FOR_ROLE'
  | 'SUITABLE';

export interface PortfolioSuitabilityResult {
  level: PortfolioSuitabilityLevel;
  badgeText: string;
  badgeColor: 'amber' | 'rose' | 'purple' | 'emerald';
  reason: string;
  needsRecommendation: boolean;
  totalProjects: number;
  demonstratedSkills: string[];
  missingRoleSkills: string[];
}

export interface GenerateProjectsInput {
  companyName: string;
  roleTitle: string;
  jobDescription?: string;
  matchedSkills: string[];
  missingSkills: string[];
  existingProjects?: StudentProject[];
}


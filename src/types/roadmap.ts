export type SkillDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface ResourceLink {
  title: string;
  url: string;
  source: string; // e.g. "MDN Web Docs", "Official Postgres Docs", "freeCodeCamp", "NeetCode"
  type: 'YOUTUBE' | 'DOCUMENTATION';
}

export interface RoadmapMilestone {
  id: string;
  milestoneNumber: number;
  skillName: string;
  category: string; // e.g., "Algorithms & Data Structures", "Backend Systems", "Distributed Systems", "Cloud & DevOps"
  difficulty: SkillDifficulty;
  durationWeeks: number; // Easy: 1-2, Medium: 3-6, Hard: 8-12
  estimatedHours: number;
  description: string;
  topics: string[];
  youtubeResources: ResourceLink[];
  documentationResources: ResourceLink[];
  practicalProject: string;
  starterCodeSnippet?: string;
  language?: 'python' | 'javascript' | 'cpp';
  completed?: boolean;
}

export interface CandidateRoadmap {
  id: string;
  studentId: string;
  applicationId?: string;
  companyName: string;
  roleTitle: string;
  targetRole: string;
  totalDurationWeeks: number;
  missingSkills: string[];
  milestones: RoadmapMilestone[];
  createdAt: string;
}

export interface CurriculumDeficitCluster {
  clusterName: string;
  domain: string;
  skills: string[];
  affectedStudentsCount: number;
  rejectionFrequencyPercent: number;
  currentSyllabusStatus: string;
  recommendedAction: string;
  marketRoleDemand: string[];
}

import {
  StudentProject,
  PortfolioSuitabilityResult,
} from '@/types/projects';
import {
  extractDriveRequiredSkills,
  normalizeSkills,
} from '@/lib/compatibility-matcher';

/**
 * Evaluates whether a student's portfolio has enough depth (project count)
 * AND whether their existing projects are suitable/relevant for a target placement drive.
 *
 * Rules:
 * 1. EMPTY (0 projects):
 *    -> Student has no project artifacts on resume.
 * 2. INSUFFICIENT_PROJECTS (1 project):
 *    -> Student has not enough projects. Campus recruiters expect at least 2-3 substantive projects.
 * 3. UNSUITABLE_FOR_ROLE (>= 2 projects, but low/no relevance):
 *    -> Student has projects, but none of them demonstrate the core technologies or domain of the role
 *       (e.g., student has only frontend/HTML projects while applying for Data Scientist or Systems Engineer).
 * 4. SUITABLE (>= 2 projects and at least 1 project matches key role skills/domain):
 *    -> Portfolio aligns well with the job requirements.
 */
export function evaluatePortfolioSuitabilityForDrive(
  projects: StudentProject[] = [],
  drive: {
    role_title?: string;
    company_name?: string;
    description?: string | null;
    required_skills?: string[];
  },
  compatibility?: {
    matchedSkills?: string[];
    missingSkills?: string[];
  }
): PortfolioSuitabilityResult {
  const totalProjects = projects.length;

  // Case 1: 0 Projects
  if (totalProjects === 0) {
    return {
      level: 'EMPTY',
      badgeText: '⚠️ 0 Projects on Resume',
      badgeColor: 'rose',
      reason:
        'No technical projects detected on your resume. Hands-on code artifacts are critical for recruiter shortlisting.',
      needsRecommendation: true,
      totalProjects: 0,
      demonstratedSkills: [],
      missingRoleSkills: compatibility?.missingSkills || [],
    };
  }

  // Case 2: Only 1 Project (< 2 Projects)
  if (totalProjects === 1) {
    const singleTitle = projects[0]?.title || 'Single Project';
    return {
      level: 'INSUFFICIENT_PROJECTS',
      badgeText: '⚠️ Limited Portfolio (1 Project)',
      badgeColor: 'amber',
      reason: `You have only 1 project ("${singleTitle}"). Recruiters for ${
        drive.company_name || 'this role'
      } expect at least 2-3 substantive projects demonstrating diverse engineering depth.`,
      needsRecommendation: true,
      totalProjects: 1,
      demonstratedSkills: normalizeSkills(projects[0]?.techStack || []),
      missingRoleSkills: compatibility?.missingSkills || [],
    };
  }

  // Case 3 & 4: 2 or more projects. Now check domain & tech stack suitability for THIS specific role!
  const driveSkills = extractDriveRequiredSkills(drive);
  const targetRequiredSkills = normalizeSkills([
    ...driveSkills,
    ...(compatibility?.matchedSkills || []),
    ...(compatibility?.missingSkills || []),
  ]);

  const targetRoleTitle = (drive.role_title || '').toLowerCase();
  const demonstratedSkillSet = new Set<string>();

  let maxSkillsMatchedInSingleProject = 0;

  for (const proj of projects) {
    const projTech = normalizeSkills(proj.techStack || []);
    const projText = `${proj.title || ''} ${proj.description || ''} ${projTech.join(' ')}`.toLowerCase();

    let skillsMatchedInThisProject = 0;

    for (const reqSkill of targetRequiredSkills) {
      const cleanReq = reqSkill.toLowerCase();
      // Check if skill is explicitly in project tech stack or mentioned in project description/title
      const isPresent =
        projTech.some((t) => t.toLowerCase() === cleanReq) ||
        projText.includes(cleanReq);

      if (isPresent) {
        demonstratedSkillSet.add(reqSkill);
        skillsMatchedInThisProject++;
      }
    }

    if (skillsMatchedInThisProject > maxSkillsMatchedInSingleProject) {
      maxSkillsMatchedInSingleProject = skillsMatchedInThisProject;
    }
  }

  const demonstratedSkills = Array.from(demonstratedSkillSet);
  const missingRoleSkills = targetRequiredSkills.filter(
    (s) => !demonstratedSkillSet.has(s)
  );

  // Check role domain keywords if required skills are sparse
  const isDataRole =
    targetRoleTitle.includes('data') ||
    targetRoleTitle.includes('ml') ||
    targetRoleTitle.includes('ai') ||
    targetRoleTitle.includes('machine learning');
  const isMobileRole =
    targetRoleTitle.includes('android') ||
    targetRoleTitle.includes('ios') ||
    targetRoleTitle.includes('flutter');
  const isCloudDevOpsRole =
    targetRoleTitle.includes('devops') ||
    targetRoleTitle.includes('cloud') ||
    targetRoleTitle.includes('sre');

  let domainMatchFound = false;
  if (isDataRole || isMobileRole || isCloudDevOpsRole) {
    for (const proj of projects) {
      const text = `${proj.title} ${proj.description} ${(proj.techStack || []).join(' ')}`.toLowerCase();
      if (
        isDataRole &&
        (text.includes('data') ||
          text.includes('analytics') ||
          text.includes('ml') ||
          text.includes('python') ||
          text.includes('sql') ||
          text.includes('model') ||
          text.includes('dataset'))
      ) {
        domainMatchFound = true;
        break;
      }
      if (
        isMobileRole &&
        (text.includes('android') ||
          text.includes('flutter') ||
          text.includes('kotlin') ||
          text.includes('ios') ||
          text.includes('react native') ||
          text.includes('mobile'))
      ) {
        domainMatchFound = true;
        break;
      }
      if (
        isCloudDevOpsRole &&
        (text.includes('docker') ||
          text.includes('kubernetes') ||
          text.includes('aws') ||
          text.includes('ci/cd') ||
          text.includes('cloud') ||
          text.includes('terraform'))
      ) {
        domainMatchFound = true;
        break;
      }
    }
  } else {
    // For general software/web/backend roles, having matched skills is sufficient
    domainMatchFound = demonstratedSkills.length > 0;
  }

  // If NO skills or domain match is covered, or candidate has 0 relevant projects for this role
  const isUnsuitableForRole =
    (!domainMatchFound && demonstratedSkills.length === 0) ||
    (targetRequiredSkills.length >= 3 && demonstratedSkills.length === 0) ||
    (maxSkillsMatchedInSingleProject === 0 && demonstratedSkills.length <= 1);

  if (isUnsuitableForRole) {
    const keyMissing = (missingRoleSkills.length > 0 ? missingRoleSkills : targetRequiredSkills).slice(0, 3);
    const missingStr = keyMissing.length > 0 ? keyMissing.join(', ') : 'core technical stack';

    return {
      level: 'UNSUITABLE_FOR_ROLE',
      badgeText: '⚡ Portfolio Gap for this Role',
      badgeColor: 'purple',
      reason: `You have ${totalProjects} project(s), but none demonstrate the key technologies (${missingStr}) required for ${
        drive.company_name || 'this company'
      } - ${drive.role_title || 'this role'}.`,
      needsRecommendation: true,
      totalProjects,
      demonstratedSkills,
      missingRoleSkills,
    };
  }

  // Case 4: Suitable
  return {
    level: 'SUITABLE',
    badgeText: '✓ Portfolio Aligned',
    badgeColor: 'emerald',
    reason: `Your portfolio includes projects demonstrating relevant technologies (${demonstratedSkills
      .slice(0, 3)
      .join(', ')}) for ${drive.role_title || 'this position'}.`,
    needsRecommendation: false,
    totalProjects,
    demonstratedSkills,
    missingRoleSkills,
  };
}

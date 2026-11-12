/**
 * CampusLink AI Placement Compatibility & Job Suitability Matcher
 * Computes deterministic and semantic match scores between student resume skills
 * and placement drive requirements, ranking jobs from best to least suited.
 */

export interface CompatibilityEvaluation {
  driveId: string;
  score: number; // 0 - 100
  rating: 'EXCEPTIONAL' | 'STRONG' | 'MODERATE' | 'DEVELOPING';
  ratingLabel: string;
  matchedSkills: string[];
  missingSkills: string[];
  studentExtraSkills: string[];
  totalRequiredCount: number;
  cgpaEligible: boolean;
  backlogEligible: boolean;
  summary: string;
  remediationPath?: string;
}

export interface RankedPlacementDrive {
  id: string;
  company_name: string;
  role_title: string;
  tier: 'TIER_1' | 'TIER_2' | 'TIER_3' | string;
  min_ctc: number;
  max_ctc: number;
  cgpa_cutoff: number;
  status: string;
  description?: string | null;
  drive_date?: string | null;
  deadline?: string | null;
  required_skills?: string[];
  compatibility: CompatibilityEvaluation;
  suitabilityRank: number;
  [key: string]: any;
}

// Canonical Skill Dictionary & Synonyms
const CANONICAL_SKILL_MAP: Record<string, string> = {
  // Languages
  'js': 'JavaScript',
  'javascript': 'JavaScript',
  'ts': 'TypeScript',
  'typescript': 'TypeScript',
  'py': 'Python',
  'python': 'Python',
  'python3': 'Python',
  'java': 'Java',
  'c++': 'C++',
  'cpp': 'C++',
  'c': 'C',
  'c#': 'C#',
  'csharp': 'C#',
  'golang': 'Go',
  'go': 'Go',
  'rust': 'Rust',
  'kotlin': 'Kotlin',
  'swift': 'Swift',
  'sql': 'SQL',
  'bash': 'Bash',
  'shell': 'Bash',

  // Frontend
  'react': 'React',
  'reactjs': 'React',
  'react.js': 'React',
  'next': 'Next.js',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vuejs': 'Vue.js',
  'angular': 'Angular',
  'redux': 'Redux',
  'zustand': 'Zustand',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'html': 'HTML/CSS',
  'css': 'HTML/CSS',
  'html5': 'HTML/CSS',
  'css3': 'HTML/CSS',
  'html/css': 'HTML/CSS',

  // Backend & Architecture
  'node': 'Node.js',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'express': 'Express.js',
  'expressjs': 'Express.js',
  'spring': 'Spring Boot',
  'springboot': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'django': 'Django',
  'fastapi': 'FastAPI',
  'flask': 'Flask',
  'nest': 'NestJS',
  'nestjs': 'NestJS',
  'rest': 'REST APIs',
  'restful': 'REST APIs',
  'rest apis': 'REST APIs',
  'rest api': 'REST APIs',
  'graphql': 'GraphQL',
  'microservices': 'Microservices',
  'system design': 'System Design',
  'system-design': 'System Design',
  'high level design': 'System Design',
  'low level design': 'System Design',

  // Data & DBs
  'postgres': 'PostgreSQL',
  'postgresql': 'PostgreSQL',
  'mysql': 'MySQL',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'redis': 'Redis',
  'prisma': 'Prisma',
  'supabase': 'Supabase',
  'dynamodb': 'DynamoDB',
  'cassandra': 'Cassandra',

  // DevOps & Cloud
  'docker': 'Docker',
  'k8s': 'Kubernetes',
  'kubernetes': 'Kubernetes',
  'aws': 'AWS',
  'amazon web services': 'AWS',
  'gcp': 'Google Cloud',
  'google cloud': 'Google Cloud',
  'azure': 'Azure',
  'ci/cd': 'CI/CD',
  'cicd': 'CI/CD',
  'linux': 'Linux',
  'terraform': 'Terraform',
  'git': 'Git',
  'github': 'Git',

  // Core CS & Algorithms
  'dsa': 'Data Structures & Algorithms',
  'data structures': 'Data Structures & Algorithms',
  'algorithms': 'Data Structures & Algorithms',
  'problem solving': 'Data Structures & Algorithms',
  'competitive programming': 'Data Structures & Algorithms',
  'oop': 'Object Oriented Programming',
  'oops': 'Object Oriented Programming',
  'object oriented programming': 'Object Oriented Programming',
  'dbms': 'DBMS',
  'operating systems': 'Operating Systems',
  'os': 'Operating Systems',
  'computer networks': 'Computer Networks',
  'cn': 'Computer Networks',

  // AI & Data Science
  'machine learning': 'Machine Learning',
  'ml': 'Machine Learning',
  'deep learning': 'Deep Learning',
  'nlp': 'Natural Language Processing',
  'computer vision': 'Computer Vision',
  'cv': 'Computer Vision',
  'pandas': 'Pandas',
  'numpy': 'NumPy',
  'tensorflow': 'TensorFlow',
  'pytorch': 'PyTorch',
  'scikit-learn': 'Scikit-Learn',
};

// Role archetypes to infer foundational skills if drive description has few details
const ROLE_ARCHETYPES: Array<{ keywords: string[]; skills: string[] }> = [
  {
    keywords: ['frontend', 'react', 'ui engineer', 'web developer', 'angular', 'vue'],
    skills: ['React', 'JavaScript', 'TypeScript', 'HTML/CSS', 'Next.js', 'Redux', 'Tailwind CSS', 'Git'],
  },
  {
    keywords: ['backend', 'sde', 'software engineer', 'software development engineer', 'java developer', 'api engineer'],
    skills: ['Data Structures & Algorithms', 'Java', 'Python', 'SQL', 'REST APIs', 'System Design', 'Git'],
  },
  {
    keywords: ['full stack', 'fullstack', 'mern', 'mean'],
    skills: ['React', 'Node.js', 'JavaScript', 'TypeScript', 'SQL', 'MongoDB', 'REST APIs', 'Git'],
  },
  {
    keywords: ['cloud', 'devops', 'sre', 'infrastructure', 'platform engineer', 'site reliability'],
    skills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Git', 'Python', 'Terraform'],
  },
  {
    keywords: ['data scientist', 'data science', 'machine learning', 'ai engineer', 'ml engineer', 'data analyst'],
    skills: ['Python', 'SQL', 'Machine Learning', 'Pandas', 'NumPy', 'Data Structures & Algorithms'],
  },
  {
    keywords: ['android', 'ios', 'mobile developer', 'flutter', 'react native', 'mobile app'],
    skills: ['Java', 'Kotlin', 'REST APIs', 'Data Structures & Algorithms', 'Git', 'Android'],
  },
  {
    keywords: ['qa', 'test', 'automation engineer', 'sdet', 'quality assurance'],
    skills: ['Java', 'Python', 'Selenium', 'SQL', 'REST APIs', 'Git'],
  },
];

/**
 * Normalizes a raw skill string to its canonical display name
 */
export function normalizeSkill(skill: string): string {
  if (!skill) return '';
  const clean = skill.trim().toLowerCase();
  if (CANONICAL_SKILL_MAP[clean]) {
    return CANONICAL_SKILL_MAP[clean];
  }
  // Try stripped punctuation
  const stripped = clean.replace(/[^a-z0-9+#]/g, '');
  if (CANONICAL_SKILL_MAP[stripped]) {
    return CANONICAL_SKILL_MAP[stripped];
  }
  // Return title-cased fallback
  return skill
    .split(' ')
    .map((w) => (w.length > 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : ''))
    .join(' ');
}

/**
 * Normalizes an array of skills, deduping and canonicalizing them
 */
export function normalizeSkills(skills: string[] = []): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const s of skills) {
    const norm = normalizeSkill(s);
    if (norm && !seen.has(norm.toLowerCase())) {
      seen.add(norm.toLowerCase());
      normalized.push(norm);
    }
  }

  return normalized;
}

/**
 * Extracts required technical skills for a placement drive using:
 * 1. Explicit `required_skills` column if set
 * 2. Role archetype inferences from `role_title`
 * 3. Text analysis of `description`
 */
export function extractDriveRequiredSkills(drive: {
  role_title?: string;
  description?: string | null;
  required_skills?: string[];
  tier?: string;
}): string[] {
  const extracted = new Set<string>();

  // 1. If explicit required_skills array provided
  if (Array.isArray(drive.required_skills) && drive.required_skills.length > 0) {
    for (const s of drive.required_skills) {
      extracted.add(normalizeSkill(s));
    }
  }

  // 2. Role Title Archetype Inference
  const titleLower = (drive.role_title || '').toLowerCase();
  for (const arch of ROLE_ARCHETYPES) {
    if (arch.keywords.some((kw) => titleLower.includes(kw))) {
      for (const s of arch.skills) {
        extracted.add(s);
      }
      break;
    }
  }

  // 3. Scan description for known skill keys
  const descLower = (drive.description || '').toLowerCase();
  if (descLower.length > 10) {
    for (const [key, canonical] of Object.entries(CANONICAL_SKILL_MAP)) {
      // Look for whole-word or delimited matches
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, 'i');
      if (regex.test(descLower)) {
        extracted.add(canonical);
      }
    }
  }

  // 4. Default fallback if nothing was matched
  if (extracted.size === 0) {
    const fallback = ['Data Structures & Algorithms', 'Python', 'Java', 'SQL', 'Git'];
    for (const f of fallback) extracted.add(f);
  }

  return Array.from(extracted);
}

/**
 * Evaluates the compatibility between a student's resume skills and a placement drive.
 * Returns a 0-100 score, categorized rating, matched skills, missing skill gaps, and guidance.
 */
export function calculateJobCompatibility(
  drive: {
    id: string;
    role_title: string;
    company_name?: string;
    description?: string | null;
    required_skills?: string[];
    tier?: string;
    cgpa_cutoff?: number;
  },
  studentSkills: string[] = [],
  studentCgpa?: number | null,
  studentBacklogs: number = 0
): CompatibilityEvaluation {
  const normalizedStudent = normalizeSkills(studentSkills);
  const studentSkillSet = new Set(normalizedStudent.map((s) => s.toLowerCase()));

  const requiredSkills = extractDriveRequiredSkills(drive);
  const totalRequired = requiredSkills.length;

  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const req of requiredSkills) {
    const reqLower = req.toLowerCase();
    // Direct match or partial token match (e.g., "React" matches "React.js")
    const isMatched =
      studentSkillSet.has(reqLower) ||
      Array.from(studentSkillSet).some(
        (st) => st.includes(reqLower) || reqLower.includes(st)
      );

    if (isMatched) {
      matchedSkills.push(req);
    } else {
      missingSkills.push(req);
    }
  }

  const studentExtraSkills = normalizedStudent.filter(
    (st) => !matchedSkills.some((m) => m.toLowerCase() === st.toLowerCase())
  );

  // --- Scoring Formula ---
  // Base skill match ratio (0.0 to 1.0)
  const matchRatio = totalRequired > 0 ? matchedSkills.length / totalRequired : 0.5;

  // 1. Skill Score out of 80 points
  let skillPoints = matchRatio * 80;

  // 2. Extra technical depth bonus (up to 15 points)
  const depthBonus = Math.min(15, studentExtraSkills.length * 3);

  // 3. Drive Tier stringency adjustment
  let tierBase = 5;
  if (drive.tier === 'TIER_1') {
    tierBase = 3; // Tier 1 has higher bar
  } else if (drive.tier === 'TIER_3') {
    tierBase = 7;
  }

  // Total raw score
  let rawScore = Math.round(skillPoints + depthBonus + tierBase);

  // Baseline floor if candidate has some tech skills but 0 direct match
  if (matchedSkills.length === 0) {
    rawScore = studentSkills.length > 0 ? 25 : 15;
  }

  // Academic cutoff check
  const cgpaCutoff = drive.cgpa_cutoff ?? 6.0;
  const isCgpaEligible = studentCgpa !== undefined && studentCgpa !== null ? studentCgpa >= cgpaCutoff : true;
  const isBacklogEligible = studentBacklogs <= 0;

  // Slight score moderation if academic cutoff is not met
  if (!isCgpaEligible) {
    rawScore = Math.max(10, rawScore - 12);
  }
  if (!isBacklogEligible) {
    rawScore = Math.max(10, rawScore - 8);
  }

  // Clamp 0 to 98 (keep 100 for verified perfect alignments)
  const finalScore = Math.min(
    matchRatio === 1 && isCgpaEligible && isBacklogEligible ? 99 : 96,
    Math.max(10, rawScore)
  );

  // Rating Tiering
  let rating: CompatibilityEvaluation['rating'] = 'DEVELOPING';
  let ratingLabel = 'Skill Gap';

  if (finalScore >= 85) {
    rating = 'EXCEPTIONAL';
    ratingLabel = 'Exceptional Match';
  } else if (finalScore >= 70) {
    rating = 'STRONG';
    ratingLabel = 'Strong Fit';
  } else if (finalScore >= 50) {
    rating = 'MODERATE';
    ratingLabel = 'Moderate Match';
  } else {
    rating = 'DEVELOPING';
    ratingLabel = 'Gap Area';
  }

  // Concise natural summary
  let summary = '';
  if (finalScore >= 85) {
    summary = `High alignment! Your resume covers ${matchedSkills.length} key requirements including ${matchedSkills.slice(0, 3).join(', ')}.`;
  } else if (finalScore >= 70) {
    summary = `Solid match. You possess strong foundational skills in ${matchedSkills.slice(0, 2).join(', ')}. Bridge ${missingSkills.slice(0, 2).join(' & ')} to maximize OA success.`;
  } else if (finalScore >= 50) {
    summary = `Moderate overlap. You align with ${matchedSkills.join(', ') || 'general criteria'}, but this role requires depth in ${missingSkills.slice(0, 3).join(', ')}.`;
  } else {
    summary = `Significant skill ramp-up needed. Target role expects ${missingSkills.slice(0, 3).join(', ')}.`;
  }

  const prepTargetSkill = missingSkills[0] || (requiredSkills[0] ?? 'Data Structures & Algorithms');
  const missingParam = missingSkills.length > 0 ? `&missingSkills=${encodeURIComponent(missingSkills.join(','))}` : '';
  const remediationPath = `/student/remediation?role=${encodeURIComponent(
    drive.role_title
  )}&company=${encodeURIComponent(
    drive.company_name || ''
  )}&topic=${encodeURIComponent(
    prepTargetSkill
  )}${missingParam}&autoGenerate=true`;

  return {
    driveId: drive.id,
    score: finalScore,
    rating,
    ratingLabel,
    matchedSkills,
    missingSkills,
    studentExtraSkills,
    totalRequiredCount: totalRequired,
    cgpaEligible: isCgpaEligible,
    backlogEligible: isBacklogEligible,
    summary,
    remediationPath,
  };
}

/**
 * Takes an array of placement drives, scores each against the student's skills,
 * and sorts them from best suited to least suited.
 */
export function rankDrivesForStudent(
  drives: any[],
  studentSkills: string[] = [],
  studentCgpa?: number | null,
  studentBacklogs: number = 0
): RankedPlacementDrive[] {
  const evaluated: RankedPlacementDrive[] = drives.map((drive) => {
    const compatibility = calculateJobCompatibility(
      drive,
      studentSkills,
      studentCgpa,
      studentBacklogs
    );
    return {
      ...drive,
      compatibility,
      suitabilityRank: 0,
    };
  });

  // Sort: Primary by score descending, secondary by max_ctc descending, tertiary by cgpa_cutoff descending
  evaluated.sort((a, b) => {
    if (b.compatibility.score !== a.compatibility.score) {
      return b.compatibility.score - a.compatibility.score;
    }
    const ctcB = Number(b.max_ctc) || 0;
    const ctcA = Number(a.max_ctc) || 0;
    if (ctcB !== ctcA) {
      return ctcB - ctcA;
    }
    const cutoffB = Number(b.cgpa_cutoff) || 0;
    const cutoffA = Number(a.cgpa_cutoff) || 0;
    return cutoffB - cutoffA;
  });

  // Assign sequential 1-based ranks
  return evaluated.map((drive, idx) => ({
    ...drive,
    suitabilityRank: idx + 1,
  }));
}


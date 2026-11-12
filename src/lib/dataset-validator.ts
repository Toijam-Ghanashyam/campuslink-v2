export interface DatasetStudentRow {
  id?: string;
  roll_number: string;
  full_name: string;
  email?: string;
  branch: string;
  batch_year: number;
  cgpa: number;
  active_backlogs: number;
}

export interface StudentSubmissionInput {
  roll_number: string;
  full_name: string;
  email?: string;
  branch: string;
  batch_year: number;
  cgpa: number;
  active_backlogs: number;
}

export interface DatasetValidationResult {
  matched: boolean;
  recordFound: boolean;
  mismatches: string[];
  mismatchSummary: string | null;
  officialRecord?: DatasetStudentRow;
}

const CANONICAL_BRANCHES = [
  'Computer Science & Engineering',
  'Information Technology',
  'Electronics & Telecommunication',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
];

export function normalizeBranchName(rawBranch: string): string {
  const b = (rawBranch || '').trim().toLowerCase();
  if (!b) return 'Computer Science & Engineering';

  if (b === 'cse' || b.includes('computer') || b.includes('cs&e') || b.includes('cs')) {
    return 'Computer Science & Engineering';
  }
  if (b === 'it' || b.includes('information technology')) {
    return 'Information Technology';
  }
  if (b === 'etc' || b === 'ece' || b.includes('electronics') || b.includes('telecommunication')) {
    return 'Electronics & Telecommunication';
  }
  if (b === 'ee' || b === 'eee' || b.includes('electrical')) {
    return 'Electrical Engineering';
  }
  if (b === 'me' || b === 'mech' || b.includes('mechanical')) {
    return 'Mechanical Engineering';
  }
  if (b === 'ce' || b === 'civil' || b.includes('civil')) {
    return 'Civil Engineering';
  }

  const exact = CANONICAL_BRANCHES.find((cb) => cb.toLowerCase() === b);
  return exact || rawBranch.trim();
}

export function normalizeText(val?: string | null): string {
  return (val || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

export function normalizeRoll(val?: string | null): string {
  return (val || '')
    .trim()
    .replace(/\s+/g, '')
    .toUpperCase();
}

/**
 * Compares a student's registration/profile data against the college's master dataset rows.
 */
export function validateStudentAgainstDataset(
  student: StudentSubmissionInput,
  datasetRows: DatasetStudentRow[]
): DatasetValidationResult {
  const cleanStudentRoll = normalizeRoll(student.roll_number);
  const cleanStudentEmail = normalizeText(student.email);

  // 1. Try finding record by Roll Number first
  let record = datasetRows.find(
    (r) => normalizeRoll(r.roll_number) === cleanStudentRoll
  );

  // 2. If not found by Roll Number, check if email exists in dataset (meaning student typed wrong Roll Number)
  if (!record && cleanStudentEmail) {
    const emailMatch = datasetRows.find(
      (r) => r.email && normalizeText(r.email) === cleanStudentEmail
    );
    if (emailMatch) {
      record = emailMatch;
    }
  }

  if (!record) {
    const msg = `Roll Number / ID (${student.roll_number || 'Missing'}) was not found in your college's official placement dataset. Please fix your Roll Number or contact your TPO.`;
    return {
      matched: false,
      recordFound: false,
      mismatches: [msg],
      mismatchSummary: msg,
    };
  }

  const mismatches: string[] = [];

  // Check 1: Roll Number (in case matched via email)
  if (normalizeRoll(record.roll_number) !== cleanStudentRoll) {
    mismatches.push(
      `Roll Number / ID Mismatch: You entered "${student.roll_number}", but official college record shows "${record.roll_number}".`
    );
  }

  // Check 2: Student Full Name
  if (normalizeText(record.full_name) !== normalizeText(student.full_name)) {
    mismatches.push(
      `Student Name Mismatch: You entered "${student.full_name}", but official college record shows "${record.full_name}".`
    );
  }

  // Check 3: Email (only if official record specifies a non-empty email)
  if (
    record.email &&
    record.email.trim() !== '' &&
    cleanStudentEmail &&
    normalizeText(record.email) !== cleanStudentEmail
  ) {
    mismatches.push(
      `Email Mismatch: You registered with "${student.email}", but official college record specifies "${record.email}".`
    );
  }

  // Check 4: Branch / Department
  const normStudentBranch = normalizeBranchName(student.branch);
  const normOfficialBranch = normalizeBranchName(record.branch);
  if (normalizeText(normStudentBranch) !== normalizeText(normOfficialBranch)) {
    mismatches.push(
      `Branch Mismatch: You selected "${student.branch}", but official college record shows "${normOfficialBranch}".`
    );
  }

  // Check 5: Graduation Batch Year
  if (Number(record.batch_year) !== Number(student.batch_year)) {
    mismatches.push(
      `Batch Year Mismatch: You entered "${student.batch_year}", but official college record shows "${record.batch_year}".`
    );
  }

  // Check 6: Verified CGPA (tolerance of 0.01 for floating point rounding)
  const studentCgpa = Number(student.cgpa);
  const officialCgpa = Number(record.cgpa);
  if (isNaN(studentCgpa) || Math.abs(studentCgpa - officialCgpa) > 0.01) {
    mismatches.push(
      `CGPA Mismatch: You entered ${studentCgpa.toFixed(2)}, but official college record shows ${officialCgpa.toFixed(2)}.`
    );
  }

  // Check 7: Active Backlogs
  const studentBacklogs = Number(student.active_backlogs);
  const officialBacklogs = Number(record.active_backlogs);
  if (isNaN(studentBacklogs) || studentBacklogs !== officialBacklogs) {
    mismatches.push(
      `Active Backlogs Mismatch: You entered ${studentBacklogs}, but official college record shows ${officialBacklogs}.`
    );
  }

  return {
    matched: mismatches.length === 0,
    recordFound: true,
    mismatches,
    mismatchSummary: mismatches.length > 0 ? mismatches.join(' | ') : null,
    officialRecord: record,
  };
}

/**
 * Parses CSV text into DatasetStudentRow[] with flexible column header matching
 */
export function parseStudentDatasetCsv(csvText: string): DatasetStudentRow[] {
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) return [];

  const splitCsvLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result.map((val) => val.replace(/^"|"$/g, '').trim());
  };

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().replace(/[^a-z0-9]/g, '')
  );

  const findIdx = (candidates: string[]) =>
    headers.findIndex((h) => candidates.some((c) => h === c || h.includes(c)));

  const rollIdx = findIdx(['rollnumber', 'rollno', 'roll', 'studentid', 'regno', 'registrationnumber', 'id']);
  const fullNameIdx = findIdx(['fullname', 'studentname', 'name', 'candidatename']);
  const firstNameIdx = findIdx(['firstname', 'fname']);
  const lastNameIdx = findIdx(['lastname', 'lname']);
  const emailIdx = findIdx(['email', 'emailaddress', 'mail']);
  const branchIdx = findIdx(['branch', 'department', 'dept', 'stream']);
  const batchIdx = findIdx(['batchyear', 'batch', 'graduationyear', 'passingyear', 'year']);
  const cgpaIdx = findIdx(['cgpa', 'verifiedcgpa', 'gpa', 'cpi']);
  const backlogsIdx = findIdx(['activebacklogs', 'backlogs', 'backlog', 'arrears']);

  const rows: DatasetStudentRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = splitCsvLine(lines[i]);
    if (cols.length === 0 || cols.every((c) => !c)) continue;

    const roll_number = rollIdx >= 0 ? normalizeRoll(cols[rollIdx]) : '';
    if (!roll_number) continue;

    let full_name = fullNameIdx >= 0 ? cols[fullNameIdx] : '';
    if (!full_name && (firstNameIdx >= 0 || lastNameIdx >= 0)) {
      const fn = firstNameIdx >= 0 ? cols[firstNameIdx] : '';
      const ln = lastNameIdx >= 0 ? cols[lastNameIdx] : '';
      full_name = `${fn} ${ln}`.trim();
    }

    const email = emailIdx >= 0 && cols[emailIdx] ? cols[emailIdx].trim().toLowerCase() : undefined;
    const rawBranch = branchIdx >= 0 && cols[branchIdx] ? cols[branchIdx] : 'Computer Science & Engineering';
    const branch = normalizeBranchName(rawBranch);
    const batch_year = batchIdx >= 0 && cols[batchIdx] ? parseInt(cols[batchIdx], 10) || 2026 : 2026;
    const cgpa = cgpaIdx >= 0 && cols[cgpaIdx] ? parseFloat(cols[cgpaIdx]) || 0 : 0;
    const active_backlogs = backlogsIdx >= 0 && cols[backlogsIdx] ? parseInt(cols[backlogsIdx], 10) || 0 : 0;

    rows.push({
      roll_number,
      full_name: full_name || 'Student Candidate',
      email,
      branch,
      batch_year,
      cgpa: Number(cgpa.toFixed(2)),
      active_backlogs,
    });
  }

  return rows;
}


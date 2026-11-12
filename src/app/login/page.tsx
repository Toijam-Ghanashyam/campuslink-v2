'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { registerNewUser } from '@/app/actions/auth';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';

function LoginPageContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab');
  const initialRole = searchParams?.get('role');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER' | 'TPO_ADMIN'>('STUDENT');
  const [collegeId, setCollegeId] = useState(AFFILIATED_COLLEGES[0].id);
  const [customCollegeCode, setCustomCollegeCode] = useState('');
  const [useCustomCollege, setUseCustomCollege] = useState(false);

  // Recruiter fields
  const [companyName, setCompanyName] = useState('');
  const [recruiterDesignation, setRecruiterDesignation] = useState('Senior Technical Recruiter');

  // TPO Admin fields
  const [tpoDesignation, setTpoDesignation] = useState('Head - Training & Placement (TPO)');

  // Student academic fields
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [batchYear, setBatchYear] = useState('2026');
  const [cgpa, setCgpa] = useState('7.80');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [resumeFileName, setResumeFileName] = useState('');
  const [parsedSkills, setParsedSkills] = useState<string[]>([]);
  const [parsedProjects, setParsedProjects] = useState<any[]>([]);
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState('');
  const [registrationMismatches, setRegistrationMismatches] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (initialTab === 'signup') {
      setIsSignUp(true);
    }
    if (initialRole) {
      const lower = initialRole.toLowerCase();
      if (lower.includes('recruit')) setRole('RECRUITER');
      else if (lower.includes('admin') || lower.includes('tpo')) setRole('TPO_ADMIN');
      else setRole('STUDENT');
    }
  }, [initialTab, initialRole]);

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setErrorMsg('Please upload a valid PDF document for your academic resume.');
      return;
    }

    setResumeFileName(file.name);
    setParsingResume(true);
    setErrorMsg('');
    setResumeSuccessMsg('');
    setRegistrationMismatches([]);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const json = await res.json();

      if (!res.ok || json.error) {
        setErrorMsg(json.error || 'Could not parse resume automatically. You can fill the fields manually below.');
        setParsingResume(false);
        return;
      }

      const d = json.data;
      if (d) {
        if (d.firstName) setFirstName(d.firstName);
        if (d.lastName) setLastName(d.lastName);
        if (d.email) setEmail(d.email);
        if (d.rollNumber) setRollNumber(d.rollNumber);
        if (d.branch) {
          const matchBranch = [
            'Computer Science & Engineering',
            'Information Technology',
            'Electronics & Telecommunication',
            'Electrical Engineering',
            'Mechanical Engineering',
            'Civil Engineering',
          ].find((b) => b.toLowerCase() === d.branch.toLowerCase() || d.branch.toLowerCase().includes(b.toLowerCase()));
          if (matchBranch) setBranch(matchBranch);
        }
        if (d.cgpa !== null && d.cgpa !== undefined) {
          setCgpa(String(d.cgpa));
        }
        if (d.batchYear) {
          setBatchYear(String(d.batchYear));
        }
        if (d.activeBacklogs !== undefined && d.activeBacklogs !== null) {
          setActiveBacklogs(String(d.activeBacklogs));
        }

        // Match college affiliation
        if (d.collegeCode) {
          const matched = AFFILIATED_COLLEGES.find((c) => c.code.toUpperCase() === d.collegeCode.toUpperCase());
          if (matched) {
            setCollegeId(matched.id);
            setUseCustomCollege(false);
          }
        } else if (d.collegeName) {
          const matched = AFFILIATED_COLLEGES.find((c) =>
            c.name.toLowerCase().includes(d.collegeName.toLowerCase()) ||
            d.collegeName.toLowerCase().includes(c.code.toLowerCase())
          );
          if (matched) {
            setCollegeId(matched.id);
            setUseCustomCollege(false);
          }
        }

        if (Array.isArray(d.skills) && d.skills.length > 0) {
          setParsedSkills(d.skills);
        }

        if (Array.isArray(d.projects) && d.projects.length > 0) {
          setParsedProjects(d.projects);
        }

        setResumeSuccessMsg('✨ Resume parsed with Gemini AI! Details autofilled below. Please review and verify before submitting.');
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMsg('Resume parsing timed out. Please review or fill your details manually below.');
      } else {
        setErrorMsg(err.message || 'Error parsing resume. Please fill out details manually.');
      }
    } finally {
      clearTimeout(timeoutId);
      setParsingResume(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setRegistrationMismatches([]);

    const targetCollegeId = useCustomCollege && customCollegeCode.trim()
      ? customCollegeCode.trim()
      : collegeId;

    try {
      if (isSignUp) {
        // Register new user (Student, Recruiter, or TPO Admin)
        const res = await registerNewUser({
          email,
          password,
          role,
          firstName: firstName || email.split('@')[0],
          lastName: lastName || (role === 'RECRUITER' ? 'Recruiter' : role === 'TPO_ADMIN' ? 'Admin' : 'User'),
          collegeId: targetCollegeId,
          companyName: role === 'RECRUITER' ? (companyName || 'Corporate Partner') : undefined,
          designation: role === 'RECRUITER' ? recruiterDesignation : role === 'TPO_ADMIN' ? tpoDesignation : undefined,
          rollNumber: role === 'STUDENT' ? (rollNumber || undefined) : undefined,
          branch: role === 'STUDENT' ? branch : undefined,
          batchYear: role === 'STUDENT' ? (Number(batchYear) || 2026) : undefined,
          cgpa: role === 'STUDENT' ? (parseFloat(cgpa) || 7.50) : undefined,
          activeBacklogs: role === 'STUDENT' ? (parseInt(activeBacklogs, 10) || 0) : undefined,
          resumeUrl: role === 'STUDENT' ? (resumeFileName || undefined) : undefined,
          skills: role === 'STUDENT' ? parsedSkills : undefined,
          projects: role === 'STUDENT' ? parsedProjects : undefined,
        });

        if (!res.success) {
          if (res.error === 'DATASET_MISMATCH' || (res.mismatches && res.mismatches.length > 0)) {
            const list = res.mismatches && res.mismatches.length > 0 ? res.mismatches : [res.mismatchSummary || 'Official College Registry Mismatch Detected'];
            setRegistrationMismatches(list);
            setErrorMsg('Official Placement Dataset Mismatch: The entered credentials do not match your college\'s verified registry records. Please correct the highlighted discrepancies below.');
            setLoading(false);
            window.scrollTo({ top: 120, behavior: 'smooth' });
            return;
          }

          setErrorMsg(res.error || 'Failed to create account');
          setLoading(false);
          return;
        }

        // Immediately sign in the new user
        const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          setErrorMsg(signInErr.message);
          setLoading(false);
          return;
        }

        const destination = role === 'STUDENT' ? '/student' : role === 'RECRUITER' ? '/recruiter' : '/admin';
        window.location.href = destination;
        return;
      } else {
        // Standard Sign In (Student, Recruiter, or TPO Admin)
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        // Route directly based on user's assigned role in metadata
        const userMetaRole = (authData?.user?.user_metadata?.role as string | undefined)?.toUpperCase();
        const effectiveRole = userMetaRole || role;
        const destination = effectiveRole === 'STUDENT' ? '/student' : effectiveRole === 'RECRUITER' ? '/recruiter' : '/admin';

        window.location.href = destination;
        return;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred during authentication');
      setLoading(false);
    }
  };

  const getPortalTitle = () => {
    if (!isSignUp) return 'Sign in to CampusLink';
    switch (role) {
      case 'RECRUITER':
        return '🏢 Corporate Recruiter Portal Registration';
      case 'TPO_ADMIN':
        return '🏛️ College TPO Administrator Registration';
      case 'STUDENT':
      default:
        return '🎓 New Student Candidate Registration';
    }
  };

  const getPortalSubtitle = () => {
    if (!isSignUp) return 'BPUT Central Placement & Multi-College Institutional Recruitment OS';
    switch (role) {
      case 'RECRUITER':
        return 'Create an enterprise corporate hiring account to publish drives, interview students & issue offers';
      case 'TPO_ADMIN':
        return 'Provision institutional placement cell authority to verify candidate academic profiles & coordinate drives';
      case 'STUDENT':
      default:
        return 'Upload your academic resume to automatically extract credentials & build your placement profile';
    }
  };

  const hasRollMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('roll'));
  const hasNameMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('name'));
  const hasEmailMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('email'));
  const hasBranchMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('branch'));
  const hasCgpaMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('cgpa'));
  const hasBacklogMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('backlog'));
  const hasBatchMismatch = registrationMismatches.some((m) => m.toLowerCase().includes('batch'));

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 py-10">
      <Card className={`w-full ${isSignUp ? 'max-w-2xl' : 'max-w-md'} border-slate-800 bg-slate-900 text-slate-100 shadow-2xl transition-all duration-300`}>
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 text-2xl">
            {role === 'RECRUITER' ? '💼' : role === 'TPO_ADMIN' ? '🏛️' : '🎓'}
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {getPortalTitle()}
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1 max-w-lg mx-auto">
            {getPortalSubtitle()}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Account Role Selector Pills (Shown on BOTH Sign In & Sign Up) */}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 block mb-1.5">
                {isSignUp ? 'Select Portal to Register' : 'Select Portal to Sign In'}
              </label>
              <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setRole('STUDENT');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-2 text-xs font-semibold rounded-md transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    role === 'STUDENT'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>🎓</span>
                  <span>Student</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('RECRUITER');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-2 text-xs font-semibold rounded-md transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    role === 'RECRUITER'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>🏢</span>
                  <span>Recruiter</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole('TPO_ADMIN');
                    setErrorMsg('');
                  }}
                  className={`py-2 px-2 text-xs font-semibold rounded-md transition flex flex-col sm:flex-row items-center justify-center gap-1 ${
                    role === 'TPO_ADMIN'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <span>🏛️</span>
                  <span>TPO Admin</span>
                </button>
              </div>
            </div>

            {/* ================= RECRUITER REGISTRATION FIELDS ================= */}
            {isSignUp && role === 'RECRUITER' && (
              <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-950/20 p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-900/50 pb-2">
                  <span className="text-xl">🏢</span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Corporate Hiring Organization Details
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Access BPUT verified engineering talent pools & coordinate recruitment rounds
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Hiring Company / Enterprise Name *
                    </label>
                    <Input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Google, Microsoft, TCS, Infosys"
                      className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Your Corporate Designation *
                    </label>
                    <Input
                      type="text"
                      required
                      value={recruiterDesignation}
                      onChange={(e) => setRecruiterDesignation(e.target.value)}
                      placeholder="e.g. Lead Technical Recruiter, HR Manager"
                      className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= TPO ADMIN REGISTRATION FIELDS ================= */}
            {isSignUp && role === 'TPO_ADMIN' && (
              <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-950/20 p-4 shadow-lg space-y-3">
                <div className="flex items-center gap-2 border-b border-indigo-900/50 pb-2">
                  <span className="text-xl">🏛️</span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      College Placement Cell Affiliation
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Institutional firewall will scope candidate verification strictly to your campus
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[11px] font-semibold uppercase text-slate-400">
                        Designated College Campus *
                      </label>
                      <button
                        type="button"
                        onClick={() => setUseCustomCollege(!useCustomCollege)}
                        className="text-[10px] text-indigo-400 hover:underline"
                      >
                        {useCustomCollege ? 'Choose from affiliated list' : 'Custom College Code'}
                      </button>
                    </div>

                    {useCustomCollege ? (
                      <Input
                        type="text"
                        required
                        value={customCollegeCode}
                        onChange={(e) => setCustomCollegeCode(e.target.value)}
                        placeholder="e.g. OUTR-2026 or College UUID"
                        className="border-slate-800 bg-slate-950 text-slate-100 text-xs"
                      />
                    ) : (
                      <select
                        value={collegeId}
                        onChange={(e) => setCollegeId(e.target.value)}
                        className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {AFFILIATED_COLLEGES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code}) - {c.district}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Official Institutional Designation *
                    </label>
                    <Input
                      type="text"
                      required
                      value={tpoDesignation}
                      onChange={(e) => setTpoDesignation(e.target.value)}
                      placeholder="e.g. Training & Placement Officer, HOD, Coordinator"
                      className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ================= STUDENT RESUME UPLOAD FLOW ================= */}
            {isSignUp && role === 'STUDENT' && (
              <div className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-indigo-950/20 p-4 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500 text-white text-xs font-bold">
                      1
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      Upload Resume (PDF) — Instant AI Autofill
                    </h3>
                  </div>
                  {resumeFileName && !parsingResume && (
                    <span className="text-[11px] font-medium text-emerald-400 truncate max-w-[200px] bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-800/40">
                      ✓ {resumeFileName}
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400">
                  Upload your academic resume first. Our Gemini AI engine extracts your name, roll number, college affiliation, CGPA, and branch to autofill all placeholders below.
                </p>

                <div className="relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-indigo-700/50 bg-slate-950/80 p-5 text-center hover:border-indigo-500/80 transition-colors">
                  {parsingResume ? (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                      <p className="text-xs font-semibold text-indigo-300 animate-pulse">
                        Analyzing resume text & extracting academic credentials with Gemini AI...
                      </p>
                      <p className="text-[10px] text-slate-500">Auto-matching BPUT institution, CGPA & graduation batch</p>
                      <button
                        type="button"
                        onClick={() => {
                          abortControllerRef.current?.abort();
                          setParsingResume(false);
                          setErrorMsg('Resume parsing cancelled. You can fill out your details manually below.');
                        }}
                        className="text-[11px] text-rose-400 hover:text-rose-300 underline mt-1 font-medium cursor-pointer"
                      >
                        Cancel &amp; fill manually
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 text-3xl">📄</div>
                      <label
                        htmlFor="resume-upload"
                        className="cursor-pointer text-xs font-semibold text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {resumeFileName ? 'Click to replace uploaded PDF' : 'Choose Resume PDF to Auto-Fill Form'}
                      </label>
                      <Input
                        id="resume-upload"
                        type="file"
                        accept=".pdf"
                        onChange={handleResumeUpload}
                        className="hidden"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">Accepts PDF format (up to 10MB)</p>
                    </>
                  )}
                </div>

                {resumeSuccessMsg && (
                  <div className="rounded-md border border-emerald-800/60 bg-emerald-950/40 p-2.5 text-xs text-emerald-300 flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span>{resumeSuccessMsg}</span>
                  </div>
                )}

                {parsedSkills.length > 0 && (
                  <div className="rounded-md border border-indigo-900/50 bg-indigo-950/20 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <p className="text-[11px] font-semibold text-indigo-300 flex items-center gap-1.5">
                        <span>🎯</span> Extracted Skills for Placement Matcher ({parsedSkills.length}):
                      </p>
                      <span className="text-[10px] text-slate-400">Click &times; to remove</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                      {parsedSkills.map((sk, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded bg-indigo-900/40 border border-indigo-700/50 px-2 py-0.5 text-[11px] text-indigo-200"
                        >
                          {sk}
                          <button
                            type="button"
                            onClick={() => setParsedSkills(parsedSkills.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-rose-400 font-bold ml-1"
                          >
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Basic Info: First & Last Name (On all Signups) */}
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-400">First Name *</label>
                    {hasNameMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Name Mismatch</span>}
                  </div>
                  <Input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                    }}
                    className={`mt-1 bg-slate-950 text-slate-100 ${
                      hasNameMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                    }`}
                    placeholder="e.g. Priya"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase text-slate-400">Last Name *</label>
                    {hasNameMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Name Mismatch</span>}
                  </div>
                  <Input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                    }}
                    className={`mt-1 bg-slate-950 text-slate-100 ${
                      hasNameMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                    }`}
                    placeholder="e.g. Mohanty"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase text-slate-400">
                  {role === 'RECRUITER'
                    ? 'Corporate Work Email *'
                    : role === 'TPO_ADMIN'
                    ? 'Official Institutional Email *'
                    : 'Student Email Address *'}
                </label>
                {hasEmailMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Email Mismatch</span>}
              </div>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                }}
                className={`mt-1 bg-slate-950 text-slate-100 ${
                  hasEmailMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                }`}
                placeholder={
                  role === 'RECRUITER'
                    ? 'recruiter@company.com'
                    : role === 'TPO_ADMIN'
                    ? 'tpo@college.edu'
                    : 'student@campus.edu'
                }
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Password *</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="••••••••"
              />
            </div>

            {/* Student-Specific College Selection */}
            {isSignUp && role === 'STUDENT' && (
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase text-indigo-400 flex items-center gap-1.5">
                    <span>🏛️ College / Institution Affiliation</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setUseCustomCollege(!useCustomCollege)}
                    className="text-[11px] text-slate-400 hover:text-indigo-300 underline"
                  >
                    {useCustomCollege ? 'Select from standard list' : 'Enter custom College ID / Code'}
                  </button>
                </div>

                {useCustomCollege ? (
                  <div>
                    <Input
                      type="text"
                      required
                      value={customCollegeCode}
                      onChange={(e) => setCustomCollegeCode(e.target.value)}
                      placeholder="e.g. PMEC-2026 or College UUID"
                      className="border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Enter the institutional code provided by your College Placement Cell.
                    </p>
                  </div>
                ) : (
                  <div>
                    <select
                      value={collegeId}
                      onChange={(e) => setCollegeId(e.target.value)}
                      className="w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      {AFFILIATED_COLLEGES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.code}) - {c.district}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Students are classified under this college’s TPO admin portal for verification.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Student-Specific Academic Details (Autofilled via Resume) */}
            {isSignUp && role === 'STUDENT' && (
              <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-3">
                <div className="border-b border-indigo-900/50 pb-1.5 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    🎓 Academic Profile (Autofilled from Resume)
                  </h4>
                  <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/40">
                    Verified Against Official Registry
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase text-slate-400">
                        BPUT Roll / Reg Number *
                      </label>
                      {hasRollMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Roll Mismatch</span>}
                    </div>
                    <Input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => {
                        setRollNumber(e.target.value);
                        if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                      }}
                      placeholder="e.g. TU-2023-CS104"
                      className={`mt-1 bg-slate-950 text-slate-100 text-xs ${
                        hasRollMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase text-slate-400">
                        Branch / Department *
                      </label>
                      {hasBranchMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Branch Mismatch</span>}
                    </div>
                    <select
                      value={branch}
                      onChange={(e) => {
                        setBranch(e.target.value);
                        if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                      }}
                      className={`mt-1 w-full rounded-md bg-slate-950 p-2 text-xs text-slate-100 focus:outline-none ${
                        hasBranchMismatch
                          ? 'border border-rose-500 ring-1 ring-rose-500 bg-rose-950/20'
                          : 'border border-slate-800'
                      }`}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase text-slate-400">
                        Current CGPA *
                      </label>
                      {hasCgpaMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ CGPA Mismatch</span>}
                    </div>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={cgpa}
                      onChange={(e) => {
                        setCgpa(e.target.value);
                        if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                      }}
                      placeholder="e.g. 8.25"
                      className={`mt-1 bg-slate-950 text-slate-100 text-xs ${
                        hasCgpaMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                      }`}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold uppercase text-slate-400">
                        Active Backlogs *
                      </label>
                      {hasBacklogMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Backlogs Mismatch</span>}
                    </div>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={activeBacklogs}
                      onChange={(e) => {
                        setActiveBacklogs(e.target.value);
                        if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                      }}
                      placeholder="0"
                      className={`mt-1 bg-slate-950 text-slate-100 text-xs ${
                        hasBacklogMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Graduation Batch Year *
                    </label>
                    {hasBatchMismatch && <span className="text-[10px] text-rose-400 font-bold">⚠️ Batch Mismatch</span>}
                  </div>
                  <Input
                    type="number"
                    min="2020"
                    max="2035"
                    required
                    value={batchYear}
                    onChange={(e) => {
                      setBatchYear(e.target.value);
                      if (registrationMismatches.length > 0) setRegistrationMismatches([]);
                    }}
                    placeholder="2026"
                    className={`mt-1 bg-slate-950 text-slate-100 text-xs ${
                      hasBatchMismatch ? 'border-rose-500 ring-1 ring-rose-500 bg-rose-950/20' : 'border-slate-800'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Registry Discrepancy Error Box */}
            {registrationMismatches.length > 0 && (
              <div className="rounded-xl border-2 border-rose-500/80 bg-gradient-to-br from-rose-950/90 via-rose-900/40 to-slate-950 p-4 shadow-xl text-xs space-y-3">
                <div className="flex items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 text-sm font-bold">
                    ⚠️
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-rose-200">
                        Official College Registry Mismatch Detected
                      </h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Action Required
                      </span>
                    </div>
                    <p className="text-[11px] text-rose-300/90 mt-0.5 leading-relaxed">
                      Your college placement cell has uploaded the official verified student dataset. Registration cannot proceed until the highlighted discrepancies are resolved:
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 rounded-lg border border-rose-800/40 bg-rose-950/50 p-3">
                  <p className="font-semibold text-rose-200 text-[11px] uppercase tracking-wide">
                    Discrepancy Breakdown ({registrationMismatches.length} fields):
                  </p>
                  <ul className="space-y-1.5 mt-1.5">
                    {registrationMismatches.map((m, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-rose-100 text-xs bg-rose-900/30 px-2.5 py-1.5 rounded border border-rose-800/40"
                      >
                        <span className="text-rose-400 font-bold shrink-0 mt-0.5">✕</span>
                        <span className="font-medium">{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <p className="text-[11px] text-slate-400">
                  💡 <em>Please adjust the mismatched fields highlighted in red above and re-submit your registration.</em>
                </p>
              </div>
            )}

            {errorMsg && registrationMismatches.length === 0 && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800/80 text-xs text-rose-300 leading-relaxed shadow-sm">
                <span className="font-semibold block mb-0.5">Notice:</span>
                {errorMsg}
                {errorMsg.toLowerCase().includes('already exists') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(false);
                      setErrorMsg('');
                    }}
                    className="mt-2 block text-xs font-semibold text-rose-200 underline hover:text-white"
                  >
                    Click here to Sign In with this email →
                  </button>
                )}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || parsingResume}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2 text-sm shadow"
            >
              {loading
                ? 'Processing...'
                : isSignUp
                ? role === 'RECRUITER'
                  ? 'Register Corporate Recruiter Account'
                  : role === 'TPO_ADMIN'
                  ? 'Register College TPO Administrator'
                  : 'Submit Registration & Request TPO Verification'
                : `Sign In to ${role === 'RECRUITER' ? 'Recruiter' : role === 'TPO_ADMIN' ? 'TPO Admin' : 'Student'} Portal`}
            </Button>
          </form>

          {/* Context-Aware Footers */}
          {!isSignUp ? (
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center space-y-1">
              <p className="text-xs text-slate-400">
                Need an account for{' '}
                <span className="font-semibold text-indigo-400">
                  {role === 'RECRUITER' ? 'Corporate Recruiter' : role === 'TPO_ADMIN' ? 'College TPO Admin' : 'Student Candidate'}
                </span>
                ?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                    setResumeSuccessMsg('');
                  }}
                  className="text-indigo-400 font-semibold hover:text-indigo-300 underline inline-flex items-center gap-1"
                >
                  <span>Register Here</span>
                  <span>→</span>
                </button>
              </p>
            </div>
          ) : (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setErrorMsg('');
                  setResumeSuccessMsg('');
                }}
                className="text-xs text-slate-400 hover:text-slate-200 underline inline-flex items-center gap-1"
              >
                <span>← Already have an account? Sign In</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-200">Loading CampusLink Auth...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}

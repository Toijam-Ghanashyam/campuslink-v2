'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { registerNewUser } from '@/app/actions/auth';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'RECRUITER' | 'TPO_ADMIN'>('STUDENT');
  const [collegeId, setCollegeId] = useState(AFFILIATED_COLLEGES[0].id);
  const [customCollegeCode, setCustomCollegeCode] = useState('');
  const [useCustomCollege, setUseCustomCollege] = useState(false);

  // Student academic fields
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [batchYear, setBatchYear] = useState('2026');
  const [cgpa, setCgpa] = useState('7.80');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [resumeFileName, setResumeFileName] = useState('');
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState('');

  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();
  const supabase = createClient();

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

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formData,
      });

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

        setResumeSuccessMsg('✨ Resume parsed with Gemini AI! Details autofilled below. Please review and verify before submitting.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error parsing resume. Please fill out details manually.');
    } finally {
      setParsingResume(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const targetCollegeId = useCustomCollege && customCollegeCode.trim()
      ? customCollegeCode.trim()
      : collegeId;

    try {
      if (isSignUp) {
        // Register new student through secure server action with college classification & academic details
        const res = await registerNewUser({
          email,
          password,
          role: 'STUDENT',
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'User',
          collegeId: targetCollegeId,
          rollNumber: rollNumber || undefined,
          branch,
          batchYear: Number(batchYear) || 2026,
          cgpa: parseFloat(cgpa) || 7.50,
          activeBacklogs: parseInt(activeBacklogs, 10) || 0,
          resumeUrl: resumeFileName || undefined,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create student account');
          setLoading(false);
          return;
        }

        // Immediately sign in the new student
        const { data: authData, error: signInErr } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInErr) {
          setErrorMsg(signInErr.message);
          setLoading(false);
          return;
        }

        window.location.href = '/student';
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-slate-100 py-10">
      <Card className={`w-full ${isSignUp ? 'max-w-2xl' : 'max-w-md'} border-slate-800 bg-slate-900 text-slate-100 shadow-2xl transition-all duration-300`}>
        <CardHeader className="text-center pb-3">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            🏛️
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            {isSignUp ? 'New Student Registration' : 'Sign in to CampusLink'}
          </CardTitle>
          <p className="text-xs text-slate-400 mt-1">
            {isSignUp
              ? 'Upload your resume to automatically extract & verify your academic profile'
              : 'BPUT Central Placement & Multi-College Institutional Recruitment OS'}
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {/* Account Role Selector (ONLY on Sign In page) */}
            {!isSignUp && (
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Account Type</label>
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as any);
                    setErrorMsg('');
                  }}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="STUDENT">Student Candidate</option>
                  <option value="RECRUITER">Corporate Recruiter</option>
                  <option value="TPO_ADMIN">College TPO Administrator</option>
                </select>
              </div>
            )}

            {/* REGISTER WITH RESUME FLOW: ONLY FOR NEW STUDENT SIGN UP */}
            {isSignUp && (
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
              </div>
            )}

            {/* Basic Info (Student Signup) */}
            {isSignUp && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">First Name</label>
                  <Input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                    placeholder="Aditya"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-slate-400">Last Name</label>
                  <Input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                    placeholder="Patel"
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Email Address</label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder={role === 'RECRUITER' ? 'recruiter@company.com' : role === 'TPO_ADMIN' ? 'tpo@college.edu' : 'student@campus.edu'}
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Password</label>
              <Input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="••••••••"
              />
            </div>

            {/* College Selection (ONLY on Student Signup) */}
            {isSignUp && (
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
            {isSignUp && (
              <div className="rounded-lg border border-indigo-900/40 bg-indigo-950/20 p-3.5 space-y-3">
                <div className="border-b border-indigo-900/50 pb-1.5 flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                    🎓 Academic Profile (Autofilled from Resume)
                  </h4>
                  <span className="text-[10px] bg-indigo-900/40 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/40">
                    Awaiting TPO Lock
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      BPUT Roll / Reg Number
                    </label>
                    <Input
                      type="text"
                      required
                      value={rollNumber}
                      onChange={(e) => setRollNumber(e.target.value)}
                      placeholder="e.g. 220101045"
                      className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Branch / Department
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100 focus:outline-none"
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
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Current CGPA
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="10"
                      required
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      placeholder="e.g. 8.25"
                      className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase text-slate-400">
                      Active Backlogs
                    </label>
                    <Input
                      type="number"
                      min="0"
                      required
                      value={activeBacklogs}
                      onChange={(e) => setActiveBacklogs(e.target.value)}
                      placeholder="0"
                      className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold uppercase text-slate-400">
                    Graduation Batch Year
                  </label>
                  <Input
                    type="number"
                    min="2020"
                    max="2035"
                    required
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    placeholder="2026"
                    className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                  />
                </div>
              </div>
            )}

            {errorMsg && (
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
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold py-2"
            >
              {loading
                ? 'Processing...'
                : isSignUp
                ? 'Submit Registration & Request TPO Verification'
                : 'Sign In'}
            </Button>
          </form>

          {/* Context-Aware Footers */}
          {!isSignUp ? (
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-center">
              {role === 'STUDENT' ? (
                <p className="text-xs text-slate-400">
                  New Student Candidate?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(true);
                      setErrorMsg('');
                      setResumeSuccessMsg('');
                    }}
                    className="text-indigo-400 font-semibold hover:text-indigo-300 underline inline-flex items-center gap-1"
                  >
                    <span>Register with Academic Resume</span>
                    <span>→</span>
                  </button>
                </p>
              ) : role === 'RECRUITER' ? (
                <p className="text-[11px] text-slate-500">
                  💼 Enterprise corporate recruiter credentials are provisioned by your BPUT placement coordinator.
                </p>
              ) : (
                <p className="text-[11px] text-slate-500">
                  🏛️ College TPO Administrator portal access is restricted to verified institutional authorities.
                </p>
              )}
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
                <span>← Already registered? Back to Sign In</span>
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  ArrowLeft,
  Eye,
  EyeOff,
  FileUp,
  CheckCircle2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { registerNewUser } from '@/app/actions/auth';
import { AFFILIATED_COLLEGES } from '@/lib/colleges';
import { ThemeToggle } from '@/components/editorial/ThemeToggle';
import { useTheme } from '@/theme/ThemeProvider';

function MonochromeShowerCanvas({ theme }: { theme: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const ANGLE = (60 * Math.PI) / 180;
    const COS = Math.cos(ANGLE);
    const SIN = Math.sin(ANGLE);

    let stars: any[] = [];
    let streaks: any[] = [];

    const createStreak = (w: number, h: number, randomStart = false, currentTheme = 'night') => {
      const isNight = currentTheme === 'night';
      const startX = randomStart
        ? Math.random() * (w + h * 0.8) - h * 0.5
        : Math.random() * (w + h * 0.6) - h * 0.45;
      const startY = randomStart ? Math.random() * h : -Math.random() * 180 - 20;

      return {
        x: startX,
        y: startY,
        len: isNight ? 70 + Math.random() * 110 : 36 + Math.random() * 65,
        speed: isNight ? 4.2 + Math.random() * 5.5 : 5.0 + Math.random() * 6.0,
        alpha: isNight ? 0.35 + Math.random() * 0.6 : 0.14 + Math.random() * 0.24,
        thickness: isNight ? 0.9 + Math.random() * 1.1 : 0.8 + Math.random() * 0.9,
      };
    };

    const initScene = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const starCount = Math.floor((width * height) / 14000);
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.15 + 0.3,
        baseAlpha: Math.random() * 0.45 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }));

      const streakCount = theme === 'night' ? 18 : 22;
      streaks = Array.from({ length: streakCount }, () =>
        createStreak(width, height, true, theme)
      );
    };

    initScene();
    window.addEventListener('resize', initScene);

    let tick = 0;
    const render = () => {
      tick += 1;
      const isNight = theme === 'night';
      ctx.fillStyle = isNight ? '#000000' : '#F6F5F0';
      ctx.fillRect(0, 0, width, height);

      for (const s of stars) {
        const twinkle = s.baseAlpha + Math.sin(tick * s.twinkleSpeed + s.phase) * 0.15;
        const a = Math.max(0.04, Math.min(0.75, twinkle));
        ctx.fillStyle = isNight
          ? `rgba(255, 255, 255, ${a.toFixed(3)})`
          : `rgba(17, 17, 19, ${(a * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      for (let i = 0; i < streaks.length; i++) {
        const st = streaks[i];
        st.x += COS * st.speed;
        st.y += SIN * st.speed;
        const tailX = st.x - COS * st.len;
        const tailY = st.y - SIN * st.len;

        const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
        if (isNight) {
          grad.addColorStop(0, `rgba(255, 255, 255, ${st.alpha})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          grad.addColorStop(0, `rgba(17, 17, 19, ${st.alpha})`);
          grad.addColorStop(1, 'rgba(17, 17, 19, 0)');
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = st.thickness;
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        if (st.y - st.len > height + 40 || st.x - st.len > width + 80) {
          streaks[i] = createStreak(width, height, false, theme);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', initScene);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" aria-hidden="true" />;
}

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { theme } = useTheme();
  const isNight = theme === 'night';

  const [role, setRole] = useState<'STUDENT' | 'RECRUITER' | 'TPO_ADMIN'>('STUDENT');
  const [isSignUp, setIsSignUp] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Auth credentials
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [collegeId, setCollegeId] = useState(AFFILIATED_COLLEGES[0].id);
  const [customCollegeCode, setCustomCollegeCode] = useState('');
  const [useCustomCollege, setUseCustomCollege] = useState(false);

  // Student academic fields (Auto-filled via /api/parse-resume)
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('Computer Science & Engineering');
  const [batchYear, setBatchYear] = useState('2026');
  const [cgpa, setCgpa] = useState('7.80');
  const [activeBacklogs, setActiveBacklogs] = useState('0');
  const [resumeFileName, setResumeFileName] = useState('');
  const [parsingResume, setParsingResume] = useState(false);
  const [resumeSuccessMsg, setResumeSuccessMsg] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
        setErrorMsg(json.error || 'Could not parse resume automatically. Please fill details below.');
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
          ].find(
            (b) =>
              b.toLowerCase() === d.branch.toLowerCase() ||
              d.branch.toLowerCase().includes(b.toLowerCase())
          );
          if (matchBranch) setBranch(matchBranch);
        }
        if (d.cgpa !== null && d.cgpa !== undefined) setCgpa(String(d.cgpa));
        if (d.batchYear) setBatchYear(String(d.batchYear));
        if (d.activeBacklogs !== undefined && d.activeBacklogs !== null) {
          setActiveBacklogs(String(d.activeBacklogs));
        }

        if (d.collegeCode) {
          const matched = AFFILIATED_COLLEGES.find(
            (c) => c.code.toUpperCase() === d.collegeCode.toUpperCase()
          );
          if (matched) {
            setCollegeId(matched.id);
            setUseCustomCollege(false);
          }
        } else if (d.collegeName) {
          const matched = AFFILIATED_COLLEGES.find(
            (c) =>
              c.name.toLowerCase().includes(d.collegeName.toLowerCase()) ||
              d.collegeName.toLowerCase().includes(c.code.toLowerCase())
          );
          if (matched) {
            setCollegeId(matched.id);
            setUseCustomCollege(false);
          }
        }

        setResumeSuccessMsg(
          'Resume parsed with Gemini AI! Academic details autofilled below for your review.'
        );
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

    const targetCollegeId =
      useCustomCollege && customCollegeCode.trim() ? customCollegeCode.trim() : collegeId;

    try {
      if (isSignUp) {
        const res = await registerNewUser({
          email,
          password,
          role: 'STUDENT',
          firstName: firstName || email.split('@')[0],
          lastName: lastName || 'Candidate',
          collegeId: targetCollegeId,
          rollNumber: rollNumber || undefined,
          branch,
          batchYear: Number(batchYear) || 2026,
          cgpa: parseFloat(cgpa) || 7.5,
          activeBacklogs: parseInt(activeBacklogs, 10) || 0,
          resumeUrl: resumeFileName || undefined,
        });

        if (!res.success) {
          setErrorMsg(res.error || 'Failed to create student account');
          setLoading(false);
          return;
        }

        const { error: signInErr } = await supabase.auth.signInWithPassword({
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
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
          setLoading(false);
          return;
        }

        const userMetaRole = (
          authData?.user?.user_metadata?.role as string | undefined
        )?.toUpperCase();
        const effectiveRole = userMetaRole || role;
        const destination =
          effectiveRole === 'STUDENT'
            ? '/student'
            : effectiveRole === 'RECRUITER'
            ? '/recruiter'
            : '/admin';

        window.location.href = destination;
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center px-4 py-12 overflow-y-auto text-fg">
      <MonochromeShowerCanvas theme={theme} />

      {/* Top Navigation */}
      <div className="fixed top-4 left-4 z-30">
        <button
          type="button"
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border border-line bg-surface/80 backdrop-blur-md text-fg hover:border-fg/40 transition cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to CampusLink</span>
        </button>
      </div>

      <div className="fixed top-4 right-4 z-30">
        <ThemeToggle />
      </div>

      {/* Main Card */}
      <div
        className={`relative z-10 w-full ${
          isSignUp ? 'max-w-2xl' : 'max-w-[460px]'
        } rounded-2xl border border-line bg-surface/90 backdrop-blur-2xl p-6 sm:p-8 shadow-object transition-all duration-300`}
      >
        <div className="mb-6">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent font-semibold block mb-1">
            {isSignUp ? 'AI-ASSISTED CANDIDATE ONBOARDING' : 'INSTITUTIONAL AUTHENTICATION GATEWAY'}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-fg">
            {isSignUp ? 'New Student Registration.' : 'Sign in to CampusLink.'}
          </h1>
          <p className="text-xs text-fg-soft mt-1">
            {isSignUp
              ? 'Upload your academic resume PDF to auto-extract BPUT credentials via Gemini AI.'
              : 'Select your institutional role and sign in with your verified credentials.'}
          </p>
        </div>

        {/* Role Selector Tabs (Sign-In Mode) */}
        {!isSignUp && (
          <div className="grid grid-cols-3 gap-2 mb-5 p-1 rounded-xl bg-bg border border-line font-mono text-[11px]">
            {[
              { id: 'STUDENT', label: 'Student', icon: GraduationCap },
              { id: 'RECRUITER', label: 'Recruiter', icon: Building2 },
              { id: 'TPO_ADMIN', label: 'TPO Admin', icon: ShieldCheck },
            ].map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    setRole(r.id as any);
                    setErrorMsg('');
                  }}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 font-semibold transition-all cursor-pointer ${
                    active
                      ? 'bg-btn text-btn-fg shadow-xs'
                      : 'text-fg-soft hover:text-fg'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {/* STEP 1 OF SIGN UP: AI RESUME AUTO-PARSER */}
          {isSignUp && (
            <div className="rounded-xl border border-accent/40 bg-accent-tint/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-mono text-xs font-bold uppercase tracking-wider text-fg">
                  <FileUp className="w-4 h-4 text-accent" />
                  <span>01 · Upload Resume PDF (Gemini AI Autofill)</span>
                </div>
                {resumeFileName && !parsingResume && (
                  <span className="font-mono text-[10px] text-jade font-semibold bg-jade-tint/60 px-2 py-0.5 rounded border border-jade/40">
                    ✓ {resumeFileName}
                  </span>
                )}
              </div>

              <div className="rounded-lg border border-dashed border-line bg-surface/80 p-4 text-center">
                {parsingResume ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
                    <p className="font-mono text-xs font-semibold text-fg">
                      Extracting Roll No, College, Branch &amp; CGPA with Gemini AI...
                    </p>
                  </div>
                ) : (
                  <label
                    htmlFor="resume-upload"
                    className="cursor-pointer flex flex-col items-center gap-1.5"
                  >
                    <FileUp className="w-6 h-6 text-accent" />
                    <span className="font-sans text-xs font-semibold text-fg underline underline-offset-4">
                      {resumeFileName
                        ? 'Click to replace uploaded Resume PDF'
                        : 'Select Academic Resume PDF to Auto-Fill Form'}
                    </span>
                    <span className="font-mono text-[10px] text-fg-soft">
                      Supports PDF up to 10MB
                    </span>
                    <input
                      id="resume-upload"
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={handleResumeUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {resumeSuccessMsg && (
                <div className="p-2.5 rounded-control bg-jade-tint/50 border border-jade/40 text-xs text-fg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-jade shrink-0" />
                  <span>{resumeSuccessMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* First & Last Name (Sign Up) */}
          {isSignUp && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10.5px] uppercase tracking-wider text-fg-soft block mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Zahid"
                  className="w-full h-10 px-3 rounded-control border border-line bg-bg text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="font-mono text-[10.5px] uppercase tracking-wider text-fg-soft block mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Khan"
                  className="w-full h-10 px-3 rounded-control border border-line bg-bg text-sm text-fg focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          )}

          {/* Email & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={isSignUp ? '' : 'sm:col-span-2'}>
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-fg-soft block mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={
                  role === 'RECRUITER'
                    ? 'recruiter@company.com'
                    : role === 'TPO_ADMIN'
                    ? 'tpo@college.edu'
                    : 'student@campus.edu'
                }
                className="w-full h-10 px-3 rounded-control border border-line bg-bg text-sm text-fg focus:outline-none focus:border-accent"
              />
            </div>

            <div className={isSignUp ? '' : 'sm:col-span-2'}>
              <label className="font-mono text-[10.5px] uppercase tracking-wider text-fg-soft block mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-10 pl-3 pr-10 rounded-control border border-line bg-bg text-sm text-fg focus:outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-soft hover:text-fg"
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* College Selection & Academic Fields (Sign Up) */}
          {isSignUp && (
            <div className="space-y-3 pt-2 border-t border-line">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10.5px] uppercase tracking-wider text-fg font-semibold">
                  02 · BPUT College Affiliation &amp; Academic Record
                </label>
                <button
                  type="button"
                  onClick={() => setUseCustomCollege(!useCustomCollege)}
                  className="font-mono text-[10px] text-accent underline cursor-pointer"
                >
                  {useCustomCollege ? 'Select from standard list' : 'Enter custom College ID'}
                </button>
              </div>

              {useCustomCollege ? (
                <input
                  type="text"
                  required
                  value={customCollegeCode}
                  onChange={(e) => setCustomCollegeCode(e.target.value)}
                  placeholder="Enter custom institutional code"
                  className="w-full h-10 px-3 rounded-control border border-line bg-bg text-xs text-fg"
                />
              ) : (
                <select
                  value={collegeId}
                  onChange={(e) => setCollegeId(e.target.value)}
                  className="w-full h-10 px-3 rounded-control border border-line bg-bg text-xs text-fg"
                >
                  {AFFILIATED_COLLEGES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code}) — {c.district}
                    </option>
                  ))}
                </select>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                    University Roll / Reg No
                  </label>
                  <input
                    type="text"
                    required
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    placeholder="e.g. 2505066"
                    className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                  />
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                    Engineering Branch
                  </label>
                  <select
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs text-fg"
                  >
                    <option value="Computer Science & Engineering">Computer Science &amp; Engineering</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Telecommunication">Electronics &amp; Telecommunication</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                  </select>
                </div>

                <div>
                  <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                    Current CGPA (Out of 10)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                      Backlogs
                    </label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={activeBacklogs}
                      onChange={(e) => setActiveBacklogs(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                    />
                  </div>
                  <div>
                    <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                      Batch Year
                    </label>
                    <input
                      type="number"
                      min="2020"
                      max="2035"
                      required
                      value={batchYear}
                      onChange={(e) => setBatchYear(e.target.value)}
                      className="w-full h-9 px-2.5 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-control bg-brick-tint/60 border border-brick/50 text-xs text-brick font-medium">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || parsingResume}
            className="w-full h-11 rounded-control bg-btn text-btn-fg hover:bg-btn-hover hover:text-btn-hover-fg font-sans font-semibold text-sm transition cursor-pointer disabled:opacity-50"
          >
            {loading
              ? 'Authenticating...'
              : isSignUp
              ? 'Submit Registration & Request TPO Lock'
              : 'Sign In to Portal'}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="mt-5 pt-4 border-t border-line text-center">
          {!isSignUp ? (
            role === 'STUDENT' ? (
              <p className="text-xs text-fg-soft">
                New Student Candidate?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg('');
                  }}
                  className="text-fg font-semibold underline underline-offset-4 hover:text-accent cursor-pointer"
                >
                  Register with Academic Resume PDF &rarr;
                </button>
              </p>
            ) : (
              <p className="font-mono text-[11px] text-fg-soft">
                Authorized {role === 'RECRUITER' ? 'Corporate Recruiter' : 'College TPO'} access only.
              </p>
            )
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
              }}
              className="text-xs text-fg-soft hover:text-fg underline underline-offset-4 cursor-pointer"
            >
              &larr; Already registered? Back to Sign In
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

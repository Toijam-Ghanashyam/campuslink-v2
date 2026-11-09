import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GraduationCap,
  ShieldCheck,
  Building2,
  Sparkles,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronDown,
} from 'lucide-react';
import { useTheme } from '../../theme/ThemeProvider.jsx';

// ============================================================================
// PORTAL DEFINITIONS & DEMO CREDENTIALS
// ============================================================================
const PORTALS = [
  {
    id: 'student',
    label: 'Student',
    sub: 'Roll No & Password',
    icon: GraduationCap,
  },
  {
    id: 'admin',
    label: 'Placement Cell',
    sub: 'Name & Special Key',
    icon: ShieldCheck,
  },
  {
    id: 'recruiter',
    label: 'Recruiter',
    sub: 'Company & Password',
    icon: Building2,
  },
  {
    id: 'demo',
    label: 'Demo',
    sub: 'Instant Student View',
    icon: Sparkles,
  },
];

const DEMO_CREDENTIALS = {
  student: {
    rollNo: '21CS3042',
    password: 'campuslink@2026',
  },
  admin: {
    name: 'Dr. Ananya Verma',
    specialKey: 'CL-TPO-2026-X9',
  },
  recruiter: {
    company: 'Atlassian',
    password: 'recruiter#atlassian26',
  },
};

const PARTNER_COMPANIES = [
  'Atlassian',
  'Stripe',
  'Goldman Sachs',
  'Razorpay',
  'Rubrik',
  'Cred',
  'Linear',
  'Dezerv',
  'Uber',
  'Microsoft',
  'Zerodha',
];

// ============================================================================
// 30-DEGREE MONOCHROME SHOWER CANVAS (DARK: SHOOTING STARS / LIGHT: INK DROPS)
// ============================================================================
function MonochromeShowerCanvas({ theme }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let width = 0;
    let height = 0;

    // 30-degree showering angle (30 deg from vertical = 60 deg from horizontal)
    const ANGLE = (60 * Math.PI) / 180;
    const COS = Math.cos(ANGLE);
    const SIN = Math.sin(ANGLE);

    let stars = [];
    let streaks = [];

    const createStreak = (w, h, randomStart = false, currentTheme = 'night') => {
      const isNight = currentTheme === 'night';
      const startX = randomStart
        ? Math.random() * (w + h * 0.8) - h * 0.5
        : Math.random() * (w + h * 0.6) - h * 0.45;
      const startY = randomStart
        ? Math.random() * h
        : -Math.random() * 180 - 20;

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

      // Background micro-dots (twinkling white stars in dark, fine charcoal specks in day)
      const starCount = Math.floor((width * height) / 14000);
      stars = Array.from({ length: starCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 1.15 + 0.3,
        baseAlpha: Math.random() * 0.45 + 0.1,
        twinkleSpeed: Math.random() * 0.02 + 0.005,
        phase: Math.random() * Math.PI * 2,
      }));

      // Active 30-degree showering streaks
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

      // 1. Solid Monochrome Canvas Background Fill
      ctx.fillStyle = isNight ? '#000000' : '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // 2. Ambient Micro-Dots
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const twinkle =
          s.baseAlpha + Math.sin(tick * s.twinkleSpeed + s.phase) * 0.15;
        const a = Math.max(0.04, Math.min(0.75, twinkle));

        ctx.fillStyle = isNight
          ? `rgba(255, 255, 255, ${a.toFixed(3)})`
          : `rgba(17, 17, 19, ${(a * 0.25).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. 30-Degree Showering Shooting Stars (Night) / Black Ink Drops (Day)
      for (let i = 0; i < streaks.length; i++) {
        const st = streaks[i];
        st.x += COS * st.speed;
        st.y += SIN * st.speed;

        const tailX = st.x - COS * st.len;
        const tailY = st.y - SIN * st.len;

        const grad = ctx.createLinearGradient(st.x, st.y, tailX, tailY);
        if (isNight) {
          grad.addColorStop(0, `rgba(255, 255, 255, ${st.alpha})`);
          grad.addColorStop(0.3, `rgba(255, 255, 255, ${st.alpha * 0.45})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        } else {
          grad.addColorStop(0, `rgba(17, 17, 19, ${st.alpha})`);
          grad.addColorStop(0.4, `rgba(17, 17, 19, ${st.alpha * 0.35})`);
          grad.addColorStop(1, 'rgba(17, 17, 19, 0)');
        }

        ctx.strokeStyle = grad;
        ctx.lineWidth = st.thickness;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(st.x, st.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        // Crisp luminous head dot
        ctx.fillStyle = isNight
          ? `rgba(255, 255, 255, ${Math.min(1, st.alpha + 0.25)})`
          : `rgba(17, 17, 19, ${Math.min(0.6, st.alpha + 0.12)})`;
        ctx.beginPath();
        ctx.arc(st.x, st.y, isNight ? 1.3 : 1.1, 0, Math.PI * 2);
        ctx.fill();

        // Recycle when streak travels off-screen
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

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

// ============================================================================
// MAIN LOGIN PAGE COMPONENT
// ============================================================================
export function LoginPage({ onBackToLanding, onEnterPortal }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const isNight = theme === 'night';

  const roleParam = searchParams.get('role');

  // null = Step 1 (2x2 Portal Grid), 'student' | 'admin' | 'recruiter' | 'demo' = Step 2 Modal
  const [activePortal, setActivePortal] = useState(() => {
    if (roleParam === 'student' || roleParam === 'admin' || roleParam === 'recruiter' || roleParam === 'placement') {
      return roleParam === 'placement' ? 'admin' : roleParam;
    }
    return null;
  });

  useEffect(() => {
    if (roleParam === 'student' || roleParam === 'admin' || roleParam === 'recruiter') {
      setActivePortal(roleParam);
    } else if (roleParam === 'placement') {
      setActivePortal('admin');
    }
  }, [roleParam]);

  // Student Form State
  const [studentRoll, setStudentRoll] = useState(DEMO_CREDENTIALS.student.rollNo);
  const [studentPass, setStudentPass] = useState(DEMO_CREDENTIALS.student.password);

  // Placement Cell (Admin) Form State
  const [adminName, setAdminName] = useState(DEMO_CREDENTIALS.admin.name);
  const [adminKey, setAdminKey] = useState(DEMO_CREDENTIALS.admin.specialKey);

  // Recruiter Form State (Dropdown + Manual Entry)
  const [companyMode, setCompanyMode] = useState('dropdown'); // 'dropdown' | 'manual'
  const [selectedCompany, setSelectedCompany] = useState(DEMO_CREDENTIALS.recruiter.company);
  const [manualCompany, setManualCompany] = useState('');
  const [recruiterPass, setRecruiterPass] = useState(DEMO_CREDENTIALS.recruiter.password);

  // Shared UI State
  const [showSecret, setShowSecret] = useState(false);

  const getPortalRoute = (role) => {
    switch (role) {
      case 'student':
      case 'demo':
        return '/student/overview';
      case 'admin':
        return '/admin/command-center';
      case 'recruiter':
        return '/recruiter/overview';
      default:
        return '/student/overview';
    }
  };

  const handleSelectPortal = (portalId) => {
    setShowSecret(false);
    if (portalId === 'demo') {
      try {
        sessionStorage.setItem('campuslink_auth', '1');
        sessionStorage.setItem('campuslink_role', 'student');
        sessionStorage.setItem('campuslink_user_name', 'Zahid');
      } catch (err) {
        /* ignore */
      }
      if (typeof onEnterPortal === 'function') {
        onEnterPortal('student');
      }
      navigate('/student/overview');
      return;
    }
    setActivePortal(portalId);
  };

  const handleFillDemo = () => {
    if (activePortal === 'student') {
      setStudentRoll(DEMO_CREDENTIALS.student.rollNo);
      setStudentPass(DEMO_CREDENTIALS.student.password);
    } else if (activePortal === 'admin') {
      setAdminName(DEMO_CREDENTIALS.admin.name);
      setAdminKey(DEMO_CREDENTIALS.admin.specialKey);
    } else if (activePortal === 'recruiter') {
      setCompanyMode('dropdown');
      setSelectedCompany(DEMO_CREDENTIALS.recruiter.company);
      setRecruiterPass(DEMO_CREDENTIALS.recruiter.password);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const effectiveRole = activePortal || 'student';
    try {
      sessionStorage.setItem('campuslink_auth', '1');
      sessionStorage.setItem('campuslink_role', effectiveRole);
      if (effectiveRole === 'student') {
        sessionStorage.setItem('campuslink_user_name', 'Zahid');
      } else if (effectiveRole === 'admin') {
        sessionStorage.setItem('campuslink_user_name', adminName || 'Dr. Ananya Verma');
      } else if (effectiveRole === 'recruiter') {
        const comp = companyMode === 'dropdown' ? selectedCompany : manualCompany;
        sessionStorage.setItem('campuslink_user_name', comp ? `${comp} Recruiter` : 'Rohit Khemka');
      }
    } catch (err) {
      /* ignore */
    }
    if (typeof onEnterPortal === 'function') {
      onEnterPortal(effectiveRole);
    }
    navigate(getPortalRoute(effectiveRole));
  };

  const handleBackToLanding = () => {
    if (typeof onBackToLanding === 'function') {
      onBackToLanding();
    } else {
      navigate('/');
    }
  };

  // Pure Monochrome Black & White Tokens (Zero orange/brown)
  const ui = {
    pageText: isNight ? 'text-white' : 'text-[#0A0A0C]',
    subText: isNight ? 'text-[#8E8E93]' : 'text-[#686870]',
    // 2x2 Portal Grid Cards
    portalCard: isNight
      ? 'bg-[#0B0B0D]/80 hover:bg-[#121216]/90 border-white/[0.15] hover:border-white/[0.32] shadow-[0_20px_50px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.06)]'
      : 'bg-white/88 hover:bg-white/98 border-black/[0.12] hover:border-black/[0.28] shadow-[0_16px_40px_rgba(0,0,0,0.06),inset_0_1px_0_rgba(255,255,255,1)]',
    iconBox: isNight
      ? 'bg-white/[0.06] border-white/[0.10] text-white'
      : 'bg-black/[0.04] border-black/[0.09] text-[#0A0A0C]',
    // Step 2 Login Modal Container
    modalCard: isNight
      ? 'bg-[#0B0B0D]/88 border-white/[0.15] shadow-[0_24px_60px_rgba(0,0,0,0.92),inset_0_1px_0_rgba(255,255,255,0.08)]'
      : 'bg-white/92 border-black/[0.12] shadow-[0_20px_50px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,1)]',
    // Inputs & Selects
    input: isNight
      ? 'bg-[#050507]/90 border-white/[0.12] focus:border-white/40 text-white placeholder-[#686870]'
      : 'bg-[#F7F7F8] border-black/[0.12] focus:border-black/45 text-[#0A0A0C] placeholder-[#8E8E93]',
    // Primary Login Button
    loginBtn: isNight
      ? 'bg-white text-black hover:bg-neutral-200'
      : 'bg-[#0A0A0C] text-white hover:bg-neutral-800',
  };

  return (
    <div
      className={`relative h-screen max-h-screen w-full flex flex-col items-center justify-center px-4 overflow-hidden select-none transition-colors duration-300 ${ui.pageText}`}
      style={{
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* 1. Background Canvas: 30-deg Shooting Stars (Night) / Black Ink Drops (Day) */}
      <MonochromeShowerCanvas theme={theme} />

      {/* 2. Top Navigation Bar: Back to Landing (Left) & Theme Toggle (Right) */}
      <div className="fixed top-3 sm:top-4 left-3 sm:left-4 z-30">
        <button
          type="button"
          onClick={handleBackToLanding}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border backdrop-blur-md transition cursor-pointer ${
            isNight
              ? 'bg-white/10 border-white/20 text-white hover:bg-white/15'
              : 'bg-black/5 border-black/15 text-[#0A0A0C] hover:bg-black/10'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to CampusLink</span>
        </button>
      </div>

      {/* ======================================================================
          STEP 1: 2x2 PORTAL SELECTION GRID (Fits 100% on screen, no scroll)
         ====================================================================== */}
      {!activePortal && (
        <div className="relative z-10 w-full max-w-[680px] flex flex-col items-center">
          <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-bold tracking-tight text-center leading-tight">
            Sign In
          </h1>
          <p className={`text-sm sm:text-base mt-1.5 text-center ${ui.subText}`}>
            Select your portal to continue
          </p>

          <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 mt-5 sm:mt-6">
            {PORTALS.map((portal) => {
              const Icon = portal.icon;
              return (
                <button
                  key={portal.id}
                  type="button"
                  onClick={() => handleSelectPortal(portal.id)}
                  className={`group w-full h-[125px] sm:h-[145px] rounded-[20px] backdrop-blur-xl border p-3.5 sm:p-5 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer hover:-translate-y-0.5 ${ui.portalCard}`}
                >
                  <div
                    className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border flex items-center justify-center mb-2 sm:mb-2.5 transition-transform duration-200 group-hover:scale-105 ${ui.iconBox}`}
                  >
                    <Icon className="w-5 h-5 stroke-[1.75]" />
                  </div>

                  <div className="text-base sm:text-lg font-bold tracking-tight leading-tight">
                    {portal.label}
                  </div>
                  <div className={`text-xs sm:text-[13px] mt-0.5 truncate max-w-full ${ui.subText}`}>
                    {portal.sub}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================================
          STEP 2: PORTAL LOGIN MODAL CARD (Tabs removed, compact & fits screen)
         ====================================================================== */}
      {activePortal && (
        <div
          className={`relative z-10 w-full max-w-[480px] rounded-[24px] backdrop-blur-2xl border p-5 sm:p-7 transition-all duration-200 ${ui.modalCard}`}
        >
          {/* Top Row: Simple <- Back */}
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <button
              type="button"
              onClick={() => setActivePortal(null)}
              className={`inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium transition cursor-pointer hover:opacity-100 ${ui.subText}`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          </div>

          {/* ------------------------------------------------------------------
              VIEW A: STUDENT LOGIN
             ------------------------------------------------------------------ */}
          {activePortal === 'student' && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Student Login
                  </h2>
                  <p className={`text-xs sm:text-sm mt-0.5 ${ui.subText}`}>
                    Enter your university roll number and password
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className={`text-xs sm:text-sm underline underline-offset-4 shrink-0 mt-0.5 transition cursor-pointer hover:opacity-80 ${ui.subText}`}
                >
                  Fill demo
                </button>
              </div>

              <div className="mt-5 space-y-3.5">
                <div>
                  <label
                    className={`block text-xs sm:text-sm mb-1.5 font-medium ${
                      isNight ? 'text-[#C7C7CC]' : 'text-[#3A3A40]'
                    }`}
                  >
                    Roll No
                  </label>
                  <input
                    type="text"
                    required
                    value={studentRoll}
                    onChange={(e) => setStudentRoll(e.target.value)}
                    className={`w-full h-[46px] px-3.5 rounded-xl text-sm sm:text-base border outline-none transition ${ui.input}`}
                    placeholder="21CS3042"
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs sm:text-sm mb-1.5 font-medium ${
                      isNight ? 'text-[#C7C7CC]' : 'text-[#3A3A40]'
                    }`}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={studentPass}
                      onChange={(e) => setStudentPass(e.target.value)}
                      className={`w-full h-[46px] pl-3.5 pr-11 rounded-xl text-sm sm:text-base border outline-none transition ${ui.input}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${ui.subText}`}
                      aria-label="Toggle password visibility"
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full h-[46px] mt-6 rounded-xl text-sm sm:text-base font-semibold transition cursor-pointer active:scale-[0.99] ${ui.loginBtn}`}
              >
                Login
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------------
              VIEW B: PLACEMENT CELL LOGIN
             ------------------------------------------------------------------ */}
          {activePortal === 'admin' && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Placement Cell Login
                  </h2>
                  <p className={`text-xs sm:text-sm mt-0.5 ${ui.subText}`}>
                    Enter your name and placement cell special key
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className={`text-xs sm:text-sm underline underline-offset-4 shrink-0 mt-0.5 transition cursor-pointer hover:opacity-80 ${ui.subText}`}
                >
                  Fill demo
                </button>
              </div>

              <div className="mt-5 space-y-3.5">
                <div>
                  <label
                    className={`block text-xs sm:text-sm mb-1.5 font-medium ${
                      isNight ? 'text-[#C7C7CC]' : 'text-[#3A3A40]'
                    }`}
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className={`w-full h-[46px] px-3.5 rounded-xl text-sm sm:text-base border outline-none transition ${ui.input}`}
                    placeholder="Dr. Ananya Verma"
                  />
                </div>

                <div>
                  <label
                    className={`block text-xs sm:text-sm mb-1.5 font-medium ${
                      isNight ? 'text-[#C7C7CC]' : 'text-[#3A3A40]'
                    }`}
                  >
                    Special Key
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={adminKey}
                      onChange={(e) => setAdminKey(e.target.value)}
                      className={`w-full h-[46px] pl-3.5 pr-11 rounded-xl text-sm sm:text-base border outline-none transition ${ui.input}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${ui.subText}`}
                      aria-label="Toggle special key visibility"
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full h-[46px] mt-6 rounded-xl text-sm sm:text-base font-semibold transition cursor-pointer active:scale-[0.99] ${ui.loginBtn}`}
              >
                Login
              </button>
            </form>
          )}

          {/* ------------------------------------------------------------------
              VIEW C: RECRUITER LOGIN
             ------------------------------------------------------------------ */}
          {activePortal === 'recruiter' && (
            <form onSubmit={handleSubmit}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
                    Recruiter Login
                  </h2>
                  <p className={`text-xs sm:text-sm mt-0.5 ${ui.subText}`}>
                    Select or enter your company name and password
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleFillDemo}
                  className={`text-xs sm:text-sm underline underline-offset-4 shrink-0 mt-0.5 transition cursor-pointer hover:opacity-80 ${ui.subText}`}
                >
                  Fill demo
                </button>
              </div>

              <div className="mt-5 space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className={`text-xs sm:text-sm font-medium ${
                        isNight ? 'text-[#C7C7CC]' : 'text-[#3A3A40]'
                      }`}
                    >
                      Company Name
                    </label>
                    <button
                      type="button"
                      onClick={() => setCompanyMode(companyMode === 'dropdown' ? 'manual' : 'dropdown')}
                      className={`text-xs sm:text-sm underline underline-offset-4 cursor-pointer hover:opacity-80 ${ui.subText}`}
                    >
                      {companyMode === 'dropdown' ? 'Enter manually' : 'Select from list'}
                    </button>
                  </div>

                  {companyMode === 'manual' ? (
                    <input
                      type="text"
                      required
                      value={manualCompany}
                      onChange={(e) => setManualCompany(e.target.value)}
                      placeholder="Enter company name"
                      className={`w-full h-[46px] px-3.5 rounded-xl text-sm sm:text-base border outline-none transition ${ui.input}`}
                    />
                  ) : (
                    <div className="relative">
                      <select
                        value={selectedCompany}
                        onChange={(e) => setSelectedCompany(e.target.value)}
                        className={`w-full h-[46px] pl-3.5 pr-10 rounded-xl text-sm sm:text-base border outline-none appearance-none transition cursor-pointer ${ui.input}`}
                      >
                        {PARTNER_COMPANIES.map((c) => (
                          <option
                            key={c}
                            value={c}
                            className={
                              isNight ? 'bg-[#0B0B0D] text-white' : 'bg-white text-black'
                            }
                          >
                            {c}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        className={`w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${ui.subText}`}
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label
                    className={`block text-xs sm:text-sm mb-1.5 font-medium ${
                      isNight ? 'text-[#C7C7CC]' : 'text-[#3A3A40]'
                    }`}
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      required
                      value={recruiterPass}
                      onChange={(e) => setRecruiterPass(e.target.value)}
                      className={`w-full h-[46px] pl-3.5 pr-11 rounded-xl text-sm sm:text-base border outline-none transition ${ui.input}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecret((v) => !v)}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer ${ui.subText}`}
                      aria-label="Toggle password visibility"
                    >
                      {showSecret ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={`w-full h-[46px] mt-6 rounded-xl text-sm sm:text-base font-semibold transition cursor-pointer active:scale-[0.99] ${ui.loginBtn}`}
              >
                Login
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default LoginPage;

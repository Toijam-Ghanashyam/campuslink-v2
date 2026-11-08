import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Providers & Layout
import { ThemeProvider } from './theme/ThemeProvider';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { AppShell } from './components/layout/AppShell';
import { PageTurnWipe } from './components/ui/PageTurnWipe';

// Landing Page
import { LandingPage } from './pages/landing/LandingPage';

// Auth / Login Page
import { LoginPage } from './pages/auth/LoginPage';

// Student Portal Pages
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentProfile } from './pages/student/StudentProfile';
import { StudentDrives } from './pages/student/StudentDrives';
import { StudentApplications } from './pages/student/StudentApplications';
import { StudentInterviews } from './pages/student/StudentInterviews';

// Admin Portal Pages
import { AdminCommandCenter } from './pages/admin/AdminCommandCenter';
import { AdminVerification } from './pages/admin/AdminVerification';
import { AdminRecruiters } from './pages/admin/AdminRecruiters';
import { AdminDrives } from './pages/admin/AdminDrives';
import { AdminAtRisk } from './pages/admin/AdminAtRisk';
import { AdminOffers } from './pages/admin/AdminOffers';

// Recruiter Portal Pages
import { RecruiterOverview } from './pages/recruiter/RecruiterOverview';
import { RecruiterJobs } from './pages/recruiter/RecruiterJobs';
import { RecruiterPipeline } from './pages/recruiter/RecruiterPipeline';
import { RecruiterSlots } from './pages/recruiter/RecruiterSlots';
import { RecruiterAnalytics } from './pages/recruiter/RecruiterAnalytics';

// 404 Component
import { Button } from './components/ui/Button';
import { useNavigate } from 'react-router-dom';

function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6 text-center">
      <div className="max-w-md bg-surface p-8 rounded-object border border-line shadow-object space-y-4">
        <span className="font-display font-bold text-5xl text-accent-ink">404</span>
        <h2 className="font-display font-semibold text-2xl text-fg">Page Not Found</h2>
        <p className="text-xs text-fg-soft">
          The requested placement portal link does not exist or has been relocated.
        </p>
        <Button variant="primary" onClick={() => navigate('/')} className="w-full">
          Return to Landing Hub
        </Button>
      </div>
    </div>
  );
}

function ScrollToTop() {
  const { pathname, search } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const mainEl = document.querySelector('main');
    if (mainEl) mainEl.scrollTop = 0;

    const rafId = requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      const m = document.querySelector('main');
      if (m) m.scrollTop = 0;
    });

    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      const m = document.querySelector('main');
      if (m) m.scrollTop = 0;
    }, 60);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
    };
  }, [pathname, search]);

  return null;
}

function ProtectedPortal({ role, children }) {
  const isAuth =
    typeof window !== 'undefined' &&
    sessionStorage.getItem('campuslink_auth') === '1';

  if (!isAuth) {
    return <Navigate to={`/login?role=${role}`} replace />;
  }

  return <AppShell role={role}>{children}</AppShell>;
}

function AnimatedAppRoutes() {
  const location = useLocation();
  const topSegment = location.pathname.split('/')[1] || 'landing';

  return (
    <>
      <ScrollToTop />
      <PageTurnWipe triggerKey={topSegment} />
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Authentication / Role Portal Gateway */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signin" element={<Navigate to="/login" replace />} />
        <Route path="/auth" element={<Navigate to="/login" replace />} />

        {/* Student Portal */}
        <Route path="/student" element={<Navigate to="/student/overview" replace />} />
        <Route
          path="/student/overview"
          element={
            <ProtectedPortal role="student">
              <StudentOverview />
            </ProtectedPortal>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedPortal role="student">
              <StudentProfile />
            </ProtectedPortal>
          }
        />
        <Route
          path="/student/drives"
          element={
            <ProtectedPortal role="student">
              <StudentDrives />
            </ProtectedPortal>
          }
        />
        <Route
          path="/student/applications"
          element={
            <ProtectedPortal role="student">
              <StudentApplications />
            </ProtectedPortal>
          }
        />
        <Route
          path="/student/interviews"
          element={
            <ProtectedPortal role="student">
              <StudentInterviews />
            </ProtectedPortal>
          }
        />

        {/* Admin Portal */}
        <Route path="/admin" element={<Navigate to="/admin/command-center" replace />} />
        <Route
          path="/admin/command-center"
          element={
            <ProtectedPortal role="admin">
              <AdminCommandCenter />
            </ProtectedPortal>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <ProtectedPortal role="admin">
              <AdminVerification />
            </ProtectedPortal>
          }
        />
        <Route
          path="/admin/recruiters"
          element={
            <ProtectedPortal role="admin">
              <AdminRecruiters />
            </ProtectedPortal>
          }
        />
        <Route
          path="/admin/drives"
          element={
            <ProtectedPortal role="admin">
              <AdminDrives />
            </ProtectedPortal>
          }
        />
        <Route
          path="/admin/at-risk"
          element={
            <ProtectedPortal role="admin">
              <AdminAtRisk />
            </ProtectedPortal>
          }
        />
        <Route
          path="/admin/offers"
          element={
            <ProtectedPortal role="admin">
              <AdminOffers />
            </ProtectedPortal>
          }
        />

        {/* Recruiter Portal */}
        <Route path="/recruiter" element={<Navigate to="/recruiter/overview" replace />} />
        <Route
          path="/recruiter/overview"
          element={
            <ProtectedPortal role="recruiter">
              <RecruiterOverview />
            </ProtectedPortal>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <ProtectedPortal role="recruiter">
              <RecruiterJobs />
            </ProtectedPortal>
          }
        />
        <Route
          path="/recruiter/pipeline"
          element={
            <ProtectedPortal role="recruiter">
              <RecruiterPipeline />
            </ProtectedPortal>
          }
        />
        <Route
          path="/recruiter/slots"
          element={
            <ProtectedPortal role="recruiter">
              <RecruiterSlots />
            </ProtectedPortal>
          }
        />
        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedPortal role="recruiter">
              <RecruiterAnalytics />
            </ProtectedPortal>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <StoreProvider>
          <ToastProvider>
            <BrowserRouter>
              <AnimatedAppRoutes />
            </BrowserRouter>
          </ToastProvider>
        </StoreProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}


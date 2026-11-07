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

        {/* Student Portal */}
        <Route path="/student" element={<Navigate to="/student/overview" replace />} />
        <Route
          path="/student/overview"
          element={
            <AppShell role="student">
              <StudentOverview />
            </AppShell>
          }
        />
        <Route
          path="/student/profile"
          element={
            <AppShell role="student">
              <StudentProfile />
            </AppShell>
          }
        />
        <Route
          path="/student/drives"
          element={
            <AppShell role="student">
              <StudentDrives />
            </AppShell>
          }
        />
        <Route
          path="/student/applications"
          element={
            <AppShell role="student">
              <StudentApplications />
            </AppShell>
          }
        />
        <Route
          path="/student/interviews"
          element={
            <AppShell role="student">
              <StudentInterviews />
            </AppShell>
          }
        />

        {/* Admin Portal */}
        <Route path="/admin" element={<Navigate to="/admin/command-center" replace />} />
        <Route
          path="/admin/command-center"
          element={
            <AppShell role="admin">
              <AdminCommandCenter />
            </AppShell>
          }
        />
        <Route
          path="/admin/verification"
          element={
            <AppShell role="admin">
              <AdminVerification />
            </AppShell>
          }
        />
        <Route
          path="/admin/recruiters"
          element={
            <AppShell role="admin">
              <AdminRecruiters />
            </AppShell>
          }
        />
        <Route
          path="/admin/drives"
          element={
            <AppShell role="admin">
              <AdminDrives />
            </AppShell>
          }
        />
        <Route
          path="/admin/at-risk"
          element={
            <AppShell role="admin">
              <AdminAtRisk />
            </AppShell>
          }
        />
        <Route
          path="/admin/offers"
          element={
            <AppShell role="admin">
              <AdminOffers />
            </AppShell>
          }
        />

        {/* Recruiter Portal */}
        <Route path="/recruiter" element={<Navigate to="/recruiter/overview" replace />} />
        <Route
          path="/recruiter/overview"
          element={
            <AppShell role="recruiter">
              <RecruiterOverview />
            </AppShell>
          }
        />
        <Route
          path="/recruiter/jobs"
          element={
            <AppShell role="recruiter">
              <RecruiterJobs />
            </AppShell>
          }
        />
        <Route
          path="/recruiter/pipeline"
          element={
            <AppShell role="recruiter">
              <RecruiterPipeline />
            </AppShell>
          }
        />
        <Route
          path="/recruiter/slots"
          element={
            <AppShell role="recruiter">
              <RecruiterSlots />
            </AppShell>
          }
        />
        <Route
          path="/recruiter/analytics"
          element={
            <AppShell role="recruiter">
              <RecruiterAnalytics />
            </AppShell>
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


'use client';

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { StoreProvider } from './lib/store';
import { ToastProvider } from './components/ui/toast';
import { AppShell } from './components/layout/AppShell';

// Student Pages
import { StudentOverview } from './pages/student/StudentOverview';
import { StudentDrives } from './pages/student/StudentDrives';
import { StudentInterviews } from './pages/student/StudentInterviews';
import { StudentAiInterview } from './pages/student/StudentAiInterview';

// Recruiter Pages
import { RecruiterPipeline } from './pages/recruiter/RecruiterPipeline';

function ProtectedPortal({ children, role = 'student' }) {
  return <AppShell role={role}>{children}</AppShell>;
}

export function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Redirect */}
            <Route path="/" element={<Navigate to="/student/overview" replace />} />

            {/* Student Portal Routes */}
            <Route
              path="/student/overview"
              element={
                <ProtectedPortal role="student">
                  <StudentOverview />
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
              path="/student/interviews"
              element={
                <ProtectedPortal role="student">
                  <StudentInterviews />
                </ProtectedPortal>
              }
            />

            <Route
              path="/student/ai-interview"
              element={
                <ProtectedPortal role="student">
                  <StudentAiInterview />
                </ProtectedPortal>
              }
            />

            {/* Recruiter Portal Routes */}
            <Route
              path="/recruiter/pipeline"
              element={
                <ProtectedPortal role="recruiter">
                  <RecruiterPipeline />
                </ProtectedPortal>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/student/overview" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </StoreProvider>
  );
}

export default App;

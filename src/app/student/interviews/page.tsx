'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { StoreProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ui/toast';

const StudentInterviews = dynamic(
  () =>
    import('@/pages/student/StudentInterviews').then(
      (mod) => mod.StudentInterviews || mod.default
    ),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-center text-slate-400 font-mono text-sm">
        Loading Interview Schedules & Prep Dossiers...
      </div>
    ),
  }
);

export default function StudentInterviewsPage() {
  return (
    <StoreProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
          <div className="max-w-6xl mx-auto space-y-6">
            {/* Top Navigation */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/student"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  &larr; Back to Dashboard
                </Link>
                <span className="text-slate-600">•</span>
                <Link
                  href="/student/drives"
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Placement Drives
                </Link>
                <span className="text-slate-600">•</span>
                <Link
                  href="/student/ai-interview"
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Live AI Video Round
                </Link>
              </div>
            </div>

            {/* Interviews & Calendar Component */}
            <StudentInterviews />
          </div>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}


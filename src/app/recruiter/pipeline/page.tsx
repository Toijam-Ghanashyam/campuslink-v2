'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { StoreProvider } from '@/lib/store';
import { ToastProvider } from '@/components/ui/toast';

const RecruiterPipeline = dynamic(
  () => import('@/pages/recruiter/RecruiterPipeline'),
  {
    ssr: false,
    loading: () => (
      <div className="p-12 text-center text-slate-400 font-mono text-sm">
        Loading Recruiter Pipeline, Dual-Stream Recordings & Whisper Transcripts...
      </div>
    ),
  }
);

export default function RecruiterPipelinePage() {
  return (
    <StoreProvider>
      <ToastProvider>
        <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <Link
                  href="/recruiter"
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  &larr; Recruiter Dashboard
                </Link>
                <span className="text-slate-600">•</span>
                <Link
                  href="/recruiter/war-room"
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Drive-Day War Room
                </Link>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800/80">
                  STT Model: whisper-large-v3-turbo (Groq)
                </span>
              </div>
            </div>

            {/* Recruiter Pipeline Component */}
            <RecruiterPipeline />
          </div>
        </div>
      </ToastProvider>
    </StoreProvider>
  );
}


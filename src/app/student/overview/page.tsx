'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function StudentOverviewPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      router.replace('/student');
    } catch {
      if (typeof window !== 'undefined') {
        window.location.replace('/student');
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center space-y-4 text-slate-100">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      <div className="space-y-1">
        <h2 className="font-semibold text-base text-white">Returning to Student Portal...</h2>
        <p className="text-xs text-slate-400">Syncing AI interview footage and proctoring telemetry.</p>
      </div>
      <Link
        href="/student"
        className="text-xs text-indigo-400 hover:text-indigo-300 underline font-mono"
      >
        Click here if not redirected automatically &rarr;
      </Link>
    </div>
  );
}

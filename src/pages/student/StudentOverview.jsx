'use client';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  ShieldCheck,
  Video,
  Sparkles,
  TrendingUp,
  Briefcase,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Stamp } from '../../components/ui/Stamp';
import { PageTransition } from '../../components/ui/PageTransition';

export function StudentOverview() {
  let navigate;
  try {
    navigate = useNavigate();
  } catch {
    navigate = (path) => {
      if (typeof window !== 'undefined') window.location.href = path;
    };
  }

  const { currentStudent = {}, applications = [], aiInterviewSessions = {} } = useStore();
  const hasAiSession = Boolean(aiInterviewSessions[currentStudent.id]);

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="STUDENT READINESS PORTAL · BPUT CAMPUSLINK"
        title={`Welcome back, ${currentStudent.name || currentStudent.full_name || 'Student'}.`}
        lede="Track placement readiness, simulated technical interview performance, and active enterprise recruitment drives."
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 space-y-2 border-line bg-surface">
          <div className="flex items-center justify-between text-xs text-fg-soft">
            <span className="font-mono uppercase tracking-wider">Readiness Score</span>
            <Award className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-indigo-400">
            {currentStudent.readiness_score || currentStudent.readinessScore || 82}%
          </div>
          <p className="text-[11px] text-fg-soft">
            PEP Placement Evaluation Profile
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-line bg-surface">
          <div className="flex items-center justify-between text-xs text-fg-soft">
            <span className="font-mono uppercase tracking-wider">Mock Assessment</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">
            {currentStudent.mockScore || 78}/100
          </div>
          <p className="text-[11px] text-fg-soft">
            Technical & DSA problem-solving
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-line bg-surface">
          <div className="flex items-center justify-between text-xs text-fg-soft">
            <span className="font-mono uppercase tracking-wider">Verified CGPA</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold font-mono text-fg">
            {currentStudent.verified_cgpa || 8.94}
          </div>
          <p className="text-[11px] text-fg-soft">
            0 Active Backlogs (Verified)
          </p>
        </Card>

        <Card className="p-4 space-y-2 border-line bg-surface">
          <div className="flex items-center justify-between text-xs text-fg-soft">
            <span className="font-mono uppercase tracking-wider">AI Video Status</span>
            <Video className="w-4 h-4 text-accent" />
          </div>
          <div className="text-xl font-bold font-mono text-fg mt-1">
            {hasAiSession ? (
              <span className="text-emerald-400 flex items-center gap-1.5 text-base">
                <CheckCircle2 className="w-4 h-4" /> COMPLETED
              </span>
            ) : (
              <span className="text-amber-400 text-base">PENDING ROUND</span>
            )}
          </div>
          <p className="text-[11px] text-fg-soft">
            Dual-stream recorded technical round
          </p>
        </Card>
      </div>

      {/* Live AI Technical Interview Banner */}
      <Card className="p-6 border-indigo-500/50 bg-indigo-950/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <Stamp tone={hasAiSession ? 'jade' : 'accent'}>
              {hasAiSession ? 'INTERVIEW COMPLETED' : 'AVAILABLE NOW'}
            </Stamp>
            <span className="text-xs text-fg-soft font-mono">5 Questions · Dual-Stream Recording</span>
          </div>
          <h3 className="font-display text-xl font-semibold text-fg">
            Autonomous Live AI Technical Interview Round
          </h3>
          <p className="text-xs text-fg-soft leading-relaxed">
            Take the 5-question AI technical assessment with continuous full-session master recording and isolated question-by-question answer clips. Results automatically advance your recruiter pipeline profile.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          icon={Video}
          onClick={() => navigate('/student/ai-interview')}
          className="shrink-0"
        >
          {hasAiSession ? 'Retake AI Interview →' : 'Start AI Interview Round →'}
        </Button>
      </Card>
    </PageTransition>
  );
}

export default StudentOverview;

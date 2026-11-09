import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-base shadow-lg shadow-indigo-500/30">
              CL
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight text-slate-100">CampusLink</span>
              <span className="text-[10px] ml-2 text-indigo-400 font-mono border border-indigo-500/30 rounded px-1.5 py-0.5">
                v2.0 Enterprise
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-slate-900 text-xs">
                Sign In
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs shadow-md shadow-indigo-600/30">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-20">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 bg-indigo-950/30 px-3 py-1 text-xs">
            Enterprise Placement Operating System
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Institutional Recruitment,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400">
              Engineered with Intelligence
            </span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Unified placement automation platform built with institutional Policy &amp; Eligibility Enforcement (PEP), 
            AI-powered resume match scoring, live drive-day panel dispatching, and interactive skill gap remediation.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link href="/login">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/30">
                Candidate Portal
              </Button>
            </Link>
            <Link href="/recruiter/war-room">
              <Button size="lg" variant="outline" className="border-slate-800 text-slate-200 hover:bg-slate-900">
                Recruiter War Room
              </Button>
            </Link>
            <Link href="/admin">
              <Button size="lg" variant="outline" className="border-slate-800 text-slate-200 hover:bg-slate-900">
                TPO Admin Console
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur text-slate-100 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mb-2">
                PEP
              </div>
              <CardTitle className="text-lg">Policy Engine</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              Pure functional rule evaluation with profile lock verification, standing backlog checks, CGPA gates, and automated 1.5x CTC tier upgrade enforcement.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur text-slate-100 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold mb-2">
                AI
              </div>
              <CardTitle className="text-lg">AI Resume Screener</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              Multi-factor graduate evaluation via Gemini 3.8 Flash (with 3.5 Flash backup). Scores core CS problem solving, technical project depth, and coursework with structured feedback.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur text-slate-100 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold mb-2">
                WR
              </div>
              <CardTitle className="text-lg">Drive-Day War Room</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              Real-time panel dispatching through Supabase Realtime channels. Instantly alert candidate devices with synthesized Web Audio chimes for interview rounds.
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/60 backdrop-blur text-slate-100 flex flex-col justify-between hover:border-slate-700 transition-colors">
            <CardHeader className="pb-3">
              <div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold mb-2">
                IDE
              </div>
              <CardTitle className="text-lg">Remediation Studio</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400 leading-relaxed">
              In-browser Monaco code studio paired with an execution runner for Python, Node.js, and C++, addressing diagnosed skill gaps from drive rejections.
            </CardContent>
          </Card>
        </div>

        {/* Institutional Flow Summary Banner */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-100">Ready to command campus hiring?</h3>
            <p className="text-xs text-slate-400">
              Sign in with your role to access your personalized candidate dashboard or recruitment command center.
            </p>
          </div>
          <Link href="/login">
            <Button className="bg-indigo-600 hover:bg-indigo-500 text-xs px-6 py-2.5">
              Launch CampusLink &rarr;
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>&copy; {new Date().getFullYear()} CampusLink. Enterprise Campus Placement Intelligence System.</p>
          <div className="flex gap-4">
            <Link href="/student" className="hover:text-slate-300">Students</Link>
            <Link href="/recruiter" className="hover:text-slate-300">Recruiters</Link>
            <Link href="/admin" className="hover:text-slate-300">TPO Cell</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

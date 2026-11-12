'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { acceptOffer } from '@/app/actions/placement';
import { ensureStudentProfile } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCollegeById } from '@/lib/colleges';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    // 1. Fetch Student Profile
    let { data: profile } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      try {
        await ensureStudentProfile(user.id, user.email || '', user.user_metadata?.college_id);
        const { data: createdProfile } = await supabase
          .from('student_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        profile = createdProfile;
      } catch (e) {
        console.warn('Could not auto-create profile:', e);
      }
    }

    setStudent(profile);

    // 2. Fetch Student Applications with Drive Details
    if (profile) {
      const { data: apps } = await supabase
        .from('drive_applications')
        .select(`
          id,
          stage,
          offer_status,
          offer_ctc,
          created_at,
          placement_drives (
            id,
            company_name,
            role_title,
            tier,
            min_ctc,
            max_ctc
          )
        `)
        .eq('student_id', profile.id)
        .order('created_at', { ascending: false });

      setApplications(apps || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAcceptOffer = async (applicationId: string) => {
    if (!confirm('Are you sure you want to accept this offer? Accepting an offer upgrades your placement status and may auto-revoke other active applications based on the PEP tier policy.')) {
      return;
    }

    setAcceptingId(applicationId);
    const res = await acceptOffer(applicationId);
    if (!res.success) {
      alert(`Error accepting offer: ${res.error}`);
    } else {
      alert(res.message);
      await loadData();
    }
    setAcceptingId(null);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
        <p className="text-sm text-slate-400">Loading student profile & applications...</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED_TIER_1':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Placed (Tier 1)</Badge>;
      case 'PLACED_TIER_2':
        return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/40">Placed (Tier 2)</Badge>;
      case 'PLACED_TIER_3':
        return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40">Placed (Tier 3)</Badge>;
      case 'DEBARRED':
        return <Badge variant="destructive">Debarred</Badge>;
      case 'UNPLACED':
      default:
        return <Badge variant="outline" className="text-slate-300 border-slate-700">Unplaced</Badge>;
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'OFFERED':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Offer Extended</Badge>;
      case 'INTERVIEW':
        return <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">Interview</Badge>;
      case 'ASSESSMENT':
        return <Badge className="bg-sky-500/20 text-sky-400 border border-sky-500/30">Assessment</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'APPLIED':
      default:
        return <Badge variant="secondary">Applied</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100">Student Placement Portal</h1>
            <p className="text-xs text-slate-400">Institutional Placement Eligibility & Policy Tracking</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/student/drives">
              <Button className="bg-indigo-600 hover:bg-indigo-500 text-xs">
                Browse Drives
              </Button>
            </Link>
            <Link href="/student/live-status">
              <Button variant="outline" className="border-indigo-600/40 text-indigo-400 hover:bg-indigo-950/40 text-xs">
                Live Dispatch Board
              </Button>
            </Link>
            <Link href="/student/remediation">
              <Button variant="outline" className="border-slate-800 text-slate-300 hover:bg-slate-900 text-xs">
                Remediation Studio
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-slate-800 text-xs text-slate-300 hover:bg-slate-900"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Institutional Verification Status Banner */}
        {student && !student.is_locked && (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 p-4 text-xs text-amber-300 flex items-start gap-3">
            <span className="text-xl">⏳</span>
            <div>
              <p className="font-semibold text-amber-200 text-sm">Academic Record Pending College TPO Verification</p>
              <p className="mt-0.5 text-amber-300/90 leading-relaxed">
                Your profile is submitted under <span className="font-bold text-white">{getCollegeById(student.tenant_id).name}</span>. Under BPUT Placement Eligibility Policy (PEP) Rule 1, you can browse placement drives, but drive applications will unlock once your College Placement Cell verifies and locks your record.
              </p>
            </div>
          </div>
        )}

        {student && student.is_locked && (
          <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>
                Verified &amp; Locked by <span className="font-semibold text-white">{getCollegeById(student.tenant_id).name}</span> — Fully eligible for PEP Placement Drives.
              </span>
            </div>
            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px]">
              PEP RULE 1 COMPLIANT
            </Badge>
          </div>
        )}

        {/* Academic & Verification Profile Overview */}
        {student ? (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Candidate Info</span>
                <CardTitle className="text-lg font-bold">{student.full_name || 'Student'}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-1">
                <p>Roll: <span className="text-slate-200 font-mono">{student.roll_number || 'N/A'}</span></p>
                <p>Branch: <span className="text-slate-200">{student.branch || 'Engineering'}</span></p>
                <p>College: <span className="text-indigo-300 font-medium">{getCollegeById(student.tenant_id).code}</span></p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Academic Standing</span>
                <CardTitle className="text-2xl font-bold text-indigo-400">
                  {Number(student.verified_cgpa).toFixed(2)} CGPA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p>
                  Active Backlogs:{' '}
                  <span className={student.active_backlogs > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400 font-semibold'}>
                    {student.active_backlogs}
                  </span>
                </p>
                <p className="mt-1">
                  Record Status:{' '}
                  <span className={student.is_locked ? 'text-emerald-400' : 'text-amber-400'}>
                    {student.is_locked ? 'Verified & Locked' : 'Pending Verification'}
                  </span>
                </p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Placement Status</span>
                <div className="pt-1">{getStatusBadge(student.placement_status)}</div>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p>Policy Tier: <span className="text-slate-200">{student.placement_status}</span></p>
                <p className="mt-1">Upgrade Cap: <span className="text-slate-200">1.5x Multiplier</span></p>
              </CardContent>
            </Card>

            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Highest Offer Secured</span>
                <CardTitle className="text-2xl font-bold text-emerald-400">
                  ₹{Number(student.current_highest_ctc).toFixed(2)} LPA
                </CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400">
                <p>Eligible for Next Tier: <span className="text-slate-200">{student.placement_status === 'PLACED_TIER_1' ? 'No (Cap Reached)' : 'Yes'}</span></p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-slate-800 bg-slate-900 text-slate-100 p-6">
            <h2 className="text-lg font-semibold text-amber-400">Student Profile Pending</h2>
            <p className="text-xs text-slate-400 mt-1">
              Your student profile has not been initialized yet. If you just registered, your record will be linked shortly by the TPO Administrator.
            </p>
          </Card>
        )}

        {/* Application History & Offer Acceptance */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100">
          <CardHeader className="flex flex-row justify-between items-center pb-2">
            <div>
              <CardTitle className="text-lg font-bold">Your Drive Applications</CardTitle>
              <p className="text-xs text-slate-400">Track application stages, reviews, and manage offers</p>
            </div>
            <Badge variant="outline" className="border-slate-700 text-slate-300">
              {applications.length} Total Applications
            </Badge>
          </CardHeader>
          <CardContent>
            {applications.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-sm">
                <p>You have not applied to any placement drives yet.</p>
                <Link href="/student/drives">
                  <Button className="mt-4 bg-indigo-600 hover:bg-indigo-500 text-xs">
                    View Eligible Drives
                  </Button>
                </Link>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Company & Role</TableHead>
                    <TableHead className="text-slate-400">Tier</TableHead>
                    <TableHead className="text-slate-400">Package Range</TableHead>
                    <TableHead className="text-slate-400">Stage</TableHead>
                    <TableHead className="text-slate-400">Offer Status</TableHead>
                    <TableHead className="text-right text-slate-400">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((app) => {
                    const drive = app.placement_drives;
                    const canAccept = app.offer_status === 'PENDING' && (app.stage === 'OFFERED' || app.offer_ctc);

                    return (
                      <TableRow key={app.id} className="border-slate-800 hover:bg-slate-800/40">
                        <TableCell>
                          <div className="font-medium text-slate-200">{drive?.company_name || 'Unknown Company'}</div>
                          <div className="text-xs text-slate-400">{drive?.role_title || 'Role'}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={drive?.tier === 'TIER_1' ? 'destructive' : drive?.tier === 'TIER_2' ? 'default' : 'secondary'}>
                            {drive?.tier}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-300">
                          ₹{drive?.min_ctc} - ₹{drive?.max_ctc} LPA
                        </TableCell>
                        <TableCell>
                          {getStageBadge(app.stage)}
                        </TableCell>
                        <TableCell>
                          {app.offer_status === 'ACCEPTED' ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">Offer Accepted</Badge>
                          ) : app.offer_status === 'AUTO_REVOKED' ? (
                            <Badge variant="outline" className="text-slate-400 border-slate-700">Auto Revoked</Badge>
                          ) : app.offer_status === 'REJECTED' ? (
                            <Badge variant="destructive">Declined</Badge>
                          ) : (
                            <span className="text-xs text-slate-400">Pending</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {canAccept ? (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptOffer(app.id)}
                              disabled={acceptingId === app.id}
                              className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                            >
                              {acceptingId === app.id ? 'Processing...' : 'Accept Offer'}
                            </Button>
                          ) : app.stage === 'REJECTED' ? (
                            <Link href={`/student/remediation?appId=${app.id}&driveTitle=${encodeURIComponent(drive?.company_name || 'Drive')}&role=${encodeURIComponent(drive?.role_title || 'Engineering')}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-indigo-600/50 text-indigo-400 hover:bg-indigo-950/40 text-xs gap-1"
                              >
                                <span>🚀</span> Roadmap
                              </Button>
                            </Link>
                          ) : (
                            <span className="text-xs text-slate-500">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


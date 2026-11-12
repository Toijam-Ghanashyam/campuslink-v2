'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { acceptOffer } from '@/app/actions/placement';
import { ensureStudentProfile, updateAndReverifyStudentProfile } from '@/app/actions/auth';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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

  // Fix Mismatch Modal State
  const [showFixModal, setShowFixModal] = useState(false);
  const [fixFullName, setFixFullName] = useState('');
  const [fixRollNumber, setFixRollNumber] = useState('');
  const [fixBranch, setFixBranch] = useState('Computer Science & Engineering');
  const [fixBatchYear, setFixBatchYear] = useState(2026);
  const [fixCgpa, setFixCgpa] = useState(7.5);
  const [fixBacklogs, setFixBacklogs] = useState(0);
  const [reverifying, setReverifying] = useState(false);
  const [reverifyFeedback, setReverifyFeedback] = useState<{ matched?: boolean; message?: string } | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

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

    if (profile) {
      setFixFullName(profile.full_name || '');
      setFixRollNumber(profile.roll_number || '');
      setFixBranch(profile.branch || 'Computer Science & Engineering');
      setFixBatchYear(profile.batch_year || 2026);
      setFixCgpa(Number(profile.verified_cgpa) || 0);
      setFixBacklogs(Number(profile.active_backlogs) || 0);

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

  const handleFixAndReverify = async (e: React.FormEvent) => {
    e.preventDefault();
    setReverifying(true);
    setReverifyFeedback(null);

    const res = await updateAndReverifyStudentProfile({
      full_name: fixFullName,
      roll_number: fixRollNumber,
      branch: fixBranch,
      batch_year: Number(fixBatchYear),
      verified_cgpa: Number(fixCgpa),
      active_backlogs: Number(fixBacklogs),
    });

    setReverifying(false);

    if (!res.success) {
      alert(`Error updating profile: ${res.error}`);
      return;
    }

    setReverifyFeedback({
      matched: res.matched,
      message: res.message,
    });

    await loadData();
    if (res.matched) {
      setTimeout(() => {
        setShowFixModal(false);
        setReverifyFeedback(null);
      }, 1200);
    }
  };

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
        <p className="text-sm text-slate-400">Loading student profile &amp; verification status...</p>
      </div>
    );
  }

  const isMismatchLocked =
    student &&
    !student.is_locked &&
    (student.verification_status === 'MISMATCH_LOCKED' || Boolean(student.rejection_reason));

  const mismatchList: string[] = student?.rejection_reason
    ? String(student.rejection_reason)
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

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
            <p className="text-xs text-slate-400">Institutional Placement Eligibility &amp; Dataset Verification</p>
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

        {/* 1. MISMATCH LOCKED BANNER WITH EXACT REASONS & "FIX THIS" CTA */}
        {isMismatchLocked && (
          <div className="rounded-xl border-2 border-rose-600/80 bg-rose-950/40 p-5 text-xs text-rose-200 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🔒</span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-rose-300 uppercase tracking-wide">
                      Account Status: Locked — Dataset Mismatch Detected
                    </h2>
                    <Badge variant="destructive" className="text-[10px]">
                      ACTION REQUIRED
                    </Badge>
                  </div>
                  <p className="text-rose-300/90 mt-0.5">
                    Your registration details did not match the official dataset uploaded by{' '}
                    <span className="font-bold text-white">{getCollegeById(student.tenant_id).name}</span>.
                    Drive applications are locked until you fix the mismatched data below:
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  setReverifyFeedback(null);
                  setShowFixModal(true);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 shadow-md"
              >
                🛠️ Fix This Data &amp; Re-Verify
              </Button>
            </div>

            <div className="rounded-lg border border-rose-800/80 bg-slate-950/80 p-3.5 space-y-1.5">
              <p className="font-bold text-rose-400 uppercase tracking-wider text-[11px]">
                Fix the following mismatched field(s):
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-200 text-xs">
                {mismatchList.map((item, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* 2. STANDARD PENDING VERIFICATION BANNER (When Admin hasn't uploaded dataset yet) */}
        {student && !student.is_locked && !isMismatchLocked && (
          <div className="rounded-lg border border-amber-800/60 bg-amber-950/40 p-4 text-xs text-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-xl">⏳</span>
              <div>
                <p className="font-semibold text-amber-200 text-sm">Academic Record Pending College TPO Dataset Verification</p>
                <p className="mt-0.5 text-amber-300/90 leading-relaxed">
                  Your profile is submitted under <span className="font-bold text-white">{getCollegeById(student.tenant_id).name}</span>. Once your TPO uploads the official college dataset or approves your record, your profile will automatically verify.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setReverifyFeedback(null);
                setShowFixModal(true);
              }}
              className="border-amber-700 text-amber-200 hover:bg-amber-900/40 text-xs shrink-0"
            >
              Edit / Re-Check Details
            </Button>
          </div>
        )}

        {/* 3. VERIFIED & UNLOCKED FOR DRIVES BANNER */}
        {student && student.is_locked && (
          <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-3 text-xs text-emerald-300 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold">✓</span>
              <span>
                Verified against <span className="font-semibold text-white">{getCollegeById(student.tenant_id).name}</span> Official Records — Fully eligible for PEP Placement Drives.
              </span>
            </div>
            <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-700/50 text-[10px]">
              {student.verification_source === 'DATASET_AUTO' ? 'AUTO-VERIFIED BY DATASET' : 'PEP RULE 1 COMPLIANT'}
            </Badge>
          </div>
        )}

        {/* Academic & Verification Profile Overview */}
        {student && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-slate-800 bg-slate-900 text-slate-100">
              <CardHeader className="pb-2">
                <span className="text-xs font-semibold text-slate-400 uppercase">Candidate Info</span>
                <CardTitle className="text-lg font-bold">{student.full_name || 'Student'}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-slate-400 space-y-1">
                <p>Roll: <span className="text-slate-200 font-mono">{student.roll_number || 'N/A'}</span></p>
                <p>Branch: <span className="text-slate-200">{student.branch || 'Engineering'}</span></p>
                <p>Batch: <span className="text-slate-200">{student.batch_year || 2026}</span></p>
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
                  Account Status:{' '}
                  <span className={student.is_locked ? 'text-emerald-400 font-semibold' : isMismatchLocked ? 'text-rose-400 font-semibold' : 'text-amber-400'}>
                    {student.is_locked ? '✓ Verified' : isMismatchLocked ? '🔒 Locked (Fix Required)' : '⏳ Pending'}
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
        )}

        {/* Application History */}
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
                    <TableHead className="text-slate-400">Company &amp; Role</TableHead>
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

      {/* Fix Mismatched Data & Re-Verify Dialog */}
      <Dialog open={showFixModal} onOpenChange={setShowFixModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Fix Mismatched Profile Details &amp; Re-Verify</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Correct the fields below so they match your official college placement dataset. Once matched, your account will automatically unlock.
            </DialogDescription>
          </DialogHeader>

          {mismatchList.length > 0 && (
            <div className="rounded-lg border border-rose-800/80 bg-rose-950/30 p-3 text-xs text-rose-200 space-y-1">
              <p className="font-bold text-rose-400 uppercase text-[10px]">Mismatches to Fix:</p>
              <ul className="list-disc list-inside space-y-0.5">
                {mismatchList.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={handleFixAndReverify} className="space-y-3 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Full Name (As per College Record)</label>
                <Input
                  required
                  value={fixFullName}
                  onChange={(e) => setFixFullName(e.target.value)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Roll / Registration Number</label>
                <Input
                  required
                  value={fixRollNumber}
                  onChange={(e) => setFixRollNumber(e.target.value)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Branch / Department</label>
                <select
                  value={fixBranch}
                  onChange={(e) => setFixBranch(e.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100"
                >
                  <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics & Telecommunication">Electronics & Telecommunication</option>
                  <option value="Electrical Engineering">Electrical Engineering</option>
                  <option value="Mechanical Engineering">Mechanical Engineering</option>
                  <option value="Civil Engineering">Civil Engineering</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Graduation Batch Year</label>
                <Input
                  type="number"
                  required
                  value={fixBatchYear}
                  onChange={(e) => setFixBatchYear(parseInt(e.target.value, 10) || 2026)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Official CGPA</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  required
                  value={fixCgpa}
                  onChange={(e) => setFixCgpa(parseFloat(e.target.value) || 0)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Active Backlogs</label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={fixBacklogs}
                  onChange={(e) => setFixBacklogs(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
                />
              </div>
            </div>

            {reverifyFeedback && (
              <div
                className={`rounded-lg border p-3 text-xs ${
                  reverifyFeedback.matched
                    ? 'border-emerald-800 bg-emerald-950/40 text-emerald-300'
                    : 'border-rose-800 bg-rose-950/40 text-rose-300'
                }`}
              >
                {reverifyFeedback.message}
              </div>
            )}

            <Button
              type="submit"
              disabled={reverifying}
              className="w-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-xs"
            >
              {reverifying ? 'Checking Against College Dataset...' : 'Submit Fixes & Re-Verify Now'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

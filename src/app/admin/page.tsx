'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toggleStudentLock, verifyStudentProfile, updateStudentAcademicRecord, createPlacementDrive } from '@/app/actions/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PlacementTier, PlacementStatus } from '@/types/pep';
import { CurriculumDeficitCluster } from '@/types/roadmap';
import { AFFILIATED_COLLEGES, getCollegeById } from '@/lib/colleges';

export default function AdminPortalPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [assignedCollegeId, setAssignedCollegeId] = useState<string>(AFFILIATED_COLLEGES[0].id);
  const [students, setStudents] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'drives' | 'curriculum'>('students');

  // Edit Student Modal
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editCgpa, setEditCgpa] = useState<number>(0);
  const [editBacklogs, setEditBacklogs] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<PlacementStatus>('UNPLACED');
  const [savingStudent, setSavingStudent] = useState(false);

  // New Drive Modal
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [newDrive, setNewDrive] = useState({
    company_name: '',
    role_title: '',
    tier: 'TIER_2' as PlacementTier,
    min_ctc: 8,
    max_ctc: 12,
    cgpa_cutoff: 7.0,
    status: 'SCHEDULED',
    description: '',
  });
  const [publishingDrive, setPublishingDrive] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  const loadData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);

    // Resolve the admin's strictly assigned college from user metadata or public.users
    let adminCollege = user.user_metadata?.college_id;
    if (!adminCollege) {
      const { data: pubUser } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .maybeSingle();
      adminCollege = pubUser?.tenant_id || AFFILIATED_COLLEGES[0].id;
    }
    setAssignedCollegeId(adminCollege);

    // 1. Fetch Students STRICTLY scoped to this admin's assigned college
    const { data: studentList } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('tenant_id', adminCollege)
      .order('created_at', { ascending: false });

    // 2. Fetch Placement Drives
    const { data: driveList } = await supabase
      .from('placement_drives')
      .select('*')
      .order('created_at', { ascending: false });

    // 3. Fetch Roadmaps for curriculum deficit aggregation
    const { data: roadmapList } = await supabase
      .from('candidate_roadmaps')
      .select('*')
      .order('created_at', { ascending: false });

    setStudents(studentList || []);
    setDrives(driveList || []);
    setRoadmaps(roadmapList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveStudent = async (studentId: string, currentCgpa: number, currentBacklogs: number) => {
    const res = await verifyStudentProfile(studentId, true, currentCgpa, currentBacklogs);
    if (res.success) {
      loadData();
    } else {
      alert(`Error approving student: ${res.error}`);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    if (!confirm('Reject this academic record? The candidate will be notified to correct and resubmit.')) {
      return;
    }
    const res = await verifyStudentProfile(studentId, false);
    if (res.success) {
      loadData();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleToggleLock = async (studentId: string, currentLock: boolean) => {
    const res = await toggleStudentLock(studentId, !currentLock);
    if (res.success) {
      loadData();
    } else {
      alert(`Error updating lock: ${res.error}`);
    }
  };

  const openEditModal = (student: any) => {
    setEditingStudent(student);
    setEditCgpa(student.verified_cgpa || 0);
    setEditBacklogs(student.active_backlogs || 0);
    setEditStatus(student.placement_status || 'UNPLACED');
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    setSavingStudent(true);
    const res = await updateStudentAcademicRecord(editingStudent.id, editCgpa, editBacklogs, editStatus);
    setSavingStudent(false);
    if (res.success) {
      setEditingStudent(null);
      loadData();
    } else {
      alert(`Error: ${res.error}`);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingDrive(true);
    const res = await createPlacementDrive(newDrive);
    setPublishingDrive(false);
    if (res.success) {
      setShowDriveModal(false);
      setNewDrive({
        company_name: '',
        role_title: '',
        tier: 'TIER_2',
        min_ctc: 8,
        max_ctc: 12,
        cgpa_cutoff: 7.0,
        status: 'SCHEDULED',
        description: '',
      });
      loadData();
    } else {
      alert(`Error publishing drive: ${res.error}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const currentCollege = getCollegeById(assignedCollegeId);

  // Compute Metrics strictly for this College
  const totalStudents = students.length;
  const lockedCount = students.filter((s) => s.is_locked).length;
  const pendingCount = students.filter((s) => !s.is_locked).length;
  const placedCount = students.filter((s) => s.placement_status && s.placement_status.startsWith('PLACED')).length;
  const placementRate = totalStudents > 0 ? ((placedCount / totalStudents) * 100).toFixed(1) : '0';

  if (loading) {
    return <div className="p-8 text-slate-100 bg-slate-950 min-h-screen">Loading TPO Administrative Console...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Permanent College Scoping */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-2xl">🏛️</span>
              <h1 className="text-2xl font-extrabold tracking-tight text-indigo-400">
                {currentCollege.name}
              </h1>
              <Badge className="bg-indigo-950 text-indigo-300 border border-indigo-700/60 font-mono text-xs">
                {currentCollege.code}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="text-emerald-400 font-medium">🔒 Institutional Firewall Enforced</span>
              <span>•</span>
              <span>Logged in: <span className="text-slate-300 font-mono">{currentUser?.email}</span></span>
              <span>•</span>
              <span>Exclusive access to <span className="font-semibold text-slate-200">{currentCollege.code}</span> candidates only</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setShowDriveModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs"
            >
              + Publish New Drive
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="border-slate-800 text-xs text-slate-300 hover:bg-slate-900"
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Analytics KPIs Scoped to this College */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">
                {currentCollege.code} Candidates
              </span>
              <CardTitle className="text-3xl font-bold">{totalStudents}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Active student profiles in {currentCollege.code}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Pending TPO Verification</span>
              <CardTitle className={`text-3xl font-bold ${pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {pendingCount}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {pendingCount > 0 ? 'Awaiting verification & PEP lock' : 'All student records verified'}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">{currentCollege.code} Placement Rate</span>
              <CardTitle className="text-3xl font-bold text-indigo-400">{placementRate}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {placedCount} placed out of {totalStudents} candidates
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Eligible Drives</span>
              <CardTitle className="text-3xl font-bold text-emerald-400">{drives.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Open for {currentCollege.code} verified candidates
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <Button
            variant={activeTab === 'students' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'bg-indigo-600 hover:bg-indigo-500' : 'text-slate-400'}
          >
            {currentCollege.code} Verification Queue ({students.length})
          </Button>
          <Button
            variant={activeTab === 'drives' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('drives')}
            className={activeTab === 'drives' ? 'bg-indigo-600 hover:bg-indigo-500' : 'text-slate-400'}
          >
            Placement Drives ({drives.length})
          </Button>
          <Button
            variant={activeTab === 'curriculum' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('curriculum')}
            className={activeTab === 'curriculum' ? 'bg-indigo-600 hover:bg-indigo-500' : 'text-slate-400'}
          >
            <span>📊</span> {currentCollege.code} Curriculum &amp; Skill Deficits
          </Button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">
                Candidate Eligibility Verification Queue — {currentCollege.name}
              </CardTitle>
              <p className="text-xs text-slate-400">
                Rule 1 of PEP requires a locked academic record before any drive application is permitted. TPO approval verifies self-reported CGPA and backlogs for {currentCollege.code} students.
              </p>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  No students currently registered under {currentCollege.name} ({currentCollege.code}).
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Candidate / Roll No</TableHead>
                      <TableHead className="text-slate-400">Branch &amp; Batch</TableHead>
                      <TableHead className="text-slate-400">Self-Reported CGPA</TableHead>
                      <TableHead className="text-slate-400">Backlogs</TableHead>
                      <TableHead className="text-slate-400">PEP Lock Status</TableHead>
                      <TableHead className="text-slate-400">Verification Source</TableHead>
                      <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((st) => (
                      <TableRow key={st.id} className="border-slate-800 hover:bg-slate-800/40">
                        <TableCell>
                          <div className="font-semibold text-slate-200">{st.full_name || 'Student Candidate'}</div>
                          <div className="text-xs font-mono text-indigo-300">{st.roll_number || 'No Roll Number'}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-200 text-xs">{st.branch || 'Engineering'}</div>
                          <div className="text-[11px] text-slate-400">Batch {st.batch_year || 2026}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-indigo-400 text-sm">{Number(st.verified_cgpa).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className={st.active_backlogs > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                            {st.active_backlogs}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              st.is_locked
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {st.is_locked ? '✓ Verified & Locked' : '⏳ Pending TPO Lock'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] text-slate-400">
                            {st.verification_source || 'ADMIN_MANUAL'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(st)}
                            className="h-7 text-xs border-slate-700 hover:bg-slate-800"
                          >
                            Edit
                          </Button>

                          {!st.is_locked ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproveStudent(st.id, st.verified_cgpa, st.active_backlogs)}
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 font-semibold"
                              >
                                ✓ Approve &amp; Lock
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRejectStudent(st.id)}
                                className="h-7 text-xs border-rose-800 text-rose-400 hover:bg-rose-950/40"
                              >
                                ✗ Reject
                              </Button>
                            </>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleToggleLock(st.id, st.is_locked)}
                              className="h-7 text-xs bg-amber-600 hover:bg-amber-500 font-semibold"
                            >
                              Unlock Record
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Drives Tab */}
        {activeTab === 'drives' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => (
              <Card key={drive.id} className="border-slate-800 bg-slate-900 text-slate-100 flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <Badge variant={drive.tier === 'TIER_1' ? 'destructive' : drive.tier === 'TIER_2' ? 'default' : 'secondary'}>
                      {drive.tier}
                    </Badge>
                    <span className="text-xs text-slate-400">Cutoff: {drive.cgpa_cutoff} CGPA</span>
                  </div>
                  <CardTitle className="text-xl mt-2">{drive.company_name}</CardTitle>
                  <p className="text-xs text-slate-400">{drive.role_title}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm font-semibold text-emerald-400">
                    ₹{drive.min_ctc} - ₹{drive.max_ctc} LPA
                  </div>
                  <p className="text-xs text-slate-400">{drive.description || 'No description provided.'}</p>
                  <div className="text-xs text-slate-500">Status: {drive.status}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Curriculum Deficits Tab */}
        {activeTab === 'curriculum' && (
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader>
              <CardTitle className="text-lg">
                Market Skill Deficit Clustering — {currentCollege.name} ({currentCollege.code})
              </CardTitle>
              <p className="text-xs text-slate-400">
                Aggregated screening diagnostics for {currentCollege.code} students.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-slate-800 bg-slate-950/60 flex items-start gap-3">
                  <span className="text-xl">💡</span>
                  <div className="text-xs text-slate-300 space-y-1">
                    <p className="font-semibold text-indigo-400">{currentCollege.code} Departmental Recommendations</p>
                    <p>
                      Diagnostics indicate {currentCollege.code} candidates frequently face screening rejections in cloud containerization, event streaming architectures, and real database execution profiling.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Student Academic Record Dialog */}
      <Dialog open={!!editingStudent} onOpenChange={(open) => !open && setEditingStudent(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Record</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Update verified credentials for {editingStudent?.roll_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs text-slate-400">Verified CGPA (0.00 - 10.00)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={editCgpa}
                onChange={(e) => setEditCgpa(parseFloat(e.target.value) || 0)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Active Standing Backlogs</label>
              <Input
                type="number"
                min="0"
                value={editBacklogs}
                onChange={(e) => setEditBacklogs(parseInt(e.target.value, 10) || 0)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Placement Policy Status</label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as PlacementStatus)}
                className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-slate-100 focus:outline-none"
              >
                <option value="UNPLACED">UNPLACED</option>
                <option value="PLACED_TIER_3">PLACED_TIER_3</option>
                <option value="PLACED_TIER_2">PLACED_TIER_2</option>
                <option value="PLACED_TIER_1">PLACED_TIER_1</option>
                <option value="DEBARRED">DEBARRED</option>
              </select>
            </div>
            <Button
              disabled={savingStudent}
              onClick={handleSaveStudent}
              className="w-full bg-indigo-600 hover:bg-indigo-500"
            >
              {savingStudent ? 'Saving...' : 'Save & Update Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* New Drive Dialog */}
      <Dialog open={showDriveModal} onOpenChange={setShowDriveModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish New Placement Drive</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Configure corporate placement drive visible to eligible verified students.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDrive} className="space-y-3 py-2">
            <div>
              <label className="text-xs text-slate-400">Company Name</label>
              <Input
                required
                value={newDrive.company_name}
                onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Google Cloud"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Role Title</label>
              <Input
                required
                value={newDrive.role_title}
                onChange={(e) => setNewDrive({ ...newDrive, role_title: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Cloud Infrastructure Engineer"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Placement Tier</label>
                <select
                  value={newDrive.tier}
                  onChange={(e) => setNewDrive({ ...newDrive, tier: e.target.value as PlacementTier })}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-slate-100 focus:outline-none"
                >
                  <option value="TIER_1">TIER_1 (&gt;= 12 LPA)</option>
                  <option value="TIER_2">TIER_2 (6 - 12 LPA)</option>
                  <option value="TIER_3">TIER_3 (&lt; 6 LPA)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400">Min CGPA Cutoff</label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  value={newDrive.cgpa_cutoff}
                  onChange={(e) => setNewDrive({ ...newDrive, cgpa_cutoff: parseFloat(e.target.value) || 0 })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400">Min CTC (LPA)</label>
                <Input
                  type="number"
                  required
                  value={newDrive.min_ctc}
                  onChange={(e) => setNewDrive({ ...newDrive, min_ctc: parseFloat(e.target.value) || 0 })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Max CTC (LPA)</label>
                <Input
                  type="number"
                  required
                  value={newDrive.max_ctc}
                  onChange={(e) => setNewDrive({ ...newDrive, max_ctc: parseFloat(e.target.value) || 0 })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>
            <Button
              type="submit"
              disabled={publishingDrive}
              className="w-full bg-indigo-600 hover:bg-indigo-500 mt-2"
            >
              {publishingDrive ? 'Publishing...' : 'Publish Placement Drive'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

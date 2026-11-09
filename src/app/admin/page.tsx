'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toggleStudentLock, updateStudentAcademicRecord, createPlacementDrive } from '@/app/actions/admin';
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

export default function AdminPortalPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'drives'>('students');

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

    const { data: studentList } = await supabase
      .from('student_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: driveList } = await supabase
      .from('placement_drives')
      .select('*')
      .order('created_at', { ascending: false });

    setStudents(studentList || []);
    setDrives(driveList || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

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

  // Compute Metrics
  const totalStudents = students.length;
  const lockedCount = students.filter((s) => s.is_locked).length;
  const placedCount = students.filter((s) => s.placement_status.startsWith('PLACED')).length;
  const placementRate = totalStudents > 0 ? ((placedCount / totalStudents) * 100).toFixed(1) : '0';

  if (loading) {
    return <div className="p-8 text-slate-100 bg-slate-950 min-h-screen">Loading TPO Administrative Console...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
              TPO Institutional Administrator Console
            </h1>
            <p className="text-xs text-slate-400">
              Academic Record Verification, PEP Policy Enforcement &amp; Placement Drives
            </p>
          </div>
          <div className="flex items-center gap-3">
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

        {/* Analytics KPIs */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Enrolled Candidates</span>
              <CardTitle className="text-3xl font-bold">{totalStudents}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Active candidates in placement pool
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">PEP Verified &amp; Locked</span>
              <CardTitle className="text-3xl font-bold text-emerald-400">{lockedCount}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {totalStudents - lockedCount} awaiting verification
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Institutional Placement Rate</span>
              <CardTitle className="text-3xl font-bold text-indigo-400">{placementRate}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {placedCount} candidates placed across Tiers
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">Active Placement Drives</span>
              <CardTitle className="text-3xl font-bold text-amber-400">{drives.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              Across Tier 1, Tier 2, and Tier 3
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-800 pb-2">
          <Button
            variant={activeTab === 'students' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('students')}
            className={activeTab === 'students' ? 'bg-indigo-600 hover:bg-indigo-500' : 'text-slate-400'}
          >
            Student Verification &amp; PEP Lock ({students.length})
          </Button>
          <Button
            variant={activeTab === 'drives' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('drives')}
            className={activeTab === 'drives' ? 'bg-indigo-600 hover:bg-indigo-500' : 'text-slate-400'}
          >
            Placement Drives ({drives.length})
          </Button>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Candidate Eligibility Verification Queue</CardTitle>
              <p className="text-xs text-slate-400">
                Rule 1 of PEP requires a locked academic record before any drive application is permitted.
              </p>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No registered student profiles found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Candidate</TableHead>
                      <TableHead className="text-slate-400">Roll / Branch</TableHead>
                      <TableHead className="text-slate-400">Verified CGPA</TableHead>
                      <TableHead className="text-slate-400">Backlogs</TableHead>
                      <TableHead className="text-slate-400">Placement Tier</TableHead>
                      <TableHead className="text-slate-400">PEP Lock</TableHead>
                      <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((st) => (
                      <TableRow key={st.id} className="border-slate-800 hover:bg-slate-800/40">
                        <TableCell>
                          <div className="font-semibold text-slate-200">{st.full_name || 'Candidate'}</div>
                          <div className="text-xs text-slate-400">₹{Number(st.current_highest_ctc || 0).toFixed(2)} LPA max</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-slate-200">{st.roll_number || 'N/A'}</div>
                          <div className="text-xs text-slate-400">{st.branch || 'General'}</div>
                        </TableCell>
                        <TableCell>
                          <span className="font-bold text-indigo-400">{Number(st.verified_cgpa).toFixed(2)}</span>
                        </TableCell>
                        <TableCell>
                          <span className={st.active_backlogs > 0 ? 'text-rose-400 font-semibold' : 'text-emerald-400'}>
                            {st.active_backlogs}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-700 text-slate-300 text-xs">
                            {st.placement_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`text-xs ${
                              st.is_locked
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-400 border border-amber-800'
                            }`}
                          >
                            {st.is_locked ? 'Verified & Locked' : 'Unlocked / Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(st)}
                            className="h-7 text-xs border-slate-700 hover:bg-slate-800"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleToggleLock(st.id, st.is_locked)}
                            className={`h-7 text-xs ${
                              st.is_locked
                                ? 'bg-amber-600 hover:bg-amber-500'
                                : 'bg-emerald-600 hover:bg-emerald-500'
                            }`}
                          >
                            {st.is_locked ? 'Unlock' : 'Verify & Lock'}
                          </Button>
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
      </div>

      {/* Edit Student Record Modal */}
      <Dialog open={!!editingStudent} onOpenChange={() => setEditingStudent(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Academic Record: {editingStudent?.full_name}</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update institutional records for roll number {editingStudent?.roll_number}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Verified CGPA</label>
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
              <label className="text-xs font-semibold uppercase text-slate-400">Active Standing Backlogs</label>
              <Input
                type="number"
                min="0"
                value={editBacklogs}
                onChange={(e) => setEditBacklogs(parseInt(e.target.value) || 0)}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Placement Status Tier</label>
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
              onClick={handleSaveStudent}
              disabled={savingStudent}
              className="w-full bg-indigo-600 hover:bg-indigo-500"
            >
              {savingStudent ? 'Saving...' : 'Save Academic Record'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Publish New Drive Modal */}
      <Dialog open={showDriveModal} onOpenChange={setShowDriveModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Publish New Placement Drive</DialogTitle>
            <DialogDescription className="text-slate-400">
              Configure corporate partner details, package tiers, and eligibility cutoffs.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateDrive} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Company Name</label>
              <Input
                required
                value={newDrive.company_name}
                onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Google / Atlassian"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Role Title</label>
              <Input
                required
                value={newDrive.role_title}
                onChange={(e) => setNewDrive({ ...newDrive, role_title: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Software Development Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Tier</label>
                <select
                  value={newDrive.tier}
                  onChange={(e) => setNewDrive({ ...newDrive, tier: e.target.value as PlacementTier })}
                  className="mt-1 w-full rounded-md border border-slate-800 bg-slate-950 p-2 text-sm text-slate-100 focus:outline-none"
                >
                  <option value="TIER_1">TIER_1 (Dream)</option>
                  <option value="TIER_2">TIER_2 (Core/IT)</option>
                  <option value="TIER_3">TIER_3 (Mass)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">CGPA Cutoff</label>
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Min CTC (LPA)</label>
                <Input
                  type="number"
                  step="0.5"
                  required
                  value={newDrive.min_ctc}
                  onChange={(e) => setNewDrive({ ...newDrive, min_ctc: parseFloat(e.target.value) || 0 })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Max CTC (LPA)</label>
                <Input
                  type="number"
                  step="0.5"
                  required
                  value={newDrive.max_ctc}
                  onChange={(e) => setNewDrive({ ...newDrive, max_ctc: parseFloat(e.target.value) || 0 })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Description</label>
              <Input
                value={newDrive.description}
                onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Job description and drive schedule notes"
              />
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


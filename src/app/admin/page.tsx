'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  toggleStudentLock,
  verifyStudentProfile,
  updateStudentAcademicRecord,
  createPlacementDrive,
  uploadCollegeDataset,
  deleteDatasetRegistryRow,
  autoRescheduleDrive,
  updatePlacementDriveSchedule,
  detectDriveConflicts,
  ConflictDetails,
} from '@/app/actions/admin';
import {
  parseStudentDatasetCsv,
  DatasetStudentRow,
} from '@/lib/dataset-validator';
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
  const [datasetRegistry, setDatasetRegistry] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'dataset' | 'drives' | 'curriculum'>('students');

  // Dataset Upload Modal State
  const [showDatasetModal, setShowDatasetModal] = useState(false);
  const [parsedDatasetRows, setParsedDatasetRows] = useState<DatasetStudentRow[]>([]);
  const [datasetFileName, setDatasetFileName] = useState('');
  const [uploadingDataset, setUploadingDataset] = useState(false);
  const [datasetUploadResult, setDatasetUploadResult] = useState<string | null>(null);
  const [parsingDatasetPdf, setParsingDatasetPdf] = useState(false);

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

  // Conflict Management & Manual Reschedule Modal
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [manualReviewDrive, setManualReviewDrive] = useState<any | null>(null);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualVenue, setManualVenue] = useState('');
  const [manualConflictNotice, setManualConflictNotice] = useState<ConflictDetails | null>(null);
  const [savingManualSchedule, setSavingManualSchedule] = useState(false);
  const [checkingManualConflict, setCheckingManualConflict] = useState(false);

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

    // Parallelize queries concurrently to eliminate network round-trip waterfall
    const [studentsRes, drivesRes, roadmapsRes, registryRes] = await Promise.all([
      supabase
        .from('student_profiles')
        .select('*')
        .eq('tenant_id', adminCollege)
        .order('created_at', { ascending: false }),
      supabase
        .from('placement_drives')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('candidate_roadmaps')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('college_student_registry')
        .select('*')
        .eq('tenant_id', adminCollege)
        .order('roll_number', { ascending: true }),
    ]);

    setStudents(studentsRes.data || []);
    setDrives(drivesRes.data || []);
    setRoadmaps(roadmapsRes.data || []);
    setDatasetRegistry(registryRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDatasetFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDatasetFileName(file.name);
    setDatasetUploadResult(null);
    setParsedDatasetRows([]);

    const fileName = file.name.toLowerCase();
    const isPdf = file.type === 'application/pdf' || fileName.endsWith('.pdf');

    if (isPdf) {
      setParsingDatasetPdf(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/parse-dataset-pdf', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          alert(`PDF Extraction Error: ${data.error || 'Failed to extract student records from PDF.'}`);
        } else {
          setParsedDatasetRows(data.rows || []);
        }
      } catch (err: any) {
        alert(`Error analyzing PDF: ${err.message || 'Network error processing PDF document'}`);
      } finally {
        setParsingDatasetPdf(false);
      }
      return;
    }

    try {
      const text = await file.text();
      if (fileName.endsWith('.json')) {
        const json = JSON.parse(text);
        const arr = Array.isArray(json) ? json : json.students || [];
        const normalized: DatasetStudentRow[] = arr.map((item: any) => ({
          roll_number: String(item.roll_number || item.rollNumber || item.id || '').trim().toUpperCase(),
          full_name: String(item.full_name || item.fullName || item.name || '').trim(),
          email: item.email ? String(item.email).trim().toLowerCase() : undefined,
          branch: String(item.branch || 'Computer Science & Engineering'),
          batch_year: Number(item.batch_year || item.batchYear || 2026),
          cgpa: Number(item.cgpa || item.verified_cgpa || 0),
          active_backlogs: Number(item.active_backlogs ?? item.activeBacklogs ?? 0),
        })).filter((r: DatasetStudentRow) => r.roll_number);
        setParsedDatasetRows(normalized);
      } else {
        const rows = parseStudentDatasetCsv(text);
        setParsedDatasetRows(rows);
      }
    } catch (err: any) {
      alert(`Failed to parse file: ${err.message}`);
      setParsedDatasetRows([]);
    }
  };

  const handleDownloadSampleCsv = () => {
    const sample = [
      'roll_number,full_name,email,branch,batch_year,cgpa,active_backlogs',
      '2505066,Zahid Khan,student1@campus.edu,Computer Science & Engineering,2026,8.45,0',
      '220101045,Aditya Patel,aditya@campus.edu,Computer Science & Engineering,2026,8.10,0',
      '220101089,Rohan Dash,rohan@campus.edu,Information Technology,2026,7.65,1',
    ].join('\n');

    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${getCollegeById(assignedCollegeId).code}_student_dataset_template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadDatasetSubmit = async () => {
    if (parsedDatasetRows.length === 0) {
      alert('No valid student rows found to upload.');
      return;
    }
    setUploadingDataset(true);
    const res = await uploadCollegeDataset(parsedDatasetRows);
    setUploadingDataset(false);

    if (res.success) {
      setDatasetUploadResult(res.message || 'Dataset uploaded and students verified!');
      await loadData();
    } else {
      alert(`Upload error: ${res.error}`);
    }
  };

  const handleDeleteRegistryRow = async (id: string) => {
    const res = await deleteDatasetRegistryRow(id);
    if (res.success) {
      loadData();
    } else {
      alert(res.error);
    }
  };

  const handleApproveStudent = async (studentId: string, currentCgpa: number, currentBacklogs: number) => {
    const res = await verifyStudentProfile(studentId, true, currentCgpa, currentBacklogs);
    if (res.success) {
      loadData();
    } else {
      alert(`Error approving student: ${res.error}`);
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    const reason = prompt(
      'Enter the mismatch/rejection reason (the student will see this and be asked to fix it):',
      'CGPA or Roll Number does not match official college records.'
    );
    if (reason === null) return;
    const res = await verifyStudentProfile(studentId, false, undefined, undefined, reason);
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

  const handleAutoReschedule = async (driveId: string) => {
    setReschedulingId(driveId);
    try {
      const res = await autoRescheduleDrive(driveId);
      if (res.success) {
        alert(res.message);
        await loadData();
      } else {
        alert(`Auto-Reschedule Failed: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error during auto-rescheduling: ${err.message}`);
    } finally {
      setReschedulingId(null);
    }
  };

  const openManualReview = (drive: any) => {
    setManualReviewDrive(drive);
    setManualDate((drive.drive_date || '').split('T')[0]);
    setManualStartTime(drive.start_time ? drive.start_time.slice(0, 5) : '10:00');
    setManualEndTime(drive.end_time ? drive.end_time.slice(0, 5) : '13:00');
    setManualVenue(drive.venue || 'Main Placement Auditorium');
    setManualConflictNotice(drive.conflict_details || null);
  };

  const checkManualConflict = async (dDate: string, sTime: string, eTime: string, ven: string) => {
    if (!manualReviewDrive || !dDate || !sTime || !eTime) return;
    setCheckingManualConflict(true);
    try {
      const result = await detectDriveConflicts(
        dDate,
        sTime,
        eTime,
        ven,
        manualReviewDrive.cgpa_cutoff || 7.0,
        manualReviewDrive.id
      );
      setManualConflictNotice(result.hasConflict ? result : null);
    } catch (err) {
      console.warn('Manual conflict check warning:', err);
    } finally {
      setCheckingManualConflict(false);
    }
  };

  const handleSaveManualSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReviewDrive) return;
    setSavingManualSchedule(true);
    try {
      const res = await updatePlacementDriveSchedule(
        manualReviewDrive.id,
        manualDate,
        manualStartTime,
        manualEndTime,
        manualVenue
      );
      if (res.success) {
        alert(res.message);
        setManualReviewDrive(null);
        await loadData();
      } else {
        alert(`Update Error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error updating schedule: ${err.message}`);
    } finally {
      setSavingManualSchedule(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const currentCollege = getCollegeById(assignedCollegeId);

  // Compute Metrics strictly for this College
  const totalStudents = students.length;
  const mismatchCount = students.filter(
    (s) => !s.is_locked && (s.verification_status === 'MISMATCH_LOCKED' || Boolean(s.rejection_reason))
  ).length;
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
              <span>Dataset Records Loaded: <span className="font-semibold text-indigo-300">{datasetRegistry.length}</span></span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => {
                setDatasetUploadResult(null);
                setParsedDatasetRows([]);
                setShowDatasetModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold"
            >
              📂 Upload College Dataset (CSV/JSON/PDF)
            </Button>
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
                Master Dataset Records
              </span>
              <CardTitle className="text-3xl font-bold text-emerald-400">{datasetRegistry.length}</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {datasetRegistry.length > 0
                ? 'Auto-verifying incoming student registrations'
                : 'Upload CSV/PDF dataset to enable auto-verification'}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">
                Mismatch Locked / Pending
              </span>
              <CardTitle className={`text-3xl font-bold ${mismatchCount > 0 ? 'text-rose-400' : pendingCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {mismatchCount} <span className="text-sm font-normal text-slate-400">/ {pendingCount} unverified</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {mismatchCount > 0
                ? `${mismatchCount} student(s) locked due to dataset mismatch`
                : 'Zero dataset mismatches detected'}
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="pb-2">
              <span className="text-xs font-semibold uppercase text-slate-400">{currentCollege.code} Placement Rate</span>
              <CardTitle className="text-3xl font-bold text-indigo-400">{placementRate}%</CardTitle>
            </CardHeader>
            <CardContent className="text-xs text-slate-400">
              {placedCount} placed out of {totalStudents} registered candidates
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
            variant={activeTab === 'dataset' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('dataset')}
            className={activeTab === 'dataset' ? 'bg-indigo-600 hover:bg-indigo-500' : 'text-slate-400'}
          >
            📂 Official College Dataset ({datasetRegistry.length})
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
                Candidate Eligibility &amp; Auto-Verification Queue — {currentCollege.name}
              </CardTitle>
              <p className="text-xs text-slate-400">
                Students registering after dataset upload are automatically checked. Any mismatch locks their profile and prompts them to fix the exact wrong field(s).
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
                      <TableHead className="text-slate-400">Submitted CGPA</TableHead>
                      <TableHead className="text-slate-400">Backlogs</TableHead>
                      <TableHead className="text-slate-400">Verification &amp; Lock Status</TableHead>
                      <TableHead className="text-slate-400">Source</TableHead>
                      <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((st) => {
                      const isMismatch =
                        !st.is_locked &&
                        (st.verification_status === 'MISMATCH_LOCKED' || Boolean(st.rejection_reason));

                      return (
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
                          <TableCell className="max-w-xs whitespace-normal">
                            {st.is_locked ? (
                              <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs">
                                ✓ Verified &amp; Unlocked for Drives
                              </Badge>
                            ) : isMismatch ? (
                              <div className="space-y-1">
                                <Badge className="bg-rose-950 text-rose-400 border border-rose-800 text-xs">
                                  🔒 Locked (Dataset Mismatch)
                                </Badge>
                                {st.rejection_reason && (
                                  <p className="text-[11px] text-rose-300/90 leading-snug">
                                    {st.rejection_reason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-xs">
                                ⏳ Pending Verification
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-[11px] font-mono text-slate-400">
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
                                  ✓ Force Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRejectStudent(st.id)}
                                  className="h-7 text-xs border-rose-800 text-rose-400 hover:bg-rose-950/40"
                                >
                                  ✕ Flag Mismatch
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleToggleLock(st.id, st.is_locked)}
                                className="h-7 text-xs bg-amber-600 hover:bg-amber-500 font-semibold"
                              >
                                Revoke Verification
                              </Button>
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
        )}

        {/* Official College Dataset Tab */}
        {activeTab === 'dataset' && (
          <Card className="border-slate-800 bg-slate-900 text-slate-100">
            <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3">
              <div>
                <CardTitle className="text-lg">
                  Official Master Student Dataset — {currentCollege.name}
                </CardTitle>
                <p className="text-xs text-slate-400">
                  Source-of-truth records used to automatically verify registering students or lock mismatched profiles.
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownloadSampleCsv}
                  className="border-slate-700 text-xs text-slate-300"
                >
                  ⬇ Sample CSV Template
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setDatasetUploadResult(null);
                    setParsedDatasetRows([]);
                    setShowDatasetModal(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                >
                  + Upload / Update Dataset (CSV/JSON/PDF)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {datasetRegistry.length === 0 ? (
                <div className="text-center py-12 space-y-3 text-slate-400 text-xs">
                  <p>No master student dataset uploaded for {currentCollege.code} yet.</p>
                  <Button
                    size="sm"
                    onClick={() => {
                      setDatasetUploadResult(null);
                      setParsedDatasetRows([]);
                      setShowDatasetModal(true);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-500 text-xs"
                  >
                    Upload College Dataset Now
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-transparent">
                      <TableHead className="text-slate-400">Roll Number / ID</TableHead>
                      <TableHead className="text-slate-400">Full Name</TableHead>
                      <TableHead className="text-slate-400">Email</TableHead>
                      <TableHead className="text-slate-400">Branch</TableHead>
                      <TableHead className="text-slate-400">Batch</TableHead>
                      <TableHead className="text-slate-400">Official CGPA</TableHead>
                      <TableHead className="text-slate-400">Backlogs</TableHead>
                      <TableHead className="text-right text-slate-400">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {datasetRegistry.map((row) => (
                      <TableRow key={row.id} className="border-slate-800 hover:bg-slate-800/40">
                        <TableCell className="font-mono text-indigo-300 font-semibold text-xs">
                          {row.roll_number}
                        </TableCell>
                        <TableCell className="text-slate-200 font-medium text-xs">
                          {row.full_name}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {row.email || '—'}
                        </TableCell>
                        <TableCell className="text-slate-300 text-xs">
                          {row.branch}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {row.batch_year}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-400 text-xs">
                          {Number(row.cgpa).toFixed(2)}
                        </TableCell>
                        <TableCell className={row.active_backlogs > 0 ? 'text-rose-400 font-semibold text-xs' : 'text-slate-300 text-xs'}>
                          {row.active_backlogs}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteRegistryRow(row.id)}
                            className="h-6 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40"
                          >
                            Delete
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

        {/* Drives Tab with Conflict Management & Smart Assisted Scheduling */}
        {activeTab === 'drives' && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => {
              const hasConflict = Boolean(drive.has_conflict || drive.conflict_details?.hasConflict);
              const details = drive.conflict_details;

              return (
                <div key={drive.id} className="flex flex-col space-y-2">
                  {/* Distinct Collision Warning UI */}
                  {hasConflict && (
                    <div className="rounded-xl border border-rose-400/60 bg-rose-950/40 p-3.5 space-y-2.5 text-rose-200 shadow-xl backdrop-blur-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>Scheduling Clash Detected</span>
                        </span>
                        <Badge
                          variant="destructive"
                          className="bg-rose-900/80 text-rose-100 border-rose-500/60 text-[10px] uppercase font-bold"
                        >
                          {details?.clashType || 'CONFLICT'}
                        </Badge>
                      </div>

                      <p className="text-xs font-medium leading-relaxed text-rose-100">
                        {details?.message || 'Drive schedule or venue clashes with another concurrent drive.'}
                      </p>

                      {details?.suggested_resolutions && details.suggested_resolutions.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-rose-900/50">
                          <span className="text-[10px] font-semibold text-rose-400 block">AI Suggested Fixes:</span>
                          <div className="flex flex-wrap gap-1">
                            {details.suggested_resolutions.map((res: string, idx: number) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-rose-900/60 text-rose-200 border border-rose-700/60 rounded px-1.5 py-0.5"
                              >
                                {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Fast Action Buttons: AI Auto-Reschedule & Manual Review */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-rose-900/50">
                        <Button
                          size="sm"
                          disabled={reschedulingId === drive.id}
                          onClick={() => handleAutoReschedule(drive.id)}
                          className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold text-white shadow-sm"
                        >
                          {reschedulingId === drive.id ? 'Fixing...' : '⚡ AI Auto-Reschedule'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openManualReview(drive)}
                          className="h-7 text-xs border-slate-700 text-slate-200 hover:bg-slate-800"
                        >
                          Manual Review &amp; Slot
                        </Button>
                      </div>
                    </div>
                  )}

                  <Card className="border-slate-800 bg-slate-900 text-slate-100 flex flex-col justify-between flex-1">
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

                      {/* Schedule and Venue Metadata */}
                      <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-xs space-y-1">
                        <div className="text-slate-300 flex items-center justify-between">
                          <span className="text-slate-400">Date:</span>
                          <span className="font-mono text-indigo-300">
                            {drive.drive_date ? drive.drive_date.split('T')[0] : 'Upcoming'}
                          </span>
                        </div>
                        <div className="text-slate-300 flex items-center justify-between">
                          <span className="text-slate-400">Time:</span>
                          <span className="font-mono text-slate-200">
                            {drive.start_time ? drive.start_time.slice(0, 5) : '10:00'} -{' '}
                            {drive.end_time ? drive.end_time.slice(0, 5) : '13:00'}
                          </span>
                        </div>
                        <div className="text-slate-300 flex items-center justify-between">
                          <span className="text-slate-400">Venue:</span>
                          <span className="text-slate-200 font-medium truncate max-w-[150px]">
                            {drive.venue || 'Main Placement Auditorium'}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-400 line-clamp-2">
                        {drive.description || 'No description provided.'}
                      </p>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                        <span className="text-xs text-slate-500">Status: {drive.status}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openManualReview(drive)}
                          className="h-6 text-[11px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-950/40 p-1"
                        >
                          Edit Slot
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
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

      {/* Upload College Dataset Modal */}
      <Dialog open={showDatasetModal} onOpenChange={setShowDatasetModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Official College Student Dataset ({currentCollege.code})</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Upload a CSV, JSON, or official PDF document (e.g. Merit List, Gazette, Roll Sheet). Gemini AI parses and extracts student credentials automatically from PDF files.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
              <div className="text-xs text-slate-300">
                Uploading CSV? Download the standard column template.
              </div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleDownloadSampleCsv}
                className="border-indigo-500/40 text-indigo-300 text-xs h-7"
              >
                ⬇ Download CSV Template
              </Button>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400 block mb-1">
                Select Dataset File (.csv, .json, or .pdf)
              </label>
              <Input
                type="file"
                accept=".csv,.json,.pdf,text/csv,application/json,application/pdf"
                onChange={handleDatasetFileSelect}
                disabled={parsingDatasetPdf || uploadingDataset}
                className="border-slate-800 bg-slate-950 text-slate-100 text-xs"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Supported formats: CSV, JSON, and PDF (official merit lists &amp; result sheets are parsed via Gemini AI).
              </p>
            </div>

            {parsingDatasetPdf && (
              <div className="rounded-lg border border-indigo-700/50 bg-indigo-950/30 p-4 text-center space-y-2">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent mx-auto" />
                <p className="text-xs font-semibold text-indigo-300">
                  Analyzing and extracting student records from PDF with Gemini AI...
                </p>
                <p className="text-[10px] text-slate-400">
                  Reading roll numbers, names, CGPAs, branches, and backlogs from {datasetFileName}
                </p>
              </div>
            )}

            {parsedDatasetRows.length > 0 && !parsingDatasetPdf && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-emerald-400">
                    ✓ Parsed {parsedDatasetRows.length} valid student record(s) from {datasetFileName}
                  </span>
                  <span className="text-slate-400">Previewing first 5 rows</span>
                </div>
                <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 max-h-48 overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-800">
                        <TableHead className="text-slate-400 text-xs">Roll No</TableHead>
                        <TableHead className="text-slate-400 text-xs">Full Name</TableHead>
                        <TableHead className="text-slate-400 text-xs">Branch</TableHead>
                        <TableHead className="text-slate-400 text-xs">Batch</TableHead>
                        <TableHead className="text-slate-400 text-xs">CGPA</TableHead>
                        <TableHead className="text-slate-400 text-xs">Backlogs</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedDatasetRows.slice(0, 5).map((r, i) => (
                        <TableRow key={i} className="border-slate-800 text-xs">
                          <TableCell className="font-mono text-indigo-300">{r.roll_number}</TableCell>
                          <TableCell>{r.full_name}</TableCell>
                          <TableCell>{r.branch}</TableCell>
                          <TableCell>{r.batch_year}</TableCell>
                          <TableCell className="text-emerald-400 font-bold">{r.cgpa}</TableCell>
                          <TableCell>{r.active_backlogs}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {datasetUploadResult && (
              <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300">
                ✓ {datasetUploadResult}
              </div>
            )}

            <Button
              disabled={uploadingDataset || parsingDatasetPdf || parsedDatasetRows.length === 0}
              onClick={handleUploadDatasetSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-500 font-semibold"
            >
              {uploadingDataset
                ? 'Uploading & Running Auto-Verification...'
                : `Save ${parsedDatasetRows.length} Records & Auto-Verify Students`}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Manual Drive Schedule Review Dialog */}
      <Dialog open={!!manualReviewDrive} onOpenChange={(open) => !open && setManualReviewDrive(null)}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <span>📅</span>
              <span>Review Drive Schedule &amp; Conflicts</span>
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-xs">
              Resolve timing or venue clashes for {manualReviewDrive?.company_name} — {manualReviewDrive?.role_title}
            </DialogDescription>
          </DialogHeader>

          {manualConflictNotice && manualConflictNotice.hasConflict && (
            <div className="rounded-lg border border-rose-500/60 bg-rose-950/40 p-3 space-y-1.5 text-rose-200 text-xs">
              <div className="flex items-center justify-between font-semibold">
                <span className="flex items-center gap-1">⚠️ Active Clash Detected</span>
                <Badge variant="destructive" className="text-[10px] bg-rose-900 text-rose-100">
                  {manualConflictNotice.clashType}
                </Badge>
              </div>
              <p className="text-rose-100 leading-relaxed">{manualConflictNotice.message}</p>
              {manualConflictNotice.suggested_resolutions && manualConflictNotice.suggested_resolutions.length > 0 && (
                <div className="pt-1 border-t border-rose-900/50">
                  <span className="text-[10px] text-rose-300 font-semibold block mb-1">Recommended Slots:</span>
                  <div className="flex flex-wrap gap-1">
                    {manualConflictNotice.suggested_resolutions.map((res: string, idx: number) => (
                      <span key={idx} className="text-[10px] bg-rose-900/60 text-rose-200 border border-rose-700/60 rounded px-1.5 py-0.5">
                        {res}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSaveManualSchedule} className="space-y-3.5 py-2">
            <div>
              <label className="text-xs text-slate-400 font-medium">Drive Date</label>
              <Input
                type="date"
                required
                value={manualDate}
                onChange={(e) => {
                  setManualDate(e.target.value);
                  checkManualConflict(e.target.value, manualStartTime, manualEndTime, manualVenue);
                }}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-slate-400 font-medium">Start Time</label>
                <Input
                  type="time"
                  required
                  value={manualStartTime}
                  onChange={(e) => {
                    setManualStartTime(e.target.value);
                    checkManualConflict(manualDate, e.target.value, manualEndTime, manualVenue);
                  }}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 font-medium">End Time</label>
                <Input
                  type="time"
                  required
                  value={manualEndTime}
                  onChange={(e) => {
                    setManualEndTime(e.target.value);
                    checkManualConflict(manualDate, manualStartTime, e.target.value, manualVenue);
                  }}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Venue / Hall Allocation</label>
              <Input
                type="text"
                required
                value={manualVenue}
                onChange={(e) => {
                  setManualVenue(e.target.value);
                  checkManualConflict(manualDate, manualStartTime, manualEndTime, e.target.value);
                }}
                placeholder="e.g. Main Placement Auditorium or Seminar Hall B"
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setManualReviewDrive(null)}
                className="flex-1 border-slate-800 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingManualSchedule || checkingManualConflict}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 font-semibold text-white"
              >
                {savingManualSchedule ? 'Saving...' : 'Apply Schedule & Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

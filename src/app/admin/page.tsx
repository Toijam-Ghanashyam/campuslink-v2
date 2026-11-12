'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Unlock, Edit3, Plus, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import {
  toggleStudentLock,
  verifyStudentProfile,
  updateStudentAcademicRecord,
  createPlacementDrive,
} from '@/app/actions/admin';
import { PlacementTier, PlacementStatus } from '@/types/pep';
import { AFFILIATED_COLLEGES, getCollegeById } from '@/lib/colleges';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { StatStrip } from '@/components/editorial/StatStrip';
import { Tabs } from '@/components/editorial/Tabs';
import { Card } from '@/components/editorial/Card';
import { Stamp } from '@/components/editorial/Stamp';
import { Callout } from '@/components/editorial/Callout';
import { Drawer } from '@/components/editorial/Drawer';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

export default function AdminPortalPage() {
  const [assignedCollegeId, setAssignedCollegeId] = useState<string>(AFFILIATED_COLLEGES[0].id);
  const [students, setStudents] = useState<any[]>([]);
  const [drives, setDrives] = useState<any[]>([]);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'drives' | 'curriculum'>('students');

  // Edit Student Drawer
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [editCgpa, setEditCgpa] = useState<number>(0);
  const [editBacklogs, setEditBacklogs] = useState<number>(0);
  const [editStatus, setEditStatus] = useState<PlacementStatus>('UNPLACED');
  const [savingStudent, setSavingStudent] = useState(false);

  // New Drive Drawer
  const [showDriveDrawer, setShowDriveDrawer] = useState(false);
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
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

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

    const { data: studentList } = await supabase
      .from('student_profiles')
      .select('*')
      .eq('tenant_id', adminCollege)
      .order('created_at', { ascending: false });

    const { data: driveList } = await supabase
      .from('placement_drives')
      .select('*')
      .order('created_at', { ascending: false });

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

  const handleApproveStudent = async (studentId: string, cgpa: number, backlogs: number) => {
    const res = await verifyStudentProfile(studentId, true, cgpa, backlogs);
    if (res.success) {
      toast('Student record verified & PEP-locked!', 'jade');
      loadData();
    } else {
      toast(res.error || 'Error approving student', 'brick');
    }
  };

  const handleRejectStudent = async (studentId: string) => {
    const res = await verifyStudentProfile(studentId, false);
    if (res.success) {
      toast('Student record unlocked for revision.', 'ochre');
      loadData();
    } else {
      toast(res.error || 'Error rejecting student', 'brick');
    }
  };

  const handleToggleLock = async (studentId: string, currentLock: boolean) => {
    const res = await toggleStudentLock(studentId, !currentLock);
    if (res.success) {
      toast(res.message || 'Updated lock status.', 'jade');
      loadData();
    } else {
      toast(res.error || 'Failed to update lock', 'brick');
    }
  };

  const handleSaveStudent = async () => {
    if (!editingStudent) return;
    setSavingStudent(true);
    const res = await updateStudentAcademicRecord(
      editingStudent.id,
      editCgpa,
      editBacklogs,
      editStatus
    );
    setSavingStudent(false);
    if (res.success) {
      setEditingStudent(null);
      toast('Academic record updated!', 'jade');
      loadData();
    } else {
      toast(res.error || 'Update failed', 'brick');
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishingDrive(true);
    const res = await createPlacementDrive(newDrive);
    setPublishingDrive(false);
    if (res.success) {
      setShowDriveDrawer(false);
      toast('Placement drive published!', 'jade');
      loadData();
    } else {
      toast(res.error || 'Failed to publish drive', 'brick');
    }
  };

  const currentCollege = getCollegeById(assignedCollegeId);
  const totalStudents = students.length;
  const pendingCount = students.filter((s) => !s.is_locked).length;
  const placedCount = students.filter(
    (s) => s.placement_status && s.placement_status.startsWith('PLACED')
  ).length;
  const placementRate =
    totalStudents > 0 ? Number(((placedCount / totalStudents) * 100).toFixed(1)) : 0;

  // Aggregate missing skills from roadmaps for Curriculum Deficits tab
  const skillFrequency: Record<string, number> = {};
  roadmaps.forEach((rm) => {
    (rm.missing_skills || []).forEach((sk: string) => {
      skillFrequency[sk] = (skillFrequency[sk] || 0) + 1;
    });
  });

  return (
    <AppShell
      role="admin"
      activeAdminTab={activeTab}
      onAdminTabChange={(t) => setActiveTab(t)}
    >
      <PageTransition className="space-y-6">
        <Masthead
          context={`TPO ADMINISTRATIVE CONSOLE · ${currentCollege.code} INSTITUTIONAL FIREWALL`}
          title={`${currentCollege.name}.`}
          lede={`Exclusive multi-tenant governance over ${currentCollege.code} candidates, PEP Rule 1 verification locks, and corporate placement drives.`}
          action={
            <Button
              variant="primary"
              icon={Plus}
              onClick={() => setShowDriveDrawer(true)}
            >
              Publish New Drive
            </Button>
          }
        />

        <StatStrip
          items={[
            {
              label: `${currentCollege.code} CANDIDATES`,
              value: totalStudents,
              hint: `Scoped strictly to ${currentCollege.code}`,
            },
            {
              label: 'PENDING TPO VERIFICATION',
              value: pendingCount,
              hint: pendingCount > 0 ? 'Awaiting PEP Rule 1 Lock' : 'All records certified',
            },
            {
              label: `${currentCollege.code} PLACEMENT RATE`,
              value: placementRate,
              decimals: 1,
              suffix: '%',
              hint: `${placedCount} of ${totalStudents} placed`,
            },
            {
              label: 'ELIGIBLE DRIVES',
              value: drives.length,
              hint: 'Open to verified candidates',
            },
          ]}
        />

        <Tabs
          tabs={[
            {
              id: 'students',
              label: `${currentCollege.code} Verification Queue`,
              count: students.length,
            },
            { id: 'drives', label: 'Placement Drives', count: drives.length },
            { id: 'curriculum', label: 'Curriculum & Skill Deficits' },
          ]}
          value={activeTab}
          onChange={(id: any) => setActiveTab(id)}
        />

        {/* TAB 1: STUDENTS VERIFICATION QUEUE */}
        {activeTab === 'students' && (
          <div className="space-y-3">
            {loading ? (
              <div className="py-12 text-center font-mono text-xs text-fg-soft">
                Loading {currentCollege.code} verification queue...
              </div>
            ) : students.length === 0 ? (
              <Card className="p-12 text-center text-xs text-fg-soft">
                No students registered under {currentCollege.name} ({currentCollege.code}) yet.
              </Card>
            ) : (
              <div className="w-full overflow-x-auto border-y border-line no-scrollbar">
                <table className="w-full min-w-[780px] text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-line bg-surface/60 font-mono text-[10.5px] uppercase tracking-wider text-fg-soft">
                      <th className="py-3 px-4">Candidate / Roll No</th>
                      <th className="py-3 px-4">Branch &amp; Batch</th>
                      <th className="py-3 px-4">Reported CGPA</th>
                      <th className="py-3 px-4">Backlogs</th>
                      <th className="py-3 px-4">PEP Lock Status</th>
                      <th className="py-3 px-4 text-right">TPO Audit Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {students.map((st) => (
                      <tr key={st.id} className="hover:bg-surface/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-display font-semibold text-base text-fg">
                            {st.full_name || 'Student Candidate'}
                          </p>
                          <p className="font-mono text-xs text-accent">{st.roll_number}</p>
                        </td>

                        <td className="py-3.5 px-4 text-xs">
                          <span className="font-medium text-fg">{st.branch}</span>
                          <p className="font-mono text-fg-soft">Batch {st.batch_year || 2026}</p>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-bold text-fg">
                          {Number(st.verified_cgpa).toFixed(2)}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <span
                            className={
                              st.active_backlogs > 0 ? 'text-brick font-bold' : 'text-jade'
                            }
                          >
                            {st.active_backlogs}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <Stamp tone={st.is_locked ? 'jade' : 'ochre'}>
                            {st.is_locked ? 'VERIFIED & LOCKED' : 'PENDING TPO LOCK'}
                          </Stamp>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={Edit3}
                              onClick={() => {
                                setEditingStudent(st);
                                setEditCgpa(st.verified_cgpa || 0);
                                setEditBacklogs(st.active_backlogs || 0);
                                setEditStatus(st.placement_status || 'UNPLACED');
                              }}
                            >
                              Edit
                            </Button>

                            {!st.is_locked ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="success"
                                  icon={Check}
                                  onClick={() =>
                                    handleApproveStudent(
                                      st.id,
                                      st.verified_cgpa,
                                      st.active_backlogs
                                    )
                                  }
                                >
                                  Approve &amp; Lock
                                </Button>
                                <Button
                                  size="sm"
                                  variant="danger"
                                  icon={X}
                                  onClick={() => handleRejectStudent(st.id)}
                                >
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                icon={Unlock}
                                onClick={() => handleToggleLock(st.id, st.is_locked)}
                              >
                                Unlock
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PLACEMENT DRIVES */}
        {activeTab === 'drives' && (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => (
              <Card key={drive.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Stamp
                    tone={
                      drive.tier === 'TIER_1'
                        ? 'ochre'
                        : drive.tier === 'TIER_2'
                        ? 'jade'
                        : 'ink'
                    }
                  >
                    {drive.tier}
                  </Stamp>
                  <span className="font-mono text-xs text-fg-soft">
                    Cutoff: {drive.cgpa_cutoff} CGPA
                  </span>
                </div>
                <h3 className="font-display font-semibold text-xl text-fg">
                  {drive.company_name}
                </h3>
                <p className="text-xs text-accent font-medium">{drive.role_title}</p>
                <div className="font-mono text-sm font-bold text-jade">
                  ₹{drive.min_ctc} – ₹{drive.max_ctc} LPA
                </div>
                <p className="text-xs text-fg-soft line-clamp-2">
                  {drive.description || 'Standard placement eligibility applies.'}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* TAB 3: CURRICULUM & SKILL DEFICITS */}
        {activeTab === 'curriculum' && (
          <div className="space-y-5">
            <Callout
              tone="ochre"
              icon={ShieldCheck}
              title={`${currentCollege.code} Departmental Syllabus & Market Deficit Intelligence`}
            >
              Aggregated from AI Resume Screening audits and rejected candidate roadmaps across {currentCollege.name}.
            </Callout>

            {Object.keys(skillFrequency).length > 0 && (
              <Card className="space-y-3">
                <span className="font-mono text-xs uppercase tracking-wider font-semibold text-fg block">
                  DETECTED CANDIDATE SKILL GAPS ACROSS DRIVES
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(skillFrequency).map(([skill, count]) => (
                    <Stamp key={skill} tone="brick">
                      {skill} ({count} CANDIDATES)
                    </Stamp>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}

        {/* Drawer: Edit Student Academic Record */}
        <Drawer
          open={Boolean(editingStudent)}
          onClose={() => setEditingStudent(null)}
          title="Edit Verified Academic Record"
          subtitle={`Roll No: ${editingStudent?.roll_number || ''}`}
        >
          <div className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                Verified CGPA (0.00 - 10.00)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={editCgpa}
                onChange={(e) => setEditCgpa(parseFloat(e.target.value) || 0)}
                className="w-full h-10 px-3 rounded-control border border-line bg-bg font-mono text-sm text-fg"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                Active Standing Backlogs
              </label>
              <input
                type="number"
                min="0"
                value={editBacklogs}
                onChange={(e) => setEditBacklogs(parseInt(e.target.value, 10) || 0)}
                className="w-full h-10 px-3 rounded-control border border-line bg-bg font-mono text-sm text-fg"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                PEP Placement Status
              </label>
              <select
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as PlacementStatus)}
                className="w-full h-10 px-3 rounded-control border border-line bg-bg text-sm text-fg"
              >
                <option value="UNPLACED">UNPLACED</option>
                <option value="PLACED_TIER_3">PLACED_TIER_3</option>
                <option value="PLACED_TIER_2">PLACED_TIER_2</option>
                <option value="PLACED_TIER_1">PLACED_TIER_1</option>
                <option value="DEBARRED">DEBARRED</option>
              </select>
            </div>

            <Button
              variant="primary"
              loading={savingStudent}
              onClick={handleSaveStudent}
              className="w-full"
            >
              Save &amp; Update Record
            </Button>
          </div>
        </Drawer>

        {/* Drawer: Publish New Drive */}
        <Drawer
          open={showDriveDrawer}
          onClose={() => setShowDriveDrawer(false)}
          title="Publish Institutional Placement Drive"
          subtitle="Visible to all PEP-verified candidates"
        >
          <form onSubmit={handleCreateDrive} className="space-y-4">
            <div>
              <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                Company Name *
              </label>
              <input
                required
                value={newDrive.company_name}
                onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs text-fg"
                placeholder="Google Cloud"
              />
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                Role Title *
              </label>
              <input
                required
                value={newDrive.role_title}
                onChange={(e) => setNewDrive({ ...newDrive, role_title: e.target.value })}
                className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs text-fg"
                placeholder="Cloud Infrastructure Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                  Placement Tier
                </label>
                <select
                  value={newDrive.tier}
                  onChange={(e) =>
                    setNewDrive({ ...newDrive, tier: e.target.value as PlacementTier })
                  }
                  className="w-full h-9 px-2.5 rounded-control border border-line bg-bg text-xs text-fg"
                >
                  <option value="TIER_1">TIER_1 (Dream &gt;= 12 LPA)</option>
                  <option value="TIER_2">TIER_2 (Core 6 - 12 LPA)</option>
                  <option value="TIER_3">TIER_3 (Mass &lt; 6 LPA)</option>
                </select>
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                  Min CGPA Cutoff
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newDrive.cgpa_cutoff}
                  onChange={(e) =>
                    setNewDrive({ ...newDrive, cgpa_cutoff: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                  Min CTC (LPA)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newDrive.min_ctc}
                  onChange={(e) =>
                    setNewDrive({ ...newDrive, min_ctc: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                />
              </div>
              <div>
                <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                  Max CTC (LPA)
                </label>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={newDrive.max_ctc}
                  onChange={(e) =>
                    setNewDrive({ ...newDrive, max_ctc: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs font-mono text-fg"
                />
              </div>
            </div>

            <div>
              <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                Description &amp; Candidate Criteria
              </label>
              <textarea
                rows={3}
                value={newDrive.description}
                onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                className="w-full p-2.5 rounded-control border border-line bg-bg text-xs text-fg"
                placeholder="Institutional eligibility requirements..."
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              loading={publishingDrive}
              className="w-full"
            >
              {publishingDrive ? 'Publishing...' : 'Publish Placement Drive'}
            </Button>
          </form>
        </Drawer>
      </PageTransition>
    </AppShell>
  );
}

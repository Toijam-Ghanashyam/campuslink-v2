'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createPlacementDrive } from '@/app/actions/admin';
import DriveCalendar from '@/components/DriveCalendar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlacementTier, PlacementDrive } from '@/types/pep';

export default function RecruiterCalendarPage() {
  const [drives, setDrives] = useState<PlacementDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [newDrive, setNewDrive] = useState({
    company_name: '',
    role_title: '',
    tier: 'TIER_2' as PlacementTier,
    min_ctc: 8,
    max_ctc: 12,
    cgpa_cutoff: 7.0,
    status: 'SCHEDULED',
    drive_date: '',
    description: '',
  });

  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const loadDrives = useCallback(async () => {
    const { data } = await supabase
      .from('placement_drives')
      .select('*')
      .order('drive_date', { ascending: true });

    setDrives((data as PlacementDrive[]) || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    let active = true;
    const fetchDrives = async () => {
      const { data } = await supabase
        .from('placement_drives')
        .select('*')
        .order('drive_date', { ascending: true });
      if (active) {
        setDrives((data as PlacementDrive[]) || []);
        setLoading(false);
      }
    };
    void fetchDrives();
    return () => {
      active = false;
    };
  }, [supabase]);

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    const res = await createPlacementDrive({
      ...newDrive,
      drive_date: newDrive.drive_date ? new Date(newDrive.drive_date).toISOString() : undefined,
    });
    setPublishing(false);

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
        drive_date: '',
        description: '',
      });
      loadDrives();
      alert('Placement drive proposal submitted to the TPO Placement Cell! It will appear in RED as PENDING until approved.');
    } else {
      alert(`Error scheduling drive: ${res.error}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link href="/recruiter" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">
                &larr; Back to Recruiter Hub
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
              Corporate Drive Scheduling Calendar
            </h1>
            <p className="text-xs text-slate-400">
              Review Scheduled Drives, Approval Statuses &amp; Proposed Interview Dates
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/recruiter/war-room">
              <Button variant="outline" className="border-emerald-600/50 text-emerald-400 hover:bg-emerald-950/40 text-xs">
                Launch War Room
              </Button>
            </Link>
            <Button
              onClick={() => setShowDriveModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs"
            >
              + Propose New Drive
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

        {/* Main Drive Calendar */}
        <DriveCalendar
          drives={drives}
          userRole="RECRUITER"
          isLoading={loading}
          onRefresh={loadDrives}
        />
      </div>

      {/* Post Drive Modal */}
      <Dialog open={showDriveModal} onOpenChange={setShowDriveModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Propose New Placement Drive</DialogTitle>
            <DialogDescription className="text-slate-400">
              New recruiter drives enter the PENDING approval queue until cleared by the TPO Administrator.
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
                placeholder="Amazon / Oracle"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Role Title</label>
              <Input
                required
                value={newDrive.role_title}
                onChange={(e) => setNewDrive({ ...newDrive, role_title: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Software Engineer"
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
              <label className="text-xs font-semibold uppercase text-slate-400">Proposed Drive Date</label>
              <Input
                type="date"
                value={newDrive.drive_date}
                onChange={(e) => setNewDrive({ ...newDrive, drive_date: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Job Description</label>
              <Input
                value={newDrive.description}
                onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                placeholder="Tech stack, requirements, and hiring process details"
              />
            </div>

            <Button
              type="submit"
              disabled={publishing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 mt-2"
            >
              {publishing ? 'Submitting Proposal...' : 'Propose Drive (Requires TPO Clearance)'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

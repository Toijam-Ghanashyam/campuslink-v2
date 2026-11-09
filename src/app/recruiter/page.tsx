'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createPlacementDrive } from '@/app/actions/admin';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlacementTier } from '@/types/pep';

export default function RecruiterDashboardPage() {
  const [drives, setDrives] = useState<any[]>([]);
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
    description: '',
  });

  const supabase = createClient();
  const router = useRouter();

  const loadDrives = async () => {
    setLoading(false);
    const { data } = await supabase
      .from('placement_drives')
      .select(`
        id,
        company_name,
        role_title,
        tier,
        min_ctc,
        max_ctc,
        cgpa_cutoff,
        status,
        drive_date,
        drive_applications ( count )
      `)
      .order('created_at', { ascending: false });

    setDrives(data || []);
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    const res = await createPlacementDrive(newDrive);
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
        description: '',
      });
      loadDrives();
    } else {
      alert(`Error publishing drive: ${res.error}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return <div className="p-8 text-slate-100 bg-slate-950 min-h-screen">Loading Recruiter Portal...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 md:p-8 text-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-indigo-400">
              Corporate Recruiter Hub
            </h1>
            <p className="text-xs text-slate-400">
              Manage Placement Campaigns, Review Applicants &amp; Command Drive-Day Panels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/recruiter/war-room">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-xs">
                Launch Drive-Day War Room
              </Button>
            </Link>
            <Button
              onClick={() => setShowDriveModal(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-xs"
            >
              + Post New Drive
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

        {/* Drives Grid */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-200">Corporate Hiring Drives</h2>
            <span className="text-xs text-slate-400">{drives.length} drives registered</span>
          </div>

          {drives.length === 0 ? (
            <Card className="border-slate-800 bg-slate-900 p-8 text-center text-slate-400">
              No placement drives registered yet. Click &quot;+ Post New Drive&quot; to begin.
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {drives.map((drive) => {
                const applicantCount = drive.drive_applications?.[0]?.count || 0;

                return (
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
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div className="text-sm font-semibold text-emerald-400">
                          ₹{drive.min_ctc} - ₹{drive.max_ctc} LPA
                        </div>
                        <Badge variant="outline" className="border-indigo-500/40 text-indigo-400 text-xs">
                          {applicantCount} Applicants
                        </Badge>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Link href="/recruiter/war-room" className="w-full">
                          <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-xs">
                            Open in War Room
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Post Drive Modal */}
      <Dialog open={showDriveModal} onOpenChange={setShowDriveModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Post New Placement Drive</DialogTitle>
            <DialogDescription className="text-slate-400">
              Publish an institutional hiring campaign with salary tiers and cutoffs.
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
              {publishing ? 'Publishing...' : 'Publish Drive'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}


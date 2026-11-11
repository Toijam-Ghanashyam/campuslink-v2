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

  // JD File Upload & AI Extraction States
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [targetRoleFilter, setTargetRoleFilter] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [extractedBranches, setExtractedBranches] = useState<string[]>([]);

  const getFutureDate = (daysAhead: number) => {
    return new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];
  };

  const [newDrive, setNewDrive] = useState({
    company_name: '',
    role_title: '',
    tier: 'TIER_2' as PlacementTier,
    min_ctc: 8,
    max_ctc: 12,
    cgpa_cutoff: 7.0,
    status: 'SCHEDULED',
    drive_date: '',
    deadline: '',
    description: '',
  });

  const supabase = createClient();
  const router = useRouter();

  const loadDrives = async () => {
    setLoading(true);
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
        description,
        drive_date,
        deadline,
        drive_applications ( count )
      `)
      .order('created_at', { ascending: false });

    setDrives(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDrives();
    setNewDrive((prev) => ({
      ...prev,
      drive_date: prev.drive_date || getFutureDate(7),
      deadline: prev.deadline || getFutureDate(5),
    }));
  }, []);

  const resetModalState = () => {
    setJdFile(null);
    setTargetRoleFilter('');
    setExtractionNotice(null);
    setExtractedSkills([]);
    setExtractedBranches([]);
    setNewDrive({
      company_name: '',
      role_title: '',
      tier: 'TIER_2',
      min_ctc: 8,
      max_ctc: 12,
      cgpa_cutoff: 7.0,
      status: 'SCHEDULED',
      drive_date: getFutureDate(7),
      deadline: getFutureDate(5),
      description: '',
    });
  };

  const handleExtractFromFile = async () => {
    if (!jdFile) {
      alert('Please select a Job Description file (.pdf, .txt, or .md) first.');
      return;
    }

    setExtracting(true);
    setExtractionNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', jdFile);
      if (targetRoleFilter.trim()) {
        formData.append('target_role', targetRoleFilter.trim());
      } else if (newDrive.role_title.trim()) {
        formData.append('target_role', newDrive.role_title.trim());
      }
      if (newDrive.company_name.trim()) {
        formData.append('company_name', newDrive.company_name.trim());
      }

      const res = await fetch('/api/extract-drive-info', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to extract drive details from file.');
      } else {
        const ext = data.extracted;
        setNewDrive({
          company_name: ext.company_name || newDrive.company_name,
          role_title: ext.role_title || targetRoleFilter || newDrive.role_title,
          tier: ext.tier || 'TIER_2',
          min_ctc: ext.min_ctc ?? 8,
          max_ctc: ext.max_ctc ?? 12,
          cgpa_cutoff: ext.cgpa_cutoff ?? 7.0,
          status: 'SCHEDULED',
          drive_date: ext.drive_date || getFutureDate(7),
          deadline: ext.deadline || getFutureDate(5),
          description: ext.description || '',
        });
        setExtractedSkills(ext.required_skills || []);
        setExtractedBranches(ext.eligible_branches || []);
        setExtractionNotice(
          `Auto-filled parameters for "${ext.role_title}" at ${ext.company_name}. Review and click Publish Drive below.`
        );
      }
    } catch (err: any) {
      alert(`Extraction error: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleCreateDrive = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    const res = await createPlacementDrive(newDrive);
    setPublishing(false);
    if (res.success) {
      setShowDriveModal(false);
      resetModalState();
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
              Manage Placement Campaigns, Upload Role JDs for AI Auto-Fill &amp; Command Drive-Day Panels
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/recruiter/war-room">
              <Button className="bg-emerald-600 hover:bg-emerald-500 text-xs">
                Launch Drive-Day War Room
              </Button>
            </Link>
            <Button
              onClick={() => {
                resetModalState();
                setShowDriveModal(true);
              }}
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
                      <p className="text-xs text-indigo-400 font-medium">{drive.role_title}</p>
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

                      {drive.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                          {drive.description}
                        </p>
                      )}

                      {drive.drive_date && (
                        <div className="text-[11px] text-slate-500 flex justify-between border-t border-slate-800/80 pt-2">
                          <span>Drive: {new Date(drive.drive_date).toLocaleDateString()}</span>
                          <span>Status: {drive.status}</span>
                        </div>
                      )}

                      <div className="flex gap-2 pt-1">
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

      {/* Post Drive Modal with Role-Based JD Upload & AI Auto-Fill */}
      <Dialog open={showDriveModal} onOpenChange={setShowDriveModal}>
        <DialogContent className="border-slate-800 bg-slate-900 text-slate-100 sm:max-w-lg max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Post New Placement Drive</DialogTitle>
            <DialogDescription className="text-slate-400">
              Upload a Job Description (PDF/TXT/MD) to auto-extract eligibility &amp; package details by role, or configure manually.
            </DialogDescription>
          </DialogHeader>

          {/* AI Role Document Auto-Extractor Box */}
          <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                ✨ AI Job Description Auto-Extractor
              </span>
              <Badge variant="outline" className="border-indigo-500/40 text-indigo-300 text-[10px]">
                Gemini 3.8 Flash + PDF Parser
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Target Role to Extract (Optional)
                </label>
                <Input
                  value={targetRoleFilter}
                  onChange={(e) => setTargetRoleFilter(e.target.value)}
                  className="border-slate-800 bg-slate-950 text-slate-100 text-xs h-8"
                  placeholder="e.g. SDE-1 / Data Analyst"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  Upload Role JD (.pdf, .txt, .md)
                </label>
                <Input
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setJdFile(selected);
                    setExtractionNotice(null);
                  }}
                  className="border-slate-800 bg-slate-950 text-slate-100 text-xs h-8"
                />
              </div>
            </div>

            <Button
              type="button"
              onClick={handleExtractFromFile}
              disabled={!jdFile || extracting}
              className="w-full bg-indigo-600/90 hover:bg-indigo-500 text-xs h-8 font-semibold"
            >
              {extracting
                ? 'Extracting Role Info with Gemini AI...'
                : '⚡ Extract Required Info from File Automatically'}
            </Button>

            {extractionNotice && (
              <div className="rounded-lg border border-emerald-800/60 bg-emerald-950/30 p-2.5 text-xs text-emerald-300 space-y-2">
                <p className="font-medium">{extractionNotice}</p>
                {extractedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400 mr-1">Skills:</span>
                    {extractedSkills.map((skill, idx) => (
                      <Badge
                        key={idx}
                        variant="outline"
                        className="text-[10px] border-emerald-700/50 text-emerald-200 bg-emerald-950/50"
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
                {extractedBranches.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-400 mr-1">Branches:</span>
                    {extractedBranches.map((br, idx) => (
                      <Badge
                        key={idx}
                        variant="secondary"
                        className="text-[10px] bg-slate-900 text-slate-300"
                      >
                        {br}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <form onSubmit={handleCreateDrive} className="space-y-3 py-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  min="0"
                  max="10"
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Drive Date</label>
                <Input
                  type="date"
                  value={newDrive.drive_date}
                  onChange={(e) => setNewDrive({ ...newDrive, drive_date: e.target.value })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Application Deadline</label>
                <Input
                  type="date"
                  value={newDrive.deadline}
                  onChange={(e) => setNewDrive({ ...newDrive, deadline: e.target.value })}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">
                Job Description &amp; Extracted Requirements
              </label>
              <textarea
                rows={3}
                value={newDrive.description}
                onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                className="mt-1 w-full rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Tech stack, requirements, eligible branches, and hiring process details"
              />
            </div>

            <Button
              type="submit"
              disabled={publishing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 mt-2"
            >
              {publishing ? 'Publishing Drive...' : 'Publish Drive'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  createPlacementDrive,
  detectDriveConflicts,
  autoRescheduleDrive,
  updatePlacementDriveSchedule,
  ConflictDetails,
} from '@/app/actions/admin';
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
  const [conflictWarning, setConflictWarning] = useState<ConflictDetails | null>(null);
  const [checkingConflict, setCheckingConflict] = useState(false);

  // Conflict Management & Reschedule States
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [manualReviewDrive, setManualReviewDrive] = useState<any | null>(null);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('');
  const [manualEndTime, setManualEndTime] = useState('');
  const [manualVenue, setManualVenue] = useState('');
  const [manualConflictNotice, setManualConflictNotice] = useState<ConflictDetails | null>(null);
  const [savingManualSchedule, setSavingManualSchedule] = useState(false);
  const [checkingManualConflict, setCheckingManualConflict] = useState(false);

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
    start_time: '10:00',
    end_time: '13:00',
    venue: 'Main Placement Auditorium',
    description: '',
  });

  const supabase = createClient();
  const router = useRouter();

  const loadDrives = async () => {
    setLoading(true);
    let drivesData: any[] | null = null;

    // 1. Try full select with timing, venue & conflict tracking
    const res = await supabase
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
        start_time,
        end_time,
        venue,
        has_conflict,
        conflict_details,
        drive_applications ( count )
      `)
      .order('created_at', { ascending: false });

    if (res.data) {
      drivesData = res.data;
    } else if (res.error) {
      // 2. If extended columns do not exist in schema, fallback to base schema
      const fallback = await supabase
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

      drivesData = fallback.data;
    }

    setDrives(drivesData || []);
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
    setConflictWarning(null);
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
      start_time: '10:00',
      end_time: '13:00',
      venue: 'Main Placement Auditorium',
      description: '',
    });
  };

  const checkLiveConflicts = async (date: string, start: string, end: string, v: string, cgpa: number) => {
    if (!date || !start || !end) return;
    setCheckingConflict(true);
    try {
      const result = await detectDriveConflicts(date, start, end, v, cgpa);
      if (result.hasConflict) {
        setConflictWarning(result);
      } else {
        setConflictWarning(null);
      }
    } catch (e) {
      console.warn('Conflict live check warning:', e);
    } finally {
      setCheckingConflict(false);
    }
  };

  const handleAiAutoFixInModal = () => {
    // Automatically shift to non-conflicting afternoon slot and alternate venue
    const updated = {
      ...newDrive,
      start_time: '14:00',
      end_time: '17:00',
      venue: newDrive.venue.toLowerCase().includes('hall b') ? 'Virtual Auditorium 1' : 'Seminar Hall B (Block 2)',
    };
    setNewDrive(updated);
    checkLiveConflicts(updated.drive_date, updated.start_time, updated.end_time, updated.venue, updated.cgpa_cutoff);
  };

  const handleAutoRescheduleDrive = async (driveId: string) => {
    setReschedulingId(driveId);
    try {
      const res = await autoRescheduleDrive(driveId);
      if (res.success) {
        alert(res.message);
        await loadDrives();
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
        await loadDrives();
      } else {
        alert(`Update Error: ${res.error}`);
      }
    } catch (err: any) {
      alert(`Error updating schedule: ${err.message}`);
    } finally {
      setSavingManualSchedule(false);
    }
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
        const targetDate = ext.drive_date || getFutureDate(7);
        const targetDeadline = ext.deadline || getFutureDate(5);
        setNewDrive({
          company_name: ext.company_name || newDrive.company_name,
          role_title: ext.role_title || targetRoleFilter || newDrive.role_title,
          tier: ext.tier || 'TIER_2',
          min_ctc: ext.min_ctc ?? 8,
          max_ctc: ext.max_ctc ?? 12,
          cgpa_cutoff: ext.cgpa_cutoff ?? 7.0,
          status: 'SCHEDULED',
          drive_date: targetDate,
          deadline: targetDeadline,
          start_time: newDrive.start_time || '10:00',
          end_time: newDrive.end_time || '13:00',
          venue: newDrive.venue || 'Main Placement Auditorium',
          description: ext.description || '',
        });
        setExtractedSkills(ext.required_skills || []);
        setExtractedBranches(ext.eligible_branches || []);
        setExtractionNotice(
          `Auto-filled parameters for "${ext.role_title}" at ${ext.company_name}. Review schedule details below.`
        );
        checkLiveConflicts(
          targetDate,
          newDrive.start_time || '10:00',
          newDrive.end_time || '13:00',
          newDrive.venue || 'Main Placement Auditorium',
          ext.cgpa_cutoff ?? 7.0
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
      await loadDrives();
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
                const hasConflict = Boolean(drive.has_conflict || drive.conflict_details?.hasConflict);
                const details = drive.conflict_details;

                return (
                  <div key={drive.id} className="flex flex-col space-y-2">
                    {/* Conflict Warning UI on Card */}
                    {hasConflict && (
                      <div className="rounded-xl border border-rose-400/60 bg-rose-950/40 p-3 space-y-2 text-rose-200 shadow-lg">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold uppercase tracking-wider text-rose-300 flex items-center gap-1">
                            <span>⚠️</span>
                            <span>Scheduling Collision Detected</span>
                          </span>
                          <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                            {details?.clashType || 'CONFLICT'}
                          </Badge>
                        </div>
                        <p className="text-xs text-rose-100">
                          {details?.message || 'Drive schedule or venue clashes with another concurrent drive.'}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            size="sm"
                            disabled={reschedulingId === drive.id}
                            onClick={() => handleAutoRescheduleDrive(drive.id)}
                            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold flex-1 text-white shadow"
                          >
                            {reschedulingId === drive.id ? 'Rescheduling...' : '⚡ Fix with AI'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openManualReview(drive)}
                            className="h-7 text-xs border-rose-700/80 text-rose-200 hover:bg-rose-900/40 flex-1"
                          >
                            🛠️ Fix Manually
                          </Button>
                        </div>
                      </div>
                    )}

                    <Card className={`border-slate-800 bg-slate-900 text-slate-100 flex flex-col justify-between h-full ${hasConflict ? 'border-t-2 border-t-rose-500/80' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={drive.tier === 'TIER_1' ? 'destructive' : drive.tier === 'TIER_2' ? 'default' : 'secondary'}>
                              {drive.tier}
                            </Badge>
                            {hasConflict && (
                              <Badge variant="destructive" className="bg-rose-950/80 text-rose-300 border border-rose-700/60 text-[10px]">
                                ⚠️ Conflict
                              </Badge>
                            )}
                          </div>
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
                          <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-2 space-y-1">
                            <div className="flex justify-between items-center">
                              <span>📅 {new Date(drive.drive_date).toLocaleDateString()}</span>
                              <span>{drive.start_time ? `⏰ ${drive.start_time.slice(0, 5)} - ${drive.end_time?.slice(0, 5) || '13:00'}` : ''}</span>
                            </div>
                            {drive.venue && (
                              <div className="text-[10px] text-slate-500 truncate">
                                📍 {drive.venue}
                              </div>
                            )}
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
                  </div>
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
                  onChange={(e) => {
                    const next = { ...newDrive, drive_date: e.target.value };
                    setNewDrive(next);
                    checkLiveConflicts(next.drive_date, next.start_time, next.end_time, next.venue, next.cgpa_cutoff);
                  }}
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

            {/* Time Slot & Venue Allocation (Step 3) */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">Start Time</label>
                <Input
                  id="drive-start-time-input"
                  type="time"
                  required
                  value={newDrive.start_time}
                  onChange={(e) => {
                    const next = { ...newDrive, start_time: e.target.value };
                    setNewDrive(next);
                    checkLiveConflicts(next.drive_date, next.start_time, next.end_time, next.venue, next.cgpa_cutoff);
                  }}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase text-slate-400">End Time</label>
                <Input
                  type="time"
                  required
                  value={newDrive.end_time}
                  onChange={(e) => {
                    const next = { ...newDrive, end_time: e.target.value };
                    setNewDrive(next);
                    checkLiveConflicts(next.drive_date, next.start_time, next.end_time, next.venue, next.cgpa_cutoff);
                  }}
                  className="mt-1 border-slate-800 bg-slate-950 text-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase text-slate-400">Drive Venue / Facility</label>
              <Input
                type="text"
                required
                value={newDrive.venue}
                onChange={(e) => {
                  const next = { ...newDrive, venue: e.target.value };
                  setNewDrive(next);
                  checkLiveConflicts(next.drive_date, next.start_time, next.end_time, next.venue, next.cgpa_cutoff);
                }}
                placeholder="e.g. Auditorium Hall A / Virtual Lab 3"
                className="mt-1 border-slate-800 bg-slate-950 text-slate-100 text-xs"
              />
            </div>

            {/* Live Conflict Warning Box inside Recruiter Modal */}
            {conflictWarning && (
              <div className="rounded-lg border border-rose-800/80 bg-rose-950/40 p-3 text-xs text-rose-300 space-y-2.5 shadow-md">
                <div className="font-semibold flex items-center justify-between text-rose-200">
                  <span className="flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Scheduling Collision Warning</span>
                  </span>
                  <Badge variant="destructive" className="text-[10px] uppercase font-bold">
                    {conflictWarning.clashType}
                  </Badge>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-300">{conflictWarning.message}</p>
                {conflictWarning.suggested_resolutions?.length > 0 && (
                  <div className="text-[10px] text-rose-400 pt-1.5 border-t border-rose-900/50">
                    <span className="font-bold text-rose-200 block mb-1">Click an AI Suggested Slot to Apply:</span>
                    <div className="flex flex-wrap gap-1">
                      {conflictWarning.suggested_resolutions.map((res, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (res.includes('02:00 PM')) {
                              const updated = { ...newDrive, start_time: '14:00', end_time: '17:00' };
                              setNewDrive(updated);
                              checkLiveConflicts(updated.drive_date, '14:00', '17:00', updated.venue, updated.cgpa_cutoff);
                            } else if (res.includes('08:30 AM')) {
                              const updated = { ...newDrive, start_time: '08:30', end_time: '11:30' };
                              setNewDrive(updated);
                              checkLiveConflicts(updated.drive_date, '08:30', '11:30', updated.venue, updated.cgpa_cutoff);
                            } else if (res.toLowerCase().includes('hall b')) {
                              const updated = { ...newDrive, venue: 'Seminar Hall B (Block 2)' };
                              setNewDrive(updated);
                              checkLiveConflicts(updated.drive_date, updated.start_time, updated.end_time, 'Seminar Hall B (Block 2)', updated.cgpa_cutoff);
                            } else if (res.toLowerCase().includes('virtual')) {
                              const updated = { ...newDrive, venue: 'Virtual Auditorium 1' };
                              setNewDrive(updated);
                              checkLiveConflicts(updated.drive_date, updated.start_time, updated.end_time, 'Virtual Auditorium 1', updated.cgpa_cutoff);
                            }
                          }}
                          className="text-[10px] bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-700/60 rounded px-2 py-0.5 transition cursor-pointer text-left"
                        >
                          👉 {res}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Both CTAs: Fix with AI and Fix Manually */}
                <div className="flex items-center gap-2 pt-1 border-t border-rose-900/50">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAiAutoFixInModal}
                    className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 font-semibold flex-1 text-white shadow"
                  >
                    ⚡ Fix with AI (Auto-Shift)
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const el = document.getElementById('drive-start-time-input');
                      el?.focus();
                    }}
                    className="h-8 text-xs border-rose-700/80 text-rose-200 hover:bg-rose-900/40 flex-1"
                  >
                    🛠️ Fix Manually
                  </Button>
                </div>
              </div>
            )}

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

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Users, FileUp, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { createPlacementDrive } from '@/app/actions/admin';
import { PlacementTier } from '@/types/pep';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { StatStrip } from '@/components/editorial/StatStrip';
import { Card } from '@/components/editorial/Card';
import { Stamp } from '@/components/editorial/Stamp';
import { Drawer } from '@/components/editorial/Drawer';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

export default function RecruiterDashboardPage() {
  const [drives, setDrives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDriveDrawer, setShowDriveDrawer] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // JD AI Auto-Extraction state
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [targetRoleFilter, setTargetRoleFilter] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractionNotice, setExtractionNotice] = useState<string | null>(null);

  const [newDrive, setNewDrive] = useState({
    company_name: '',
    role_title: '',
    tier: 'TIER_2' as PlacementTier,
    min_ctc: 8,
    max_ctc: 12,
    cgpa_cutoff: 7.0,
    status: 'SCHEDULED',
    drive_date: '2026-11-19',
    deadline: '2026-11-17',
    description: '',
  });

  const getFutureDate = (daysAhead: number) =>
    new Date(Date.now() + daysAhead * 86400000).toISOString().split('T')[0];

  useEffect(() => {
    setNewDrive((prev) => ({
      ...prev,
      drive_date: getFutureDate(7),
      deadline: getFutureDate(5),
    }));
  }, []);

  const supabase = createClient();
  const { toast } = useToast();

  const loadDrives = async () => {
    setLoading(true);
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
        drive_applications ( count )
      `)
      .order('created_at', { ascending: false });

    setDrives(res.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadDrives();
  }, []);

  const handleExtractFromFile = async () => {
    if (!jdFile) {
      toast('Select a Job Description file (.pdf, .txt, or .md) first.', 'brick');
      return;
    }

    setExtracting(true);
    setExtractionNotice(null);

    try {
      const formData = new FormData();
      formData.append('file', jdFile);
      if (targetRoleFilter.trim()) formData.append('target_role', targetRoleFilter.trim());
      if (newDrive.company_name.trim()) formData.append('company_name', newDrive.company_name.trim());

      const res = await fetch('/api/extract-drive-info', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast(data.error || 'Failed to extract JD parameters.', 'brick');
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
        setExtractionNotice(
          `Extracted parameters for "${ext.role_title}" at ${ext.company_name}.`
        );
        toast('JD auto-extracted with Gemini AI!', 'jade');
      }
    } catch (err: any) {
      toast(`Extraction error: ${err.message}`, 'brick');
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
      setShowDriveDrawer(false);
      toast('Placement drive published!', 'jade');
      await loadDrives();
    } else {
      toast(`Error: ${res.error}`, 'brick');
    }
  };

  const totalApplicants = drives.reduce(
    (acc, d) => acc + (d.drive_applications?.[0]?.count || 0),
    0
  );
  const tier1Count = drives.filter((d) => d.tier === 'TIER_1').length;

  return (
    <AppShell role="recruiter">
      <PageTransition className="space-y-6">
        <Masthead
          context="01 · CORPORATE RECRUITER HUB · JNF & AI JD PARSER"
          title="Corporate Hiring Campaigns."
          lede="Upload Role Job Descriptions (.pdf / .txt) for instant Gemini AI parameter extraction, publish placement drives, and command live interview panels."
          action={
            <div className="flex items-center gap-2.5">
              <Link href="/recruiter/war-room">
                <Button variant="secondary" icon={Users}>
                  Launch Drive-Day War Room
                </Button>
              </Link>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => setShowDriveDrawer(true)}
              >
                Post New Drive
              </Button>
            </div>
          }
        />

        <StatStrip
          items={[
            { label: 'ACTIVE HIRING DRIVES', value: drives.length, hint: 'Published across BPUT' },
            { label: 'TOTAL APPLICANTS', value: totalApplicants, hint: 'PEP-verified candidates' },
            { label: 'TIER 1 (DREAM) DRIVES', value: tier1Count, hint: '>= 15 LPA compensation' },
            { label: 'AI SCREENING ENGINE', value: 'ACTIVE', hint: 'Gemini Fit Rubric Enabled' },
          ]}
        />

        {loading ? (
          <div className="py-12 text-center font-mono text-xs text-fg-soft">
            Loading corporate drives...
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {drives.map((drive) => {
              const applicantCount = drive.drive_applications?.[0]?.count || 0;
              return (
                <Card key={drive.id} className="flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
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
                        Min CGPA: <strong className="text-fg">{drive.cgpa_cutoff}</strong>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-display font-semibold text-xl text-fg">
                        {drive.company_name}
                      </h3>
                      <p className="text-xs text-accent font-medium mt-0.5">
                        {drive.role_title}
                      </p>
                    </div>

                    <div className="flex items-center justify-between font-mono text-xs">
                      <span className="font-bold text-jade text-sm">
                        ₹{drive.min_ctc} – ₹{drive.max_ctc} LPA
                      </span>
                      <span className="px-2 py-0.5 rounded bg-bg border border-line text-fg">
                        {applicantCount} Applicants
                      </span>
                    </div>

                    {drive.description && (
                      <p className="text-xs text-fg-soft line-clamp-2 leading-relaxed">
                        {drive.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-line">
                    <Link href="/recruiter/war-room" className="block">
                      <Button variant="primary" icon={ArrowRight} className="w-full">
                        Open in War Room
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {/* Drawer: Post New Drive with AI JD Auto-Extractor */}
        <Drawer
          open={showDriveDrawer}
          onClose={() => setShowDriveDrawer(false)}
          title="Publish New Placement Drive"
          subtitle="Upload a JD document for Gemini AI auto-fill or configure parameters manually"
        >
          <div className="space-y-5">
            {/* AI JD Extractor Box */}
            <div className="p-4 rounded-xl border border-accent/40 bg-accent-tint/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-fg flex items-center gap-1.5">
                  <FileUp className="w-4 h-4 text-accent" />
                  AI Job Description Auto-Extractor
                </span>
                <Stamp tone="ochre">GEMINI PDF/TXT</Stamp>
              </div>

              <div className="space-y-2.5">
                <input
                  type="text"
                  value={targetRoleFilter}
                  onChange={(e) => setTargetRoleFilter(e.target.value)}
                  placeholder="Optional Role Filter (e.g. SDE-1 / Data Analyst)"
                  className="w-full h-9 px-3 rounded-control border border-line bg-surface text-xs text-fg"
                />
                <input
                  type="file"
                  accept=".pdf,.txt,.md,application/pdf,text/plain"
                  onChange={(e) => setJdFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-fg file:mr-3 file:py-1.5 file:px-3 file:rounded-control file:border-0 file:bg-btn file:text-btn-fg file:font-mono file:text-xs"
                />
                <Button
                  type="button"
                  variant="accent"
                  loading={extracting}
                  disabled={!jdFile || extracting}
                  onClick={handleExtractFromFile}
                  className="w-full"
                >
                  {extracting ? 'Extracting with Gemini AI...' : '⚡ Auto-Extract JD Info'}
                </Button>
              </div>

              {extractionNotice && (
                <p className="font-mono text-[11px] text-jade font-semibold">
                  ✓ {extractionNotice}
                </p>
              )}
            </div>

            <form onSubmit={handleCreateDrive} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                    Company Name *
                  </label>
                  <input
                    required
                    value={newDrive.company_name}
                    onChange={(e) => setNewDrive({ ...newDrive, company_name: e.target.value })}
                    className="w-full h-9 px-3 rounded-control border border-line bg-bg text-xs text-fg"
                    placeholder="Microsoft / Atlassian"
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
                    placeholder="Software Engineer"
                  />
                </div>
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
                    <option value="TIER_1">TIER_1 (Dream)</option>
                    <option value="TIER_2">TIER_2 (Core/IT)</option>
                    <option value="TIER_3">TIER_3 (Mass)</option>
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] uppercase text-fg-soft block mb-1">
                    CGPA Cutoff
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
                  Description &amp; Extracted Skills
                </label>
                <textarea
                  rows={3}
                  value={newDrive.description}
                  onChange={(e) => setNewDrive({ ...newDrive, description: e.target.value })}
                  className="w-full p-2.5 rounded-control border border-line bg-bg text-xs text-fg"
                />
              </div>

              <Button type="submit" variant="primary" loading={publishing} className="w-full">
                {publishing ? 'Publishing Drive...' : 'Publish Placement Drive'}
              </Button>
            </form>
          </div>
        </Drawer>
      </PageTransition>
    </AppShell>
  );
}

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CalendarDays, Radio, Code2, Rocket, CheckCircle2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { acceptOffer } from '@/app/actions/placement';
import { ensureStudentProfile } from '@/app/actions/auth';
import { getCollegeById } from '@/lib/colleges';
import { AppShell } from '@/components/layout/AppShell';
import { Masthead } from '@/components/editorial/Masthead';
import { StatStrip } from '@/components/editorial/StatStrip';
import { Callout } from '@/components/editorial/Callout';
import { Stamp } from '@/components/editorial/Stamp';
import { Button } from '@/components/editorial/Button';
import { PageTransition } from '@/components/editorial/PageTransition';
import { useToast } from '@/components/editorial/Toast';

export default function StudentDashboardPage() {
  const [student, setStudent] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

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
      const { data: apps } = await supabase
        .from('drive_applications')
        .select(`
          id,
          stage,
          offer_status,
          offer_ctc,
          ai_fit_score,
          ai_feedback_summary,
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

  const handleAcceptOffer = async (applicationId: string) => {
    if (
      !confirm(
        'Accept this placement offer? Under PEP Tier Policy, accepting an offer upgrades your placement status and auto-revokes lower/same-tier active applications.'
      )
    ) {
      return;
    }

    setAcceptingId(applicationId);
    const res = await acceptOffer(applicationId);
    if (!res.success) {
      toast(`Error accepting offer: ${res.error}`, 'brick');
    } else {
      toast(res.message || 'Offer accepted!', 'jade');
      await loadData();
    }
    setAcceptingId(null);
  };

  const college = getCollegeById(student?.tenant_id);

  return (
    <AppShell role="student">
      <PageTransition className="space-y-6">
        <Masthead
          context={`01 · CANDIDATE PLACEMENT LEDGER · ${college.code}`}
          title={student?.full_name ? `${student.full_name}.` : 'Student Placement Portal.'}
          lede="Institutional Placement Eligibility Policy (PEP) standing, verified academic credentials, and real-time drive applications."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <Link href="/student/drives">
                <Button variant="primary" icon={CalendarDays}>
                  Browse Drives
                </Button>
              </Link>
              <Link href="/student/live-status">
                <Button variant="secondary" icon={Radio}>
                  Live Dispatch
                </Button>
              </Link>
              <Link href="/student/remediation">
                <Button variant="secondary" icon={Code2}>
                  Remediation Studio
                </Button>
              </Link>
            </div>
          }
        />

        {/* PEP Rule 1 Verification Banner */}
        {student && !student.is_locked && (
          <Callout
            tone="ochre"
            title="Academic Record Pending College TPO Verification (PEP Rule 1)"
          >
            Your profile is registered under <strong>{college.name}</strong>. You can explore active placement drives, and 1-click applications will unlock as soon as your College TPO verifies and locks your CGPA &amp; backlog record.
          </Callout>
        )}

        {student && student.is_locked && (
          <Callout
            tone="jade"
            title={`Verified & Locked by ${college.name} — PEP Rule 1 Compliant`}
            action={<Stamp tone="jade">VERIFIED &amp; LOCKED</Stamp>}
          >
            Your academic transcript is officially locked for placement season. You are cleared to submit resumes to eligible corporate drives.
          </Callout>
        )}

        {/* 4-Metric StatStrip */}
        {student && (
          <StatStrip
            items={[
              {
                label: 'ROLL & INSTITUTION',
                value: student.roll_number || 'PENDING',
                hint: `${student.branch || 'Engineering'} · ${college.code}`,
              },
              {
                label: 'VERIFIED CGPA',
                value: Number(student.verified_cgpa || 0),
                decimals: 2,
                suffix: ' / 10',
                hint: `Active Backlogs: ${student.active_backlogs || 0}`,
              },
              {
                label: 'POLICY STANDING',
                value: student.placement_status || 'UNPLACED',
                hint: 'Upgrade Multiplier: 1.5x CTC Cap',
              },
              {
                label: 'HIGHEST OFFER SECURED',
                value: Number(student.current_highest_ctc || 0),
                decimals: 2,
                prefix: '₹',
                suffix: ' LPA',
                hint:
                  student.placement_status === 'PLACED_TIER_1'
                    ? 'Tier 1 Cap Reached'
                    : 'Eligible for Tier Upgrade',
              },
            ]}
          />
        )}

        {/* Applications & Offer Acceptance Table */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-line pb-2">
            <span className="font-mono text-xs uppercase tracking-wider font-semibold text-fg">
              SUBMITTED DRIVE APPLICATIONS ({applications.length})
            </span>
            <span className="font-mono text-[11px] text-fg-soft">
              REAL-TIME STAGE &amp; OFFER LOCKER
            </span>
          </div>

          {loading ? (
            <div className="py-12 text-center font-mono text-xs text-fg-soft">
              Loading candidate placement ledger...
            </div>
          ) : applications.length === 0 ? (
            <div className="py-14 text-center rounded-object border border-dashed border-line bg-surface/50 space-y-3">
              <p className="font-display text-lg text-fg">No placement drives applied yet.</p>
              <p className="text-xs text-fg-soft">
                Browse active corporate drives to run AI Resume Screening and submit your application.
              </p>
              <Link href="/student/drives" className="inline-block pt-1">
                <Button variant="primary">Explore Eligible Drives &rarr;</Button>
              </Link>
            </div>
          ) : (
            <div className="w-full overflow-x-auto border-y border-line no-scrollbar">
              <table className="w-full min-w-[720px] text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-line bg-surface/60 font-mono text-[10.5px] uppercase tracking-wider text-fg-soft">
                    <th className="py-3 px-4">Company &amp; Role</th>
                    <th className="py-3 px-4">Tier</th>
                    <th className="py-3 px-4">CTC Band</th>
                    <th className="py-3 px-4">AI Fit</th>
                    <th className="py-3 px-4">Current Stage</th>
                    <th className="py-3 px-4">Offer Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {applications.map((app) => {
                    const drive = app.placement_drives;
                    const canAccept =
                      app.offer_status === 'PENDING' &&
                      (app.stage === 'OFFERED' || app.offer_ctc);

                    return (
                      <tr key={app.id} className="hover:bg-surface/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-display font-semibold text-base text-fg">
                            {drive?.company_name || 'Enterprise Partner'}
                          </p>
                          <p className="font-sans text-xs text-fg-soft">
                            {drive?.role_title || 'Software Engineer'}
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <Stamp
                            tone={
                              drive?.tier === 'TIER_1'
                                ? 'ochre'
                                : drive?.tier === 'TIER_2'
                                ? 'jade'
                                : 'ink'
                            }
                          >
                            {drive?.tier || 'TIER_2'}
                          </Stamp>
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs font-semibold text-fg">
                          ₹{drive?.min_ctc} – ₹{drive?.max_ctc} LPA
                        </td>

                        <td className="py-3.5 px-4 font-mono text-xs">
                          {app.ai_fit_score ? (
                            <span className="font-bold text-jade">{app.ai_fit_score}%</span>
                          ) : (
                            <span className="text-fg-soft">—</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <Stamp
                            tone={
                              app.stage === 'OFFERED'
                                ? 'jade'
                                : app.stage === 'REJECTED'
                                ? 'brick'
                                : 'ochre'
                            }
                          >
                            {app.stage}
                          </Stamp>
                        </td>

                        <td className="py-3.5 px-4">
                          {app.offer_status === 'ACCEPTED' ? (
                            <Stamp tone="jade">ACCEPTED</Stamp>
                          ) : app.offer_status === 'AUTO_REVOKED' ? (
                            <Stamp tone="brick">AUTO REVOKED</Stamp>
                          ) : app.offer_status === 'REJECTED' ? (
                            <Stamp tone="brick">DECLINED</Stamp>
                          ) : (
                            <span className="font-mono text-xs text-fg-soft">PENDING</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {canAccept ? (
                            <Button
                              size="sm"
                              variant="success"
                              icon={CheckCircle2}
                              loading={acceptingId === app.id}
                              onClick={() => handleAcceptOffer(app.id)}
                            >
                              Accept Offer
                            </Button>
                          ) : app.stage === 'REJECTED' ? (
                            <Link
                              href={`/student/remediation?appId=${app.id}&driveTitle=${encodeURIComponent(
                                drive?.company_name || 'Drive'
                              )}&role=${encodeURIComponent(
                                drive?.role_title || 'Engineering'
                              )}`}
                            >
                              <Button size="sm" variant="accent" icon={Rocket}>
                                Skill Roadmap
                              </Button>
                            </Link>
                          ) : (
                            <span className="font-mono text-xs text-fg-soft">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </PageTransition>
    </AppShell>
  );
}

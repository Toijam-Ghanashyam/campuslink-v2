import React from 'react';
import { Masthead } from '../../components/ui/Masthead';
import { Stamp } from '../../components/ui/Stamp';
import { Button } from '../../components/ui/Button';
import { PageTransition } from '../../components/ui/PageTransition';

export function RecruiterJobs() {
  const jobs = [
    {
      id: 'job-1',
      title: 'Software Development Engineer (SDE-1)',
      package: '16.5 - 21.0 LPA',
      location: 'Hyderabad / Bangalore / Virtual',
      applicants: 342,
      shortlisted: 48,
      status: 'Active Hiring',
      deadline: 'Oct 18, 2026',
    },
    {
      id: 'job-2',
      title: 'Cloud Solutions Architect Trainee',
      package: '18.0 - 24.0 LPA',
      location: 'Bangalore Campus',
      applicants: 186,
      shortlisted: 24,
      status: 'Active Hiring',
      deadline: 'Nov 04, 2026',
    },
    {
      id: 'job-3',
      title: 'Data & Applied AI Research Fellow',
      package: '19.5 - 25.0 LPA',
      location: 'Hyderabad Campus',
      applicants: 142,
      shortlisted: 18,
      status: 'Active Hiring',
      deadline: 'Nov 12, 2026',
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="02 · JOB NOTIFICATION FORMS (JNFs)"
        title="Active Recruitment Profiles."
        lede="Open Job Notification Forms deployed across BPUT affiliated engineering colleges for Class of 2026."
      />

      <div className="divide-y divide-line border-y border-line">
        {jobs.map((job) => (
          <div key={job.id} className="py-5 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-bone/40 transition-colors">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="font-display font-medium text-xl text-ink">
                  {job.title}
                </h3>
                <Stamp tone="ochre">
                  {job.status}
                </Stamp>
              </div>

              <p className="font-sans text-xs text-ink-soft">
                Package: <strong className="font-mono text-ink">{job.package}</strong> · Location: {job.location} · Deadline: {job.deadline}
              </p>

              <div className="flex items-center gap-6 pt-1 font-mono text-[11px] text-ink-soft">
                <span>Submissions: <strong className="text-ink">{job.applicants}</strong></span>
                <span>AI Qualified (&gt;85%): <strong className="text-ochre-deep font-bold">{job.shortlisted}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button variant="secondary" size="sm">
                Edit JNF
              </Button>
              <Button variant="primary" size="sm">
                View Qualified Pool →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}

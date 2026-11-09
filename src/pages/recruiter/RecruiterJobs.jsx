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
          <div
            key={job.id}
            className="py-4 sm:py-5 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-fg/5 transition-colors"
          >
            <div className="space-y-1.5 min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="font-display font-medium text-lg sm:text-xl text-fg">
                  {job.title}
                </h3>
                <Stamp tone="ochre">
                  {job.status}
                </Stamp>
              </div>

              <p className="font-sans text-xs text-fg-soft leading-normal">
                Package: <strong className="font-mono text-fg">{job.package}</strong> · Location: {job.location} · Deadline: {job.deadline}
              </p>

              <div className="flex items-center gap-4 sm:gap-6 pt-1 font-mono text-[10.5px] sm:text-[11px] text-fg-soft flex-wrap">
                <span>Submissions: <strong className="text-fg">{job.applicants}</strong></span>
                <span>AI Qualified (&gt;85%): <strong className="text-accent-deep dark:text-accent font-bold">{job.shortlisted}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <Button variant="secondary" size="sm" className="flex-1 sm:flex-initial">
                Edit JNF
              </Button>
              <Button variant="primary" size="sm" className="flex-1 sm:flex-initial">
                View Qualified Pool →
              </Button>
            </div>
          </div>
        ))}
      </div>
    </PageTransition>
  );
}

export default RecruiterJobs;

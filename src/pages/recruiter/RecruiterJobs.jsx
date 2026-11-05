import React from 'react';
import { Briefcase, Users, Calendar, ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
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
      status: 'Screening',
      deadline: 'Nov 12, 2026',
    },
  ];

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Active Job Notification Forms (JNFs)
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Open hiring profiles deployed across BPUT affiliated engineering colleges.
        </p>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <Card key={job.id} className="p-6 hover:border-line/80 transition-all">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <h3 className="font-display font-semibold text-xl text-ink">
                    {job.title}
                  </h3>
                  <Badge tone="jade" size="sm">
                    {job.status}
                  </Badge>
                </div>

                <p className="text-xs text-ink-soft">
                  Offered Package: <strong className="text-ink">{job.package}</strong> · Location: {job.location} · Deadline: {job.deadline}
                </p>

                <div className="flex items-center gap-6 mt-3 text-xs text-ink-soft">
                  <span>
                    Total Submissions: <strong className="text-ink">{job.applicants}</strong>
                  </span>
                  <span>
                    AI Qualified Pool (&gt;85%): <strong className="text-ochre-deep font-semibold">{job.shortlisted}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Button variant="secondary" size="sm">
                  Edit JNF
                </Button>
                <Button variant="primary" size="sm">
                  View Qualified Candidates
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageTransition>
  );
}


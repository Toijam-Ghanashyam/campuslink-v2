import React from 'react';
import { Building2, Award, Users, TrendingUp } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminRecruiters() {
  const { analytics } = useStore();
  const partners = analytics.recruiterPartners || [];

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Corporate Recruiter Partners
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Historical hiring metrics, corporate engagement ratings, and compensation trends across authorized companies.
        </p>
      </div>

      <Card className="p-0 overflow-hidden border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bone/60 text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
                <th className="py-3.5 px-5">Recruiter Partner</th>
                <th className="py-3.5 px-5">Drives Hosted</th>
                <th className="py-3.5 px-5">BPUT Students Hired</th>
                <th className="py-3.5 px-5">Average Package</th>
                <th className="py-3.5 px-5">Campus Engagement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-bone/40 transition-colors">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-bone border border-line flex items-center justify-center text-ink font-semibold text-xs">
                        {partner.company.charAt(0)}
                      </div>
                      <span className="font-semibold text-ink">{partner.company}</span>
                    </div>
                  </td>

                  <td className="py-4 px-5 font-mono text-ink">
                    {partner.drives} drives
                  </td>

                  <td className="py-4 px-5">
                    <span className="font-display font-bold text-base text-ink">
                      {partner.hired}
                    </span>
                    <span className="text-xs text-ink-soft font-normal ml-1">offers accepted</span>
                  </td>

                  <td className="py-4 px-5 font-semibold text-ink">
                    {partner.avgCtc}
                  </td>

                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3 max-w-[140px]">
                      <div className="h-2 flex-1 bg-bone rounded-full overflow-hidden border border-line">
                        <div
                          className="h-full bg-ochre rounded-full"
                          style={{ width: `${partner.engagement}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-ink">
                        {partner.engagement}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </PageTransition>
  );
}


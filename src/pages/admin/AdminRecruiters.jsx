import React from 'react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminRecruiters() {
  const { analytics } = useStore();
  const partners = analytics.recruiterPartners || [];

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="03 · CORPORATE HIRING PARTNERS"
        title="Recruiter Engagement Register."
        lede="Historical recruitment conversion metrics, average compensation packages, and university engagement ratings across authorized companies."
      />

      <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-y border-line no-scrollbar">
        <table className="w-full min-w-[620px] text-left text-sm border-collapse font-sans">
          <thead>
            <tr className="border-b border-line bg-bone/60 font-mono text-[10.5px] uppercase tracking-wider text-ink-soft">
              <th className="py-3 px-4">Corporate Recruiter</th>
              <th className="py-3 px-4">Drives Hosted</th>
              <th className="py-3 px-4">BPUT Hires</th>
              <th className="py-3 px-4">Average Package</th>
              <th className="py-3 px-4">Engagement Index</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {partners.map((partner) => (
              <tr key={partner.id} className="hover:bg-bone/40 transition-colors text-xs">
                <td className="py-3.5 px-4 font-semibold text-ink text-sm">
                  {partner.company}
                </td>

                <td className="py-3.5 px-4 font-mono text-ink">
                  {partner.drives} drives
                </td>

                <td className="py-3.5 px-4">
                  <span className="font-display font-bold text-base text-ink">
                    {partner.hired}
                  </span>
                  <span className="font-mono text-[11px] text-ink-soft ml-1">offers</span>
                </td>

                <td className="py-3.5 px-4 font-mono font-bold text-ink">
                  {partner.avgCtc}
                </td>

                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2 max-w-[130px] font-mono text-xs">
                    <div className="h-1.5 flex-1 bg-line rounded-full overflow-hidden">
                      <div
                        className="h-full bg-ochre rounded-full"
                        style={{ width: `${partner.engagement}%` }}
                      />
                    </div>
                    <span className="font-bold text-ink">
                      {partner.engagement}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}

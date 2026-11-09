import React from 'react';
import { Send } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Masthead } from '../../components/ui/Masthead';
import { StatStrip } from '../../components/ui/StatStrip';
import { Stamp } from '../../components/ui/Stamp';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminOffers() {
  const { offers, sendOfferReminder } = useStore();
  const { toast } = useToast();

  const handleSendReminder = (offer) => {
    sendOfferReminder(offer.id);
    toast(`Compliance reminder dispatched to ${offer.studentName}!`, 'jade');
  };

  const acceptedCount = offers.filter((o) => o.status === 'Accepted').length;
  const offeredCount = offers.filter((o) => o.status === 'Offered').length;
  const deferredCount = offers.filter((o) => o.status === 'Deferred').length;
  const withdrawnCount = offers.filter((o) => o.status === 'Withdrawn').length;

  return (
    <PageTransition className="space-y-6">
      <Masthead
        context="06 · OFFERS &amp; JOINING VERIFICATION"
        title="Offers &amp; Documentation Compliance."
        lede="Post-selection lifecycle tracking: formal offer letters, CTC validation, joining verification, and PPO conversions."
      />

      {/* Ruled StatStrip */}
      <StatStrip
        items={[
          { label: 'TOTAL OFFERS', value: offers.length, hint: 'Across all partner MNCs' },
          { label: 'ACCEPTED OFFERS', value: acceptedCount, hint: 'Joining date confirmed' },
          { label: 'PENDING DECISION', value: offeredCount, hint: 'Awaiting student sign-off' },
          { label: 'DEFERRED / WITHDRAWN', value: deferredCount + withdrawnCount, hint: 'Higher studies or opt-out' },
        ]}
      />

      {/* Ruled Offers Register */}
      <div className="w-full overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 border-y border-line no-scrollbar">
        <table className="w-full min-w-[720px] text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-line bg-surface-subtle/60 font-mono text-[10.5px] uppercase tracking-wider text-fg-soft">
              <th className="py-3 px-4">Candidate &amp; Roll No.</th>
              <th className="py-3 px-4">Recruiter Partner</th>
              <th className="py-3 px-4">Verified CTC</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Doc Verification</th>
              <th className="py-3 px-4">Joining Date</th>
              <th className="py-3 px-4 text-right">Audit Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {offers.map((offer) => {
              const verifiedDocs = offer.documents.filter((d) => d.status === 'verified').length;
              const totalDocs = offer.documents.length;
              const docPercentage = Math.round((verifiedDocs / totalDocs) * 100);

              return (
                <tr key={offer.id} className="hover:bg-surface-subtle/40 transition-colors font-sans text-xs">
                  <td className="py-3.5 px-4">
                    <p className="font-display font-medium text-base text-fg">{offer.studentName}</p>
                    <p className="font-mono text-fg-soft text-[11px]">{offer.rollNo} · {offer.branch}</p>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-fg">
                    {offer.company}
                  </td>

                  <td className="py-3.5 px-4 font-mono font-bold text-fg">
                    {offer.ctc}
                  </td>

                  <td className="py-3.5 px-4">
                    <Stamp
                      tone={
                        offer.status === 'Accepted'
                          ? 'jade'
                          : offer.status === 'Withdrawn'
                          ? 'brick'
                          : 'ochre'
                      }
                    >
                      {offer.status}
                    </Stamp>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="space-y-1 max-w-[120px] font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="font-semibold text-fg">{verifiedDocs}/{totalDocs} verified</span>
                        <span className="text-fg-soft">{docPercentage}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-line rounded-full overflow-hidden">
                        <div
                          className="h-full bg-jade rounded-full"
                          style={{ width: `${docPercentage}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-fg-soft text-[11px]">
                    {offer.joiningDate}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono">
                    {offer.reminderSent ? (
                      <span className="text-jade font-semibold text-xs">
                        Reminder Sent ✓
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={Send}
                        onClick={() => handleSendReminder(offer)}
                      >
                        Send Reminder
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageTransition>
  );
}

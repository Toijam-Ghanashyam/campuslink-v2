import React from 'react';
import { Award, CheckCircle2, Clock, Mail, Send, AlertCircle } from 'lucide-react';
import { useStore } from '../../lib/store';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import { PageTransition } from '../../components/ui/PageTransition';

export function AdminOffers() {
  const { offers, sendOfferReminder } = useStore();
  const { toast } = useToast();

  const handleSendReminder = (offer) => {
    sendOfferReminder(offer.id);
    toast(`Documentation compliance reminder dispatched to ${offer.studentName}!`, 'jade');
  };

  const acceptedCount = offers.filter((o) => o.status === 'Accepted').length;
  const offeredCount = offers.filter((o) => o.status === 'Offered').length;
  const deferredCount = offers.filter((o) => o.status === 'Deferred').length;
  const withdrawnCount = offers.filter((o) => o.status === 'Withdrawn').length;

  return (
    <PageTransition className="space-y-6">
      <div>
        <h1 className="font-display font-semibold text-3xl text-ink tracking-tight">
          Offers, Documentation & Joining Compliance
        </h1>
        <p className="text-sm text-ink-soft mt-1">
          Post-selection lifecycle tracking (PS Deliverable 7): offer letters, CTC validation, joining verification, and PPO conversions.
        </p>
      </div>

      {/* 4 Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
            Total Offers
          </span>
          <p className="font-display font-bold text-2xl text-ink mt-1">
            {offers.length}
          </p>
        </Card>
        <Card className="p-4 text-center bg-jade-tint/20 border-jade/30">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-jade">
            Accepted
          </span>
          <p className="font-display font-bold text-2xl text-jade mt-1">
            {acceptedCount}
          </p>
        </Card>
        <Card className="p-4 text-center bg-ochre-tint/20 border-ochre/30">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ochre-deep">
            Pending Decision
          </span>
          <p className="font-display font-bold text-2xl text-ochre-deep mt-1">
            {offeredCount}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
            Deferred / Withdrawn
          </span>
          <p className="font-display font-bold text-2xl text-ink mt-1">
            {deferredCount + withdrawnCount}
          </p>
        </Card>
      </div>

      {/* Offers Table */}
      <Card className="p-0 overflow-hidden border-line">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-line bg-bone/60 text-[11px] uppercase tracking-wider font-semibold text-ink-soft">
                <th className="py-3.5 px-5">Candidate</th>
                <th className="py-3.5 px-5">Recruiter Partner</th>
                <th className="py-3.5 px-5">Verified CTC</th>
                <th className="py-3.5 px-5">Offer Status</th>
                <th className="py-3.5 px-5">Document Verification</th>
                <th className="py-3.5 px-5">Joining Date</th>
                <th className="py-3.5 px-5 text-right">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {offers.map((offer) => {
                const verifiedDocs = offer.documents.filter((d) => d.status === 'verified').length;
                const totalDocs = offer.documents.length;
                const docPercentage = Math.round((verifiedDocs / totalDocs) * 100);

                return (
                  <tr key={offer.id} className="hover:bg-bone/40 transition-colors">
                    <td className="py-4 px-5">
                      <p className="font-semibold text-ink">{offer.studentName}</p>
                      <p className="text-xs text-ink-soft font-mono">{offer.rollNo} · {offer.branch}</p>
                    </td>

                    <td className="py-4 px-5 font-semibold text-ink">
                      {offer.company}
                    </td>

                    <td className="py-4 px-5 font-display font-bold text-ink">
                      {offer.ctc}
                    </td>

                    <td className="py-4 px-5">
                      <Badge
                        tone={
                          offer.status === 'Accepted'
                            ? 'jade'
                            : offer.status === 'Withdrawn'
                            ? 'brick'
                            : 'ochre'
                        }
                        size="sm"
                      >
                        {offer.status}
                      </Badge>
                    </td>

                    <td className="py-4 px-5">
                      <div className="space-y-1 max-w-[130px]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-ink">{verifiedDocs}/{totalDocs} verified</span>
                          <span className="font-mono text-ink-soft">{docPercentage}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-bone rounded-full overflow-hidden border border-line">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              docPercentage === 100 ? 'bg-jade' : 'bg-ochre'
                            )}
                            style={{ width: `${docPercentage}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-5 text-xs text-ink-soft font-mono">
                      {offer.joiningDate}
                    </td>

                    <td className="py-4 px-5 text-right">
                      {offer.reminderSent ? (
                        <span className="text-xs text-jade font-semibold">
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
      </Card>
    </PageTransition>
  );
}


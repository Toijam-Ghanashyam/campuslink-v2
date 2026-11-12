'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  ChevronRight,
  Briefcase,
  Sparkles,
} from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/button';
import { Stamp } from '@/components/ui/Stamp';
import { Tag } from '@/components/ui/Tag';
import { MarginNote } from '@/components/ui/MarginNote';
import { Skeleton } from '@/components/ui/Skeleton';
import { Callout } from '@/components/ui/Callout';
import { fetchCompanyResearch } from '@/api/companyResearch';

/**
 * @param {Object} props
 * @param {boolean} [props.isOpen]
 * @param {() => void} [props.onClose]
 * @param {any} [props.drive]
 * @param {any} [props.currentStudent]
 * @param {any} [props.application]
 * @param {((target?: any) => void) | null | undefined} [props.onApply]
 */
export function CompanyResearchDrawer({
  isOpen = false,
  onClose = () => {},
  drive = null,
  currentStudent = null,
  application = null,
  onApply = undefined,
}) {
  const [loading, setLoading] = useState(true);
  const [dossier, setDossier] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const companyName = drive?.company_name || 'Target Company';
  const roleTitle = drive?.role_title || 'Software Engineer';
  const requiredSkills = drive?.required_skills || [];
  const studentSkills = currentStudent?.skills || [];

  const loadDossier = async (force = false) => {
    if (!companyName) return;
    if (force) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await fetchCompanyResearch(companyName, roleTitle, {
        forceRefresh: force,
        studentSkills,
        requiredSkills,
      });
      setDossier(data);
    } catch (err) {
      console.error('Failed to load company research dossier:', err);
      setError(err.message || 'Could not fetch intelligence data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen && drive) {
      loadDossier(false);
    }
  }, [isOpen, drive?.id, drive?.company_name]);

  const alignment = dossier?.studentAlignment || {
    matchedSkills: [],
    missingSkills: [],
    overlapScore: 50,
  };

  const isApplied = Boolean(application);

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      width="w-full max-w-full sm:max-w-xl"
      title={
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-700/50 text-sm">
            <Globe className="h-4 w-4" />
          </span>
          <span className="text-base font-bold text-fg">
            {companyName} · Intelligence Dossier
          </span>
        </div>
      }
      subtitle={
        <span className="flex items-center gap-1.5 text-xs text-fg-soft font-mono">
          <span className="text-indigo-400 font-semibold">{roleTitle}</span>
          <span>•</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Web Grounding via Tavily AI
          </span>
        </span>
      }
      footer={
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDossier(true)}
            loading={refreshing}
            disabled={loading || refreshing}
            className="border-line hover:bg-slate-800 text-fg-soft hover:text-fg text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh Intel
          </Button>

          <div className="flex items-center gap-2">
            {isApplied ? (
              <Stamp variant="jade" label={`Applied ✓ (${application.stage || 'ACTIVE'})`} />
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  if (onApply) onApply(drive);
                }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4"
              >
                Apply to Drive (AI Match) &rarr;
              </Button>
            )}
          </div>
        </>
      }
    >
      {/* Loading Telemetry State */}
      {loading ? (
        <div className="space-y-6 py-4">
          <Skeleton
            statusLine="QUERYING TAVILY SEARCH INDEX · EXTRACTING ENGINEERING & INTERVIEW SIGNALS..."
            lines={3}
            className="h-5"
          />

          <div className="space-y-3 pt-4 border-t border-line/60">
            <Skeleton lines={2} className="h-4 w-3/4" />
            <Skeleton lines={4} className="h-12 w-full" />
          </div>

          <div className="space-y-3 pt-4 border-t border-line/60">
            <Skeleton lines={3} className="h-16 w-full" />
          </div>
        </div>
      ) : error ? (
        <Callout
          variant="brick"
          icon={<AlertCircle className="h-5 w-5 text-rose-400" />}
          title="Intelligence Retrieval Error"
        >
          {error}
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => loadDossier(true)}>
              Retry Connection
            </Button>
          </div>
        </Callout>
      ) : dossier ? (
        <div className="space-y-7">
          {/* Section 01 · Executive AI Synthesis */}
          <section className="space-y-2.5">
            <MarginNote label="01 · TAVILY AI EXECUTIVE BRIEF" />
            <div className="rounded-xl border border-line bg-surface/70 p-4 shadow-xs space-y-2.5">
              <p className="text-xs text-fg leading-relaxed">
                {dossier.aiSummary}
              </p>

              {/* Verified Tech Stack Chips */}
              {dossier.techStack && dossier.techStack.length > 0 && (
                <div className="pt-2 border-t border-line/60 space-y-1.5">
                  <span className="text-[10px] font-mono uppercase font-bold tracking-wider text-fg-soft block">
                    Verified Core Tech Stack:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dossier.techStack.map((tech) => (
                      <Tag key={tech} variant="neutral" className="bg-slate-950/70 border-line text-slate-200">
                        {tech}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 02 · Your Personalized Skill Alignment */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <MarginNote label="02 · YOUR SKILL ALIGNMENT" />
              <span className="font-mono text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                {alignment.overlapScore}% Match
              </span>
            </div>

            <div className="rounded-xl border border-line bg-surface/70 p-4 space-y-3.5">
              {/* Matched Skills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3" />
                  Your Demonstrated Match:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {alignment.matchedSkills.length > 0 ? (
                    alignment.matchedSkills.map((sk) => (
                      <Tag key={sk} variant="jade" icon="✓">
                        {sk}
                      </Tag>
                    ))
                  ) : (
                    <span className="text-xs text-fg-soft italic">
                      No direct matches detected in profile.
                    </span>
                  )}
                </div>
              </div>

              {/* Missing Skills */}
              {alignment.missingSkills.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-line/60">
                  <span className="text-[10px] font-mono uppercase font-bold text-indigo-300 flex items-center gap-1.5">
                    <Sparkles className="h-3 w-3" />
                    Recommended Prep Gap:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {alignment.missingSkills.map((sk) => (
                      <Tag key={sk} variant="accent" icon="+">
                        {sk}
                      </Tag>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Section 03 · Campus Recruitment & Interview Pattern */}
          <section className="space-y-3">
            <MarginNote label="03 · INTERVIEW EVALUATION PATTERN" />

            <div className="space-y-3">
              {(dossier.interviewRounds || []).map((round, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-line bg-surface/70 p-3.5 space-y-2 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 border-b border-line/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold font-mono">
                        {round.roundNumber || idx + 1}
                      </span>
                      <h4 className="text-xs font-bold text-fg">
                        {round.roundName}
                      </h4>
                    </div>
                    {round.duration && (
                      <span className="text-[10px] font-mono text-fg-soft flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {round.duration}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-fg-soft leading-relaxed">
                    {round.focus}
                  </p>

                  {/* Topic Callouts */}
                  {round.topics && round.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {round.topics.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded bg-slate-900 border border-line text-[10px] font-mono text-indigo-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Pro Tip */}
                  {round.tips && (
                    <div className="text-[11px] text-amber-300/90 bg-amber-950/20 border border-amber-800/30 p-2 rounded leading-relaxed">
                      💡 <strong className="text-amber-200">Candidate Tip:</strong> {round.tips}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Section 04 · Verified Web Sources & Citations */}
          <section className="space-y-3">
            <MarginNote label="04 · VERIFIED TAVILY WEB CITATIONS" />

            <div className="space-y-2">
              {(dossier.sources || []).slice(0, 5).map((src, sIdx) => (
                <a
                  key={sIdx}
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block rounded-lg border border-line bg-surface/50 p-2.5 hover:border-indigo-600/50 hover:bg-slate-900 transition-all text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-fg group-hover:text-indigo-300 transition-colors line-clamp-1">
                      {src.title}
                    </span>
                    <ExternalLink className="h-3 w-3 text-fg-soft group-hover:text-indigo-400 shrink-0" />
                  </div>
                  {src.snippet && (
                    <p className="text-[11px] text-fg-soft line-clamp-2 mt-1 leading-normal">
                      {src.snippet}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5 text-[10px] font-mono text-indigo-400/80">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/60" />
                    {src.domain}
                  </div>
                </a>
              ))}
            </div>
          </section>
        </div>
      ) : null}
    </Drawer>
  );
}

export default CompanyResearchDrawer;

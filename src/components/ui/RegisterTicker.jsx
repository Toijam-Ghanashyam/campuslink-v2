import React from 'react';

const ITEMS = [
  { text: 'VERIFIED · ROHAN SENAPATI · CSE · 14:02', tone: 'jade' },
  { text: 'CLASH RESOLVED · COGNIZANT MOVED TO LAB 2 · 14:00', tone: 'jade' },
  { text: 'SHORTLISTED · MICROSOFT INDIA · 48 CANDIDATES', tone: 'accent' },
  { text: 'OFFER ACCEPTED · TCS DIGITAL · 7.0 LPA', tone: 'jade' },
  { text: 'SLOT BOOKED · INTERVIEW · 05 NOV · 10:45', tone: 'accent' },
  { text: 'AT-RISK FLAGGED · 14 STUDENTS · MENTORS ASSIGNED', tone: 'brick' },
  { text: 'DRIVE AUTHORIZED · INFOSYS · 11 NOV', tone: 'accent' },
];

export function RegisterTicker() {
  const dotColor = (tone) => {
    if (tone === 'jade') return 'bg-jade';
    if (tone === 'brick') return 'bg-brick';
    return 'bg-accent';
  };

  return (
    <div className="ticker py-2 bg-surface/60 backdrop-blur-sm select-none">
      <div className="max-w-[1440px] mx-auto px-4 flex items-center">
        {/* Pinned Label */}
        <div className="shrink-0 flex items-center gap-2 pr-6 border-r border-line z-10 bg-surface/80">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] font-bold text-fg">
            LIVE REGISTER · SIMULATED
          </span>
        </div>

        {/* Scrolling Track */}
        <div className="ticker overflow-hidden border-none flex-1 ml-6">
          <div className="ticker-track flex items-center">
            {/* List rendered twice for seamless loop */}
            {[...ITEMS, ...ITEMS].map((item, idx) => (
              <div key={idx} className="flex items-center gap-2.5 shrink-0 font-mono text-[11.5px] uppercase tracking-wider text-fg-soft">
                <span className={`w-1.5 h-1.5 rounded-full ${dotColor(item.tone)} shrink-0`} />
                <span>{item.text}</span>
                <span className="text-line mx-2">/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


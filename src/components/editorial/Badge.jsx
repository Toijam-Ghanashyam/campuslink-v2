'use client';

import React from 'react';
import { Stamp } from './Stamp';
import { Tag } from './Tag';
import { cn } from '../../lib/utils';

export function Badge({
  tone = 'ink',
  children,
  className,
  size = 'md',
  dot = false,
}) {
  const text = typeof children === 'string' ? children.trim() : '';
  const lower = text.toLowerCase();

  // Decision words render as authentic ink Stamps!
  if (
    lower.includes('verified') ||
    lower.includes('approved') ||
    lower.includes('resolved') ||
    lower.includes('accepted')
  ) {
    return <Stamp tone="jade" className={className}>{text}</Stamp>;
  }

  if (
    lower.includes('rejected') ||
    lower.includes('conflict') ||
    lower.includes('clash') ||
    lower.includes('withdrawn')
  ) {
    return <Stamp tone="brick" className={className}>{text}</Stamp>;
  }

  if (
    lower.includes('shortlisted') ||
    lower.includes('offered') ||
    lower.includes('active hiring')
  ) {
    return <Stamp tone="ochre" className={className}>{text}</Stamp>;
  }

  if (lower.includes('locked')) {
    return <Stamp tone="ink" className={className}>{text}</Stamp>;
  }

  // All other informational tags render as plain mono Tag with dot
  const dotColors = {
    jade: 'bg-jade',
    brick: 'bg-brick',
    ochre: 'bg-accent',
    accent: 'bg-accent',
    ink: 'bg-fg-soft',
  };

  return (
    <Tag dot={dot} dotColor={dotColors[tone] || 'bg-accent'} className={className}>
      {children}
    </Tag>
  );
}

export default Badge;

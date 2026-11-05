import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount) {
  if (typeof amount !== 'number') return amount;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatLPA(lpa) {
  if (typeof lpa !== 'number') return lpa;
  return `${lpa.toFixed(1)} LPA`;
}


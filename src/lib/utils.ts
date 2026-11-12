import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string) {
  if (typeof amount !== 'number') return amount;
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatLPA(lpa: number | string) {
  if (typeof lpa !== 'number') return lpa;
  return `${lpa.toFixed(1)} LPA`;
}

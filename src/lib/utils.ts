import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, compact = false): string {
  if (compact && amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (compact && amount >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function riskScoreLabel(score: number | null): string {
  if (score === null) return "Not assessed";
  if (score >= 70) return "High risk";
  if (score >= 40) return "Medium risk";
  return "Low risk";
}

export function riskScoreColor(score: number | null): string {
  if (score === null) return "text-slate-400";
  if (score >= 70) return "text-red-600";
  if (score >= 40) return "text-yellow-600";
  return "text-green-600";
}

export function tierLabel(tier: string): string {
  const map: Record<string, string> = {
    strategic: "Strategic",
    preferred: "Preferred",
    approved: "Approved",
    unapproved: "Unapproved",
  };
  return map[tier] ?? tier;
}
import Link from "next/link";
import { ExternalLink, AlertTriangle, TrendingUp } from "lucide-react";
import type { Vendor } from "@/types";

interface VendorCardProps {
  vendor: Vendor;
}

const tierColors: Record<string, string> = {
  strategic: "bg-purple-100 text-purple-700 border-purple-200",
  preferred: "bg-blue-100 text-blue-700 border-blue-200",
  approved: "bg-green-100 text-green-700 border-green-200",
  unapproved: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function VendorCard({ vendor }: VendorCardProps) {
  const riskColor = !vendor.risk_score
    ? "text-slate-400"
    : vendor.risk_score >= 70
    ? "text-red-600"
    : vendor.risk_score >= 40
    ? "text-yellow-600"
    : "text-green-600";

  const riskBarColor = !vendor.risk_score
    ? "bg-slate-200"
    : vendor.risk_score >= 70
    ? "bg-red-500"
    : vendor.risk_score >= 40
    ? "bg-yellow-500"
    : "bg-green-500";

  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/vendors/${vendor.id}`} className="font-semibold text-slate-900 hover:text-brand-600 transition-colors block truncate">
            {vendor.name}
          </Link>
          {vendor.category && <p className="text-xs text-slate-400 mt-0.5">{vendor.category}</p>}
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge border ${tierColors[vendor.tier] ?? ""}`}>{vendor.tier}</span>
          {vendor.website && (
            <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-brand-600">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500 flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> YTD Spend</span>
          <span className="font-semibold text-slate-900">${Number(vendor.spend_ytd_usd).toLocaleString()}</span>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-500 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Risk Score
            </span>
            <span className={`font-semibold ${riskColor}`}>
              {vendor.risk_score !== null ? `${vendor.risk_score}/100` : "N/A"}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${riskBarColor}`}
              style={{ width: `${vendor.risk_score ?? 0}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
        <Link href={`/vendors/${vendor.id}`} className="btn-secondary text-xs px-3 py-1.5 flex-1 justify-center">
          View details
        </Link>
        <Link href={`/vendors/${vendor.id}?tab=assess`} className="btn-secondary text-xs px-3 py-1.5">
          Assess
        </Link>
      </div>
    </div>
  );
}
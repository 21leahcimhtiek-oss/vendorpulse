"use client";
import { useState } from "react";
import { AlertTriangle, CheckCircle2, Eye, Loader2 } from "lucide-react";
import type { RiskFlag as RiskFlagType } from "@/types";
import { format } from "date-fns";

interface RiskFlagProps {
  flag: RiskFlagType & { vendor?: { name: string } };
  onUpdate?: (updatedFlag: RiskFlagType) => void;
}

const severityConfig: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  critical: { bg: "bg-red-50", border: "border-red-200", text: "text-red-700", icon: "text-red-500" },
  high: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", icon: "text-orange-500" },
  medium: { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-700", icon: "text-yellow-500" },
  low: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", icon: "text-blue-500" },
};

export default function RiskFlag({ flag, onUpdate }: RiskFlagProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const config = severityConfig[flag.severity] ?? severityConfig.low;

  async function updateStatus(status: "acknowledged" | "resolved") {
    setLoading(status);
    try {
      const res = await fetch(`/api/risk/${flag.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (res.ok) onUpdate?.(json.data);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className={`rounded-xl border p-4 ${config.bg} ${config.border}`}>
      <div className="flex items-start gap-3">
        <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.icon}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`font-semibold text-xs uppercase tracking-wide ${config.text}`}>{flag.severity}</span>
            <span className={`text-xs ${config.text} opacity-60`}>·</span>
            <span className={`text-xs capitalize ${config.text} opacity-70`}>{flag.type}</span>
            {flag.ai_detected && (
              <span className={`text-xs px-1.5 py-0.5 rounded bg-white/60 ${config.text} border ${config.border}`}>
                🤖 AI
              </span>
            )}
            <span className={`ml-auto text-xs capitalize px-2 py-0.5 rounded-full bg-white/50 ${config.text}`}>
              {flag.status}
            </span>
          </div>
          {flag.vendor && (
            <p className={`text-sm font-medium ${config.text} mb-1`}>{flag.vendor.name}</p>
          )}
          <p className={`text-sm ${config.text} opacity-80 leading-relaxed`}>{flag.description}</p>
          <p className={`text-xs mt-2 ${config.text} opacity-50`}>
            {format(new Date(flag.created_at), "MMM d, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>
      {flag.status !== "resolved" && (
        <div className="flex gap-2 mt-3">
          {flag.status === "open" && (
            <button
              onClick={() => updateStatus("acknowledged")}
              disabled={loading !== null}
              className={`btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 ${config.text}`}
            >
              {loading === "acknowledged" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3" />}
              Acknowledge
            </button>
          )}
          <button
            onClick={() => updateStatus("resolved")}
            disabled={loading !== null}
            className={`btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 ${config.text}`}
          >
            {loading === "resolved" ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
            Resolve
          </button>
        </div>
      )}
    </div>
  );
}
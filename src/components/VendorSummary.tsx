"use client";
import { useState } from "react";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

interface VendorSummaryProps {
  vendorId: string;
  initialSummary?: string | null;
}

export default function VendorSummary({ vendorId, initialSummary }: VendorSummaryProps) {
  const [summary, setSummary] = useState(initialSummary);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAssessment() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/vendors/${vendorId}/assess`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Assessment failed");
      setSummary(json.data.summary);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 border-brand-100 bg-gradient-to-br from-brand-50/50 to-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h3 className="font-semibold text-slate-900">AI Vendor Summary</h3>
        </div>
        <button
          onClick={runAssessment}
          disabled={loading}
          className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          {summary ? "Refresh" : "Generate"}
        </button>
      </div>
      {error && <div className="text-xs text-red-600 mb-3 bg-red-50 px-3 py-2 rounded-lg">{error}</div>}
      {loading ? (
        <div className="space-y-2">
          <div className="h-4 bg-brand-100 rounded animate-pulse" />
          <div className="h-4 bg-brand-100 rounded animate-pulse w-4/5" />
          <div className="h-4 bg-brand-100 rounded animate-pulse w-3/5" />
        </div>
      ) : summary ? (
        <p className="text-sm text-slate-700 leading-relaxed">{summary}</p>
      ) : (
        <div className="text-center py-4">
          <Sparkles className="h-8 w-8 text-brand-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500">Click Generate to create an AI-powered summary of this vendor relationship.</p>
        </div>
      )}
    </div>
  );
}
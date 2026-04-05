"use client";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface ScorecardFormProps {
  vendorId: string;
  vendorName: string;
  onSuccess?: () => void;
}

const dimensions = [
  { key: "quality_score", label: "Quality", description: "Product/service quality and consistency" },
  { key: "delivery_score", label: "Delivery", description: "On-time delivery and reliability" },
  { key: "communication_score", label: "Communication", description: "Responsiveness and clarity" },
  { key: "value_score", label: "Value", description: "Price vs. quality ratio" },
] as const;

export default function ScorecardForm({ vendorId, vendorName, onSuccess }: ScorecardFormProps) {
  const [scores, setScores] = useState<Record<string, number>>({
    quality_score: 7, delivery_score: 7, communication_score: 7, value_score: 7,
  });
  const [period, setPeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const overall = Object.values(scores).reduce((s, v) => s + v, 0) / 4;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scorecards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vendor_id: vendorId, period, notes, ...scores }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit scorecard");
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const scoreColor = (v: number) => v >= 8 ? "text-green-600" : v >= 6 ? "text-yellow-600" : "text-red-600";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <p className="text-sm text-slate-500">Scoring <span className="font-medium text-slate-700">{vendorName}</span></p>
      </div>
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
      <div>
        <label className="label">Period</label>
        <input className="input" required value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="e.g. 2024-Q2" />
      </div>
      {dimensions.map(({ key, label, description }) => (
        <div key={key}>
          <div className="flex items-center justify-between mb-1">
            <div>
              <label className="label mb-0">{label}</label>
              <p className="text-xs text-slate-400">{description}</p>
            </div>
            <span className={`text-lg font-bold ${scoreColor(scores[key])}`}>{scores[key]}</span>
          </div>
          <input
            type="range" min={1} max={10} step={1}
            value={scores[key]}
            onChange={(e) => setScores((p) => ({ ...p, [key]: parseInt(e.target.value) }))}
            className="w-full accent-brand-600"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-0.5">
            <span>1</span><span>5</span><span>10</span>
          </div>
        </div>
      ))}
      <div className="bg-brand-50 rounded-xl p-4 text-center">
        <div className="text-2xl font-bold text-brand-600">{overall.toFixed(1)}</div>
        <div className="text-xs text-slate-500">Overall Score</div>
      </div>
      <div>
        <label className="label">Notes (optional)</label>
        <textarea className="input h-24 resize-none" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional context..." />
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit scorecard
      </button>
    </form>
  );
}
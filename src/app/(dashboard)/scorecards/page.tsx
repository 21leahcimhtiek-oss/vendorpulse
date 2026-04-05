import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export const metadata = { title: "Scorecards" };

export default async function ScorecardsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const member = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  const { data: scorecards } = await supabase
    .from("vendor_scorecards")
    .select("*, vendors(name)")
    .eq("org_id", member.data.org_id)
    .order("created_at", { ascending: false });

  const { data: vendors } = await supabase
    .from("vendors")
    .select("id, name")
    .eq("org_id", member.data.org_id)
    .eq("status", "active")
    .order("name");

  const scoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendor Scorecards</h1>
          <p className="text-slate-500 text-sm mt-1">{(scorecards ?? []).length} scorecards submitted</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Create Scorecard Form */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <h2 className="font-semibold text-slate-900 mb-4">New Scorecard</h2>
            <form action="/api/scorecards" method="POST" className="space-y-4">
              <div>
                <label className="label">Vendor</label>
                <select name="vendor_id" className="input" required>
                  <option value="">Select vendor...</option>
                  {(vendors ?? []).map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Period (e.g. 2024-Q1)</label>
                <input name="period" className="input" required placeholder="2024-Q2" />
              </div>
              {[
                { name: "quality_score", label: "Quality (1-10)" },
                { name: "delivery_score", label: "Delivery (1-10)" },
                { name: "communication_score", label: "Communication (1-10)" },
                { name: "value_score", label: "Value (1-10)" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="label">{f.label}</label>
                  <input name={f.name} type="number" min={1} max={10} className="input" required />
                </div>
              ))}
              <div>
                <label className="label">Notes</label>
                <textarea name="notes" className="input h-20 resize-none" placeholder="Optional notes..." />
              </div>
              <button type="submit" className="btn-primary w-full justify-center">Submit Scorecard</button>
            </form>
          </div>
        </div>

        {/* Scorecards List */}
        <div className="lg:col-span-2 card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-slate-500 font-medium">Vendor</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Period</th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium">Q</th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium">D</th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium">C</th>
                <th className="text-center px-3 py-3 text-slate-500 font-medium">V</th>
                <th className="text-center px-4 py-3 text-slate-500 font-medium">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(scorecards ?? []).map((s: any) => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-medium text-slate-800">{s.vendors?.name}</td>
                  <td className="px-4 py-3 text-slate-600">{s.period}</td>
                  {[s.quality_score, s.delivery_score, s.communication_score, s.value_score].map((score, i) => (
                    <td key={i} className={`px-3 py-3 text-center font-medium ${scoreColor(score)}`}>{score}</td>
                  ))}
                  <td className={`px-4 py-3 text-center font-bold ${scoreColor(s.overall_score)}`}>
                    {Number(s.overall_score).toFixed(1)}
                  </td>
                </tr>
              ))}
              {(scorecards ?? []).length === 0 && (
                <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400">No scorecards yet. Submit the first one!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
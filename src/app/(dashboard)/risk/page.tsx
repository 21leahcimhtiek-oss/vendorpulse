import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { format } from "date-fns";

export const metadata = { title: "Risk Dashboard" };

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

const severityOrder = ["critical", "high", "medium", "low"];

export default async function RiskPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const member = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  let query = supabase
    .from("risk_flags")
    .select("*, vendors(name, tier)")
    .eq("org_id", member.data.org_id)
    .order("created_at", { ascending: false });

  if (searchParams.severity) query = query.eq("severity", searchParams.severity);
  if (searchParams.status) query = query.eq("status", searchParams.status);
  else query = query.neq("status", "resolved");

  const { data: flags } = await query;

  const bySeverity: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 };
  (flags ?? []).forEach((f) => { bySeverity[f.severity] = (bySeverity[f.severity] ?? 0) + 1; });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Risk Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{(flags ?? []).length} active risk flags</p>
      </div>

      {/* Severity summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {severityOrder.map((s) => (
          <div key={s} className={`card p-4 border ${severityColors[s]}`}>
            <div className="text-3xl font-bold">{bySeverity[s] ?? 0}</div>
            <div className="text-sm font-medium capitalize mt-1">{s}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <a href="/risk" className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${!searchParams.status && !searchParams.severity ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"}`}>
          All open
        </a>
        {["critical", "high", "medium", "low"].map((s) => (
          <a key={s} href={`?severity=${s}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors capitalize ${searchParams.severity === s ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"}`}>
            {s}
          </a>
        ))}
        <a href="?status=acknowledged"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${searchParams.status === "acknowledged" ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"}`}>
          Acknowledged
        </a>
        <a href="?status=resolved"
          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${searchParams.status === "resolved" ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600"}`}>
          Resolved
        </a>
      </div>

      {/* Flags list */}
      <div className="space-y-3">
        {(flags ?? []).map((f: any) => (
          <div key={f.id} className={`card p-5 border ${severityColors[f.severity]}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm capitalize">{f.severity}</span>
                  <span className="text-xs opacity-70">·</span>
                  <span className="text-xs capitalize">{f.type}</span>
                  {f.ai_detected && (
                    <span className="text-xs bg-white/60 border border-current/20 px-1.5 py-0.5 rounded">
                      🤖 AI detected
                    </span>
                  )}
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full bg-white/50 capitalize`}>{f.status}</span>
                </div>
                <p className="text-sm font-medium">{f.vendors?.name}</p>
                <p className="text-sm mt-1 opacity-80">{f.description}</p>
                <p className="text-xs mt-2 opacity-60">{format(new Date(f.created_at), "MMM d, yyyy 'at' h:mm a")}</p>
              </div>
              <div className="flex gap-2">
                {f.status === "open" && (
                  <form action={`/api/risk/${f.id}`} method="PATCH">
                    <input type="hidden" name="status" value="acknowledged" />
                    <button className="btn-secondary text-xs px-3 py-1.5">Acknowledge</button>
                  </form>
                )}
                {f.status !== "resolved" && (
                  <form action={`/api/risk/${f.id}`} method="PATCH">
                    <input type="hidden" name="status" value="resolved" />
                    <button className="btn-secondary text-xs px-3 py-1.5">Resolve</button>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
        {(flags ?? []).length === 0 && (
          <div className="card p-12 text-center text-slate-400">
            <p className="text-lg mb-1">No risk flags found 🎉</p>
            <p className="text-sm">Run AI assessments on your vendors to detect risk factors automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}
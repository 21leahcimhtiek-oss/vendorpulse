import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = { title: "Spend Analytics" };

export default async function SpendPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const member = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  const groupBy = searchParams.groupBy ?? "vendor";

  const { data: records } = await supabase
    .from("spend_records")
    .select("amount_usd, category, department, period_start, vendor_id, vendors(name)")
    .eq("org_id", member.data.org_id)
    .order("period_start", { ascending: false });

  const grouped: Record<string, number> = {};
  (records ?? []).forEach((r: any) => {
    let key = "Unknown";
    if (groupBy === "vendor") key = r.vendors?.name ?? "Unknown";
    else if (groupBy === "category") key = r.category ?? "Uncategorized";
    else if (groupBy === "department") key = r.department ?? "Unassigned";
    else if (groupBy === "period") key = r.period_start?.slice(0, 7) ?? "Unknown";
    grouped[key] = (grouped[key] ?? 0) + Number(r.amount_usd);
  });

  const sorted = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((s, [, v]) => s + v, 0);
  const maxVal = sorted[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Spend Analytics</h1>
          <p className="text-slate-500 text-sm mt-1">Total: ${total.toLocaleString()} across {(records ?? []).length} records</p>
        </div>
        <Link href="/spend/import" className="btn-secondary text-sm">Import CSV</Link>
      </div>

      {/* Group by tabs */}
      <div className="flex gap-2">
        {["vendor", "category", "department", "period"].map((g) => (
          <Link key={g} href={`?groupBy=${g}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${groupBy === g ? "bg-brand-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-brand-400"}`}>
            By {g}
          </Link>
        ))}
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Spend by {groupBy}</h2>
        {sorted.length > 0 ? (
          <div className="space-y-3">
            {sorted.slice(0, 20).map(([label, amount]) => (
              <div key={label} className="flex items-center gap-3">
                <div className="w-36 text-sm text-slate-700 truncate flex-shrink-0">{label}</div>
                <div className="flex-1 h-6 bg-slate-100 rounded-lg overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-lg flex items-center justify-end pr-2"
                    style={{ width: `${(amount / maxVal) * 100}%`, minWidth: "2rem" }}
                  >
                    <span className="text-xs text-white font-medium">${(amount / 1000).toFixed(0)}K</span>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-800 w-24 text-right">${amount.toLocaleString()}</div>
                <div className="text-xs text-slate-400 w-12 text-right">{((amount / total) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No spend data yet. Import records to get started.</p>
        )}
      </div>
    </div>
  );
}
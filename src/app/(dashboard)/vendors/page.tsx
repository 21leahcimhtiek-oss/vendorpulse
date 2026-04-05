import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

export const metadata = { title: "Vendors" };

const tierColors: Record<string, string> = {
  strategic: "bg-purple-100 text-purple-700",
  preferred: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  unapproved: "bg-slate-100 text-slate-600",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-slate-100 text-slate-600",
  under_review: "bg-yellow-100 text-yellow-700",
  blacklisted: "bg-red-100 text-red-700",
};

export default async function VendorsPage({ searchParams }: { searchParams: Record<string, string> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const member = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  let query = supabase
    .from("vendors")
    .select("id, name, category, tier, status, spend_ytd_usd, risk_score, contact_email, updated_at")
    .eq("org_id", member.data.org_id)
    .order("spend_ytd_usd", { ascending: false });

  if (searchParams.tier) query = query.eq("tier", searchParams.tier);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: vendors } = await query;

  const filtered = searchParams.q
    ? (vendors ?? []).filter((v) => v.name.toLowerCase().includes(searchParams.q.toLowerCase()))
    : (vendors ?? []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Vendors</h1>
          <p className="text-slate-500 text-sm mt-1">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""}</p>
        </div>
        <Link href="/vendors/new" className="btn-primary">
          <Plus className="h-4 w-4" /> Add vendor
        </Link>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <form className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input name="q" defaultValue={searchParams.q} className="input flex-1" placeholder="Search vendors..." />
          <button type="submit" className="btn-secondary">Search</button>
        </form>
        <div className="flex gap-2 flex-wrap">
          {["strategic", "preferred", "approved", "unapproved"].map((t) => (
            <Link key={t} href={`?tier=${t}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${searchParams.tier === t ? "bg-brand-600 text-white border-brand-600" : "border-slate-200 text-slate-600 hover:border-brand-400"}`}>
              {t}
            </Link>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-6 py-3 text-slate-500 font-medium">Vendor</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Tier</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Status</th>
              <th className="text-right px-4 py-3 text-slate-500 font-medium">YTD Spend</th>
              <th className="text-left px-4 py-3 text-slate-500 font-medium">Risk Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <Link href={`/vendors/${v.id}`} className="font-medium text-slate-900 hover:text-brand-600">{v.name}</Link>
                  {v.category && <p className="text-xs text-slate-400 mt-0.5">{v.category}</p>}
                </td>
                <td className="px-4 py-4">
                  <span className={`badge ${tierColors[v.tier] ?? "bg-slate-100 text-slate-600"}`}>{v.tier}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`badge ${statusColors[v.status] ?? "bg-slate-100 text-slate-600"}`}>{v.status}</span>
                </td>
                <td className="px-4 py-4 text-right font-medium text-slate-800">
                  ${Number(v.spend_ytd_usd).toLocaleString()}
                </td>
                <td className="px-4 py-4">
                  {v.risk_score !== null ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className={`h-full rounded-full ${v.risk_score >= 70 ? "bg-red-500" : v.risk_score >= 40 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${v.risk_score}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-600 w-6">{v.risk_score}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400">Not assessed</span>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                No vendors found. <Link href="/vendors/new" className="text-brand-600">Add your first vendor →</Link>
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
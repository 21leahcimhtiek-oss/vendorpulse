import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Vendor Details" };

const tierColors: Record<string, string> = {
  strategic: "bg-purple-100 text-purple-700",
  preferred: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-700",
  unapproved: "bg-slate-100 text-slate-600",
};

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700 border-red-200",
  high: "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-blue-100 text-blue-700 border-blue-200",
};

export default async function VendorDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const member = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  const [vendorRes, spendRes, flagsRes, contractsRes, scorecardsRes, contactsRes] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", params.id).eq("org_id", member.data.org_id).single(),
    supabase.from("spend_records").select("*").eq("vendor_id", params.id).order("period_start", { ascending: false }).limit(12),
    supabase.from("risk_flags").select("*").eq("vendor_id", params.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("vendor_contracts").select("*").eq("vendor_id", params.id).order("end_date", { ascending: true }),
    supabase.from("vendor_scorecards").select("*").eq("vendor_id", params.id).order("period", { ascending: false }).limit(8),
    supabase.from("vendor_contacts").select("*").eq("vendor_id", params.id).order("is_primary", { ascending: false }),
  ]);

  if (!vendorRes.data) notFound();
  const v = vendorRes.data;
  const spend = spendRes.data ?? [];
  const flags = flagsRes.data ?? [];
  const contracts = contractsRes.data ?? [];
  const scorecards = scorecardsRes.data ?? [];
  const contacts = contactsRes.data ?? [];

  const totalSpend = spend.reduce((s, r) => s + Number(r.amount_usd), 0);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <Link href="/vendors" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{v.name}</h1>
            <span className={`badge ${tierColors[v.tier] ?? ""}`}>{v.tier}</span>
            <span className={`badge ${v.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{v.status}</span>
          </div>
          {v.website && <a href={v.website} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-600 hover:underline">{v.website}</a>}
        </div>
        <form action={`/api/vendors/${v.id}/assess`} method="POST">
          <button className="btn-secondary text-sm">
            <Sparkles className="h-4 w-4" /> Run AI Assessment
          </button>
        </form>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "YTD Spend", value: `$${Number(v.spend_ytd_usd).toLocaleString()}` },
          { label: "Total Spend Records", value: `$${totalSpend.toLocaleString()}` },
          { label: "Risk Score", value: v.risk_score !== null ? `${v.risk_score}/100` : "—" },
          { label: "Open Flags", value: flags.filter((f) => f.status === "open").length },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xl font-bold text-slate-900">{s.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* AI Summary */}
      {v.ai_summary && (
        <div className="card p-6 border-brand-200 bg-brand-50/30">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <h2 className="font-semibold text-slate-900">AI Summary</h2>
          </div>
          <p className="text-sm text-slate-700 leading-relaxed">{v.ai_summary}</p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Scorecards */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Scorecard History</h2>
            <Link href="/scorecards" className="text-sm text-brand-600 hover:underline">Add scorecard</Link>
          </div>
          {scorecards.length > 0 ? (
            <div className="space-y-3">
              {scorecards.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <span className="text-sm font-medium text-slate-700">{s.period}</span>
                  <div className="flex items-center gap-3">
                    {[["Q", s.quality_score], ["D", s.delivery_score], ["C", s.communication_score], ["V", s.value_score]].map(([label, score]) => (
                      <div key={String(label)} className="text-center">
                        <div className="text-xs text-slate-400">{label}</div>
                        <div className="text-sm font-medium text-slate-800">{score}</div>
                      </div>
                    ))}
                    <div className="text-center ml-2">
                      <div className="text-xs text-slate-400">Overall</div>
                      <div className="text-sm font-bold text-brand-600">{Number(s.overall_score).toFixed(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No scorecards yet.</p>
          )}
        </div>

        {/* Risk Flags */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Risk Flags</h2>
          {flags.length > 0 ? (
            <div className="space-y-2">
              {flags.map((f) => (
                <div key={f.id} className={`rounded-lg border px-4 py-3 ${severityColors[f.severity] ?? "bg-slate-50 border-slate-200"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold uppercase">{f.severity}</span>
                    <span className="text-xs opacity-70">·</span>
                    <span className="text-xs opacity-70">{f.type}</span>
                    {f.ai_detected && <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded">AI</span>}
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${f.status === "open" ? "bg-white/60" : "bg-white/40"}`}>{f.status}</span>
                  </div>
                  <p className="text-xs">{f.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No risk flags.</p>
          )}
        </div>

        {/* Contracts */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Contracts</h2>
          {contracts.length > 0 ? (
            <div className="space-y-2">
              {contracts.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-800">{c.title}</div>
                    {c.value_usd && <div className="text-xs text-slate-500">${Number(c.value_usd).toLocaleString()}</div>}
                  </div>
                  <div className="text-right">
                    <div className={`badge text-xs ${c.status === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}>{c.status}</div>
                    {c.end_date && <div className="text-xs text-slate-500 mt-1">Ends {format(new Date(c.end_date), "MMM d, yyyy")}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No contracts.</p>
          )}
        </div>

        {/* Contacts */}
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Contacts</h2>
          {contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                    {c.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-800">{c.name} {c.is_primary && <span className="text-xs text-brand-600">(Primary)</span>}</div>
                    <div className="text-xs text-slate-500">{c.email} {c.phone ? `· ${c.phone}` : ""}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No contacts on file.</p>
          )}
        </div>
      </div>

      {/* Spend History */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Spend Records</h2>
        {spend.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Period</th>
                  <th className="pb-2 font-medium">Amount</th>
                  <th className="pb-2 font-medium">Category</th>
                  <th className="pb-2 font-medium">Department</th>
                  <th className="pb-2 font-medium">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {spend.map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 text-slate-600">{r.period_start} → {r.period_end}</td>
                    <td className="py-2 font-medium text-slate-900">${Number(r.amount_usd).toLocaleString()}</td>
                    <td className="py-2 text-slate-600">{r.category ?? "—"}</td>
                    <td className="py-2 text-slate-600">{r.department ?? "—"}</td>
                    <td className="py-2 text-slate-500">{r.invoice_ref ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">No spend records.</p>
        )}
      </div>
    </div>
  );
}
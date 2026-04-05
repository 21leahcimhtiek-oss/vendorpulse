import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BarChart3, Shield, TrendingUp, FileText, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export const metadata = { title: "Dashboard" };

async function getDashboardData(orgId: string) {
  const supabase = await createClient();
  const now = new Date();
  const startOfYear = `${now.getFullYear()}-01-01`;
  const in90days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [vendorsRes, spendRes, flagsRes, contractsRes, alertsRes] = await Promise.all([
    supabase.from("vendors").select("id, name, tier, risk_score, spend_ytd_usd, status").eq("org_id", orgId).order("spend_ytd_usd", { ascending: false }),
    supabase.from("spend_records").select("amount_usd, vendor_id").eq("org_id", orgId).gte("period_start", startOfYear),
    supabase.from("risk_flags").select("id, vendor_id, severity, type, status, created_at, vendors(name)").eq("org_id", orgId).eq("status", "open").order("created_at", { ascending: false }).limit(5),
    supabase.from("vendor_contracts").select("id, title, end_date, vendor_id, vendors(name)").eq("org_id", orgId).eq("status", "active").lte("end_date", in90days).gte("end_date", now.toISOString().split("T")[0]),
    supabase.from("alerts").select("id, message, severity, created_at, type").eq("org_id", orgId).is("read_at", null).order("created_at", { ascending: false }).limit(5),
  ]);

  const vendors = vendorsRes.data ?? [];
  const atRisk = vendors.filter((v) => (v.risk_score ?? 0) >= 70).length;
  const ytdSpend = (spendRes.data ?? []).reduce((s, r) => s + Number(r.amount_usd), 0);

  return {
    totalVendors: vendors.length,
    atRiskVendors: atRisk,
    ytdSpend,
    contractsExpiringSoon: (contractsRes.data ?? []).length,
    topVendors: vendors.slice(0, 5),
    recentFlags: flagsRes.data ?? [],
    recentAlerts: alertsRes.data ?? [],
    expiringContracts: contractsRes.data ?? [],
  };
}

const severityColors: Record<string, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-orange-100 text-orange-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-blue-100 text-blue-700",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const member = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  const data = await getDashboardData(member.data.org_id);

  const stats = [
    { label: "Total Vendors", value: data.totalVendors, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "At-Risk Vendors", value: data.atRiskVendors, icon: Shield, color: "text-red-600", bg: "bg-red-50" },
    { label: "YTD Spend", value: `$${(data.ytdSpend / 1000).toFixed(0)}K`, icon: BarChart3, color: "text-green-600", bg: "bg-green-50" },
    { label: "Contracts Expiring (90d)", value: data.contractsExpiringSoon, icon: FileText, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Your vendor relationship overview</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="card p-6">
            <div className={`w-10 h-10 ${s.bg} rounded-lg flex items-center justify-center mb-3`}>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-slate-900">{s.value}</div>
            <div className="text-sm text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Top Vendors */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Top Vendors by Spend</h2>
            <Link href="/vendors" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data.topVendors.map((v) => (
              <div key={v.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <Link href={`/vendors/${v.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600 truncate">
                      {v.name}
                    </Link>
                    <span className="text-sm font-medium text-slate-700 ml-2">
                      ${Number(v.spend_ytd_usd).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-500 rounded-full"
                      style={{ width: `${Math.min(100, (Number(v.spend_ytd_usd) / (data.topVendors[0]?.spend_ytd_usd || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
            {data.topVendors.length === 0 && <p className="text-sm text-slate-400">No vendors yet. <Link href="/vendors/new" className="text-brand-600">Add one</Link></p>}
          </div>
        </div>

        {/* Recent Risk Flags */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">Open Risk Flags</h2>
            <Link href="/risk" className="text-sm text-brand-600 hover:underline">View all</Link>
          </div>
          <div className="space-y-3">
            {data.recentFlags.map((f: any) => (
              <div key={f.id} className="flex items-start gap-3">
                <AlertTriangle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${f.severity === "critical" ? "text-red-500" : f.severity === "high" ? "text-orange-500" : "text-yellow-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{f.vendors?.name}</span>
                    <span className={`badge ${severityColors[f.severity] ?? "bg-slate-100 text-slate-600"}`}>{f.severity}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{f.type} · {format(new Date(f.created_at), "MMM d")}</p>
                </div>
              </div>
            ))}
            {data.recentFlags.length === 0 && <p className="text-sm text-slate-400">No open risk flags. 🎉</p>}
          </div>
        </div>
      </div>

      {/* Expiring Contracts */}
      {data.expiringContracts.length > 0 && (
        <div className="card p-6">
          <h2 className="font-semibold text-slate-900 mb-4">Contracts Expiring Within 90 Days</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="pb-2 font-medium">Contract</th>
                  <th className="pb-2 font-medium">Vendor</th>
                  <th className="pb-2 font-medium">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {data.expiringContracts.map((c: any) => (
                  <tr key={c.id}>
                    <td className="py-2 font-medium text-slate-800">{c.title}</td>
                    <td className="py-2 text-slate-600">{c.vendors?.name}</td>
                    <td className="py-2 text-orange-600 font-medium">{format(new Date(c.end_date), "MMM d, yyyy")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Sparkles } from "lucide-react";

export default function NewVendorPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [assessing, setAssessing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", website: "", category: "", tier: "approved",
    status: "active", contact_name: "", contact_email: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e: React.FormEvent, withAssessment = false) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to create vendor");

      if (withAssessment) {
        setAssessing(true);
        await fetch(`/api/vendors/${json.data.id}/assess`, { method: "POST" });
      }
      router.push(`/vendors/${json.data.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
      setAssessing(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/vendors" className="text-slate-400 hover:text-slate-600"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Add New Vendor</h1>
          <p className="text-slate-500 text-sm">Create a vendor profile to start tracking the relationship</p>
        </div>
      </div>

      <div className="card p-8">
        <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
          {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Vendor Name *</label>
              <input className="input" required value={form.name} onChange={set("name")} placeholder="Acme Supplies Inc." />
            </div>
            <div>
              <label className="label">Website</label>
              <input className="input" type="url" value={form.website} onChange={set("website")} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={set("category")} placeholder="e.g. IT Services, Logistics" />
            </div>
            <div>
              <label className="label">Tier</label>
              <select className="input" value={form.tier} onChange={set("tier")}>
                <option value="strategic">Strategic</option>
                <option value="preferred">Preferred</option>
                <option value="approved">Approved</option>
                <option value="unapproved">Unapproved</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={set("status")}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_review">Under Review</option>
              </select>
            </div>
            <div>
              <label className="label">Primary Contact Name</label>
              <input className="input" value={form.contact_name} onChange={set("contact_name")} placeholder="Jane Smith" />
            </div>
            <div>
              <label className="label">Primary Contact Email</label>
              <input className="input" type="email" value={form.contact_email} onChange={set("contact_email")} placeholder="jane@vendor.com" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading && !assessing ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save vendor
            </button>
            <button
              type="button"
              disabled={loading || !form.name}
              onClick={(e) => handleSubmit(e as any, true)}
              className="btn-secondary"
            >
              {assessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Save & run AI risk assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
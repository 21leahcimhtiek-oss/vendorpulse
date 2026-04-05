"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", orgName: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { org_name: form.orgName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [k]: e.target.value }));

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-brand-600" />
            <span className="text-2xl font-bold text-slate-900">VendorPulse</span>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">Create your account</h1>
          <p className="text-slate-500 text-sm mt-1">Free 14-day trial. No credit card required.</p>
        </div>
        <div className="card p-8">
          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}
            <div>
              <label className="label" htmlFor="orgName">Company name</label>
              <input id="orgName" type="text" className="input" required
                value={form.orgName} onChange={set("orgName")} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="label" htmlFor="email">Work email</label>
              <input id="email" type="email" className="input" required
                value={form.email} onChange={set("email")} placeholder="you@company.com" />
            </div>
            <div>
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" required minLength={8}
                value={form.password} onChange={set("password")} placeholder="At least 8 characters" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
              {loading ? "Creating account..." : "Create free account"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-600 hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
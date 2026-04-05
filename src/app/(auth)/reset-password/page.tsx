"use client";
import { useState } from "react";
import Link from "next/link";
import { Building2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dashboard/settings`,
    });
    if (error) { setError(error.message); setLoading(false); }
    else setSubmitted(true);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Building2 className="h-8 w-8 text-brand-600" />
            <span className="text-2xl font-bold text-slate-900">VendorPulse</span>
          </div>
        </div>
        <div className="card p-8">
          {submitted ? (
            <div className="text-center">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="font-semibold text-slate-900 mb-2">Check your email</h2>
              <p className="text-sm text-slate-500">We sent a password reset link to <strong>{email}</strong></p>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Reset your password</h1>
              <p className="text-sm text-slate-500 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
              <form onSubmit={handleReset} className="space-y-4">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
                <div>
                  <label className="label" htmlFor="email">Email</label>
                  <input id="email" type="email" className="input" required
                    value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-2.5">
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
        <p className="text-center text-sm text-slate-500 mt-6">
          <Link href="/login" className="text-brand-600 hover:underline">Back to sign in</Link>
        </p>
      </div>
    </div>
  );
}
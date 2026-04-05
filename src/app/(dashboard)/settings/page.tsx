"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: fd.get("password") as string });
    setMsg(error ? error.message : "Password updated successfully.");
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your account preferences</p>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-slate-900">Account</h2>
        <div>
          <label className="label">Email</label>
          <div className="input bg-slate-50 text-slate-500 cursor-not-allowed">{user?.email}</div>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Change Password</h2>
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {msg && <div className={`text-sm px-4 py-3 rounded-lg ${msg.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg}</div>}
          <div>
            <label className="label">New Password</label>
            <input name="password" type="password" className="input" required minLength={8} placeholder="At least 8 characters" />
          </div>
          <button type="submit" className="btn-primary">Update password</button>
        </form>
      </div>

      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-slate-500 mb-4">These actions are irreversible.</p>
        <button onClick={handleSignOut} className="btn-danger text-sm">Sign out</button>
      </div>
    </div>
  );
}
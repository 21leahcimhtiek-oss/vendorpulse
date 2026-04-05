import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export const metadata = { title: "Billing" };

const plans = [
  { id: "starter", name: "Starter", price: 89, vendors: 25 },
  { id: "pro", name: "Pro", price: 229, vendors: 200 },
  { id: "enterprise", name: "Enterprise", price: 549, vendors: -1 },
];

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const member = await supabase.from("org_members").select("org_id, role, orgs(name, plan, stripe_subscription_id)").eq("user_id", user.id).single();
  if (!member.data) redirect("/login");

  const org = (member.data as any).orgs;
  const currentPlan = plans.find((p) => p.id === org?.plan) ?? plans[0];

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your subscription and billing information</p>
      </div>

      {/* Current Plan */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg font-bold text-slate-900">{currentPlan.name}</div>
            <div className="text-sm text-slate-500">${currentPlan.price}/month · {currentPlan.vendors === -1 ? "Unlimited" : currentPlan.vendors} vendors</div>
            {org?.stripe_subscription_id && (
              <div className="text-xs text-slate-400 mt-1">Subscription: {org.stripe_subscription_id}</div>
            )}
          </div>
          <form action="/api/billing/portal" method="POST">
            <button type="submit" className="btn-secondary">Manage subscription</button>
          </form>
        </div>
      </div>

      {/* Upgrade Options */}
      <div className="card p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Change Plan</h2>
        <div className="grid grid-cols-3 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className={`rounded-xl border p-5 ${plan.id === org?.plan ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
              <div className="font-semibold text-slate-900 mb-1">{plan.name}</div>
              <div className="text-2xl font-bold text-slate-900">${plan.price}<span className="text-sm font-normal text-slate-500">/mo</span></div>
              <div className="text-xs text-slate-500 mt-1">{plan.vendors === -1 ? "Unlimited" : plan.vendors} vendors</div>
              {plan.id !== org?.plan ? (
                <form action="/api/billing/create-checkout" method="POST" className="mt-4">
                  <input type="hidden" name="plan" value={plan.id} />
                  <button type="submit" className="btn-primary w-full justify-center text-sm py-2">
                    {plan.price > currentPlan.price ? "Upgrade" : "Downgrade"}
                  </button>
                </form>
              ) : (
                <div className="mt-4 text-center text-xs font-medium text-brand-600 py-2 bg-brand-100 rounded-lg">Current plan</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
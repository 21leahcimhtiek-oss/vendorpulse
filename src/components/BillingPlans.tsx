"use client";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
  highlighted?: boolean;
}

interface BillingPlansProps {
  plans: Plan[];
  currentPlan: string;
}

export default function BillingPlans({ plans, currentPlan }: BillingPlansProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleUpgrade(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch {
      setLoading(null);
    }
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => (
        <div
          key={plan.id}
          className={`card p-6 relative ${plan.id === currentPlan ? "ring-2 ring-brand-500" : ""}`}
        >
          {plan.highlighted && plan.id !== currentPlan && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
              Most popular
            </div>
          )}
          <div className="mb-4">
            <h3 className="font-bold text-lg text-slate-900">{plan.name}</h3>
            <p className="text-sm text-slate-500 mt-1">{plan.description}</p>
          </div>
          <div className="mb-5">
            <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
            <span className="text-slate-500 text-sm">/month</span>
          </div>
          <ul className="space-y-2 mb-6">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 className="h-4 w-4 text-brand-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
          {plan.id === currentPlan ? (
            <div className="text-center py-2 bg-brand-50 text-brand-700 rounded-lg text-sm font-medium">Current plan</div>
          ) : (
            <button
              onClick={() => handleUpgrade(plan.id)}
              disabled={loading !== null}
              className={plan.highlighted ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}
            >
              {loading === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {plan.price > (plans.find((p) => p.id === currentPlan)?.price ?? 0) ? "Upgrade" : "Switch"}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
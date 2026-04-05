import Link from "next/link";
import {
  BarChart3, Shield, FileText, TrendingUp, ChevronRight,
  CheckCircle2, Star, Zap, Building2
} from "lucide-react";

const features = [
  {
    icon: Star,
    title: "Vendor Scorecards",
    description: "Rate every vendor on quality, delivery, communication, and value. Track performance trends across quarters and identify your top and underperforming partners.",
  },
  {
    icon: Shield,
    title: "AI Risk Monitoring",
    description: "GPT-4o analyzes vendor profiles, spend patterns, and flag history to generate real-time risk scores and actionable mitigation recommendations.",
  },
  {
    icon: BarChart3,
    title: "Spend Analytics",
    description: "Visualize spend by vendor, department, category, and period. Import from any ERP via CSV and uncover hidden cost optimization opportunities.",
  },
  {
    icon: FileText,
    title: "Contract Tracking",
    description: "Never miss a renewal. Track contract status, value, and expiration dates. Get alerts 30, 60, and 90 days before contracts expire.",
  },
];

const plans = [
  {
    name: "Starter",
    price: 89,
    description: "Perfect for small procurement teams",
    features: ["25 vendor profiles", "Spend analytics", "Vendor scorecards", "Contract tracking", "CSV import"],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: 229,
    description: "For growing organizations",
    features: ["200 vendor profiles", "AI risk monitoring", "AI vendor summaries", "Team collaboration", "API access", "Priority support"],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: 549,
    description: "For large enterprises",
    features: ["Unlimited vendors", "Custom integrations", "SSO / SAML", "Dedicated CSM", "SLA 99.9%", "Audit logs"],
    cta: "Contact sales",
    highlighted: false,
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-slate-100 bg-white/90 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-brand-600" />
            <span className="font-bold text-lg text-slate-900">VendorPulse</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900">Sign in</Link>
            <Link href="/signup" className="btn-primary text-sm">Get started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <Zap className="h-3.5 w-3.5" />
          AI-powered vendor intelligence
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
          Manage every vendor<br />
          <span className="text-brand-600">relationship with precision</span>
        </h1>
        <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
          VendorPulse gives procurement teams real-time visibility into vendor performance,
          spend patterns, and risk exposure — all in one platform.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            Start free 14-day trial <ChevronRight className="h-4 w-4" />
          </Link>
          <Link href="#pricing" className="btn-secondary text-base px-8 py-3">
            View pricing
          </Link>
        </div>
        <p className="text-sm text-slate-400 mt-4">No credit card required · Setup in 30 minutes</p>
      </section>

      {/* Features */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Everything your procurement team needs</h2>
            <p className="text-lg text-slate-500">From vendor onboarding to risk resolution — one platform, complete visibility.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f) => (
              <div key={f.title} className="card p-6">
                <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-brand-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 bg-brand-700">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-12 text-center">
            {[
              { value: "2.4x", label: "Faster vendor onboarding" },
              { value: "$420K", label: "Average annual savings identified" },
              { value: "94%", label: "Risk incidents caught early" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-4xl font-bold text-white mb-2">{s.value}</div>
                <div className="text-brand-200">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">Simple, transparent pricing</h2>
            <p className="text-lg text-slate-500">Start free. Scale as you grow.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div key={plan.name} className={`card p-8 relative ${plan.highlighted ? "border-brand-500 ring-2 ring-brand-500" : ""}`}>
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <h3 className="font-bold text-lg text-slate-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle2 className="h-4 w-4 text-brand-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.cta === "Contact sales" ? "mailto:sales@vendorpulse.io" : "/signup"}
                  className={plan.highlighted ? "btn-primary w-full justify-center" : "btn-secondary w-full justify-center"}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to take control of your vendor relationships?</h2>
          <p className="text-slate-400 mb-8 text-lg">Join hundreds of procurement teams already using VendorPulse.</p>
          <Link href="/signup" className="btn-primary text-base px-8 py-3">
            Start your free trial <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-brand-600" />
            <span className="font-semibold text-slate-900">VendorPulse</span>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} VendorPulse. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-slate-500">
            <a href="#" className="hover:text-slate-700">Privacy</a>
            <a href="#" className="hover:text-slate-700">Terms</a>
            <a href="mailto:support@vendorpulse.io" className="hover:text-slate-700">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
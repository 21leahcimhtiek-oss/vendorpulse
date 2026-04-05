import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { assessVendorRisk } from "@/lib/openai/assess-vendor-risk";
import { generateVendorSummary } from "@/lib/openai/generate-vendor-summary";
import { aiRateLimit, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(aiRateLimit, user.id);
  if (!success) return NextResponse.json({ error: "AI rate limit exceeded. Try again in a minute." }, { status: 429 });

  const { data: member } = await supabase.from("org_members").select("org_id, orgs(plan)").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const plan = (member as any).orgs?.plan;
  if (plan === "starter") return NextResponse.json({ error: "AI risk assessment requires Pro or Enterprise plan" }, { status: 403 });

  const orgId = member.org_id;

  const [vendorRes, spendRes, flagsRes, scorecardsRes, contractsRes] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", params.id).eq("org_id", orgId).single(),
    supabase.from("spend_records").select("*").eq("vendor_id", params.id).order("period_start", { ascending: false }).limit(20),
    supabase.from("risk_flags").select("*").eq("vendor_id", params.id).eq("status", "open"),
    supabase.from("vendor_scorecards").select("*").eq("vendor_id", params.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("vendor_contracts").select("*").eq("vendor_id", params.id),
  ]);

  if (!vendorRes.data) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const [assessment, summary] = await Promise.all([
    assessVendorRisk(vendorRes.data, spendRes.data ?? [], flagsRes.data ?? [], scorecardsRes.data ?? []),
    generateVendorSummary(vendorRes.data, scorecardsRes.data ?? [], spendRes.data ?? [], flagsRes.data ?? [], contractsRes.data ?? []),
  ]);

  // Upsert risk flags for new factors
  const newFlags = assessment.risk_factors.map((f) => ({
    vendor_id: params.id,
    org_id: orgId,
    type: f.type,
    severity: f.severity,
    description: f.description,
    status: "open" as const,
    ai_detected: true,
  }));

  await Promise.all([
    supabase.from("vendors").update({ risk_score: assessment.risk_score, ai_summary: summary }).eq("id", params.id),
    newFlags.length > 0 ? supabase.from("risk_flags").insert(newFlags) : Promise.resolve(),
  ]);

  return NextResponse.json({
    data: {
      risk_score: assessment.risk_score,
      risk_factors: assessment.risk_factors,
      mitigation_recommendations: assessment.mitigation_recommendations,
      summary,
      flags_created: newFlags.length,
    },
  });
}
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateVendorSummary } from "@/lib/openai/generate-vendor-summary";
import { aiRateLimit, checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(aiRateLimit, user.id);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const [vendorRes, scorecardsRes, spendRes, flagsRes, contractsRes] = await Promise.all([
    supabase.from("vendors").select("*").eq("id", params.id).eq("org_id", member.org_id).single(),
    supabase.from("vendor_scorecards").select("*").eq("vendor_id", params.id).order("created_at", { ascending: false }).limit(8),
    supabase.from("spend_records").select("*").eq("vendor_id", params.id).order("period_start", { ascending: false }).limit(20),
    supabase.from("risk_flags").select("*").eq("vendor_id", params.id),
    supabase.from("vendor_contracts").select("*").eq("vendor_id", params.id),
  ]);

  if (!vendorRes.data) return NextResponse.json({ error: "Vendor not found" }, { status: 404 });

  const summary = await generateVendorSummary(
    vendorRes.data,
    scorecardsRes.data ?? [],
    spendRes.data ?? [],
    flagsRes.data ?? [],
    contractsRes.data ?? []
  );

  await supabase.from("vendors").update({ ai_summary: summary }).eq("id", params.id);
  return NextResponse.json({ data: { summary } });
}
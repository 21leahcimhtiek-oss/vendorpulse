import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateFlagSchema = z.object({
  vendor_id: z.string().uuid(),
  type: z.enum(["financial", "compliance", "operational", "reputational"]),
  severity: z.enum(["low", "medium", "high", "critical"]),
  description: z.string().min(10).max(1000),
});

async function getOrgId(supabase: any, userId: string) {
  const { data } = await supabase.from("org_members").select("org_id").eq("user_id", userId).single();
  return data?.org_id as string | undefined;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const severity = searchParams.get("severity");
  const status = searchParams.get("status");
  const vendorId = searchParams.get("vendor_id");

  let query = supabase
    .from("risk_flags")
    .select("*, vendors(name, tier)")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (severity) query = query.eq("severity", severity);
  if (status) query = query.eq("status", status);
  if (vendorId) query = query.eq("vendor_id", vendorId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = CreateFlagSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { data, error } = await supabase
    .from("risk_flags")
    .insert({ ...parsed.data, org_id: orgId, ai_detected: false, status: "open" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
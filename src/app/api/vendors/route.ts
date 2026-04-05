import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { apiRateLimit, checkRateLimit } from "@/lib/rate-limit";

const CreateVendorSchema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal("")),
  category: z.string().max(100).optional(),
  tier: z.enum(["strategic", "preferred", "approved", "unapproved"]).default("approved"),
  status: z.enum(["active", "inactive", "under_review", "blacklisted"]).default("active"),
  contact_name: z.string().max(200).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
});

async function getOrgId(supabase: any, userId: string) {
  const { data } = await supabase.from("org_members").select("org_id").eq("user_id", userId).single();
  return data?.org_id as string | undefined;
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimit, user.id);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier");
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 100);

  let query = supabase
    .from("vendors")
    .select(`
      id, name, website, category, tier, status,
      contact_name, contact_email, spend_ytd_usd, risk_score, ai_summary,
      created_at, updated_at
    `)
    .eq("org_id", orgId)
    .order("spend_ytd_usd", { ascending: false })
    .limit(limit);

  if (tier) query = query.eq("tier", tier);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { success } = await checkRateLimit(apiRateLimit, user.id);
  if (!success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });

  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization found" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = CreateVendorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const payload = { ...parsed.data, org_id: orgId };
  if (!payload.website) delete (payload as any).website;
  if (!payload.contact_email) delete (payload as any).contact_email;

  const { data, error } = await supabase.from("vendors").insert(payload).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
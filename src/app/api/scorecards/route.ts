import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateScorecardSchema = z.object({
  vendor_id: z.string().uuid(),
  period: z.string().min(1).max(20),
  quality_score: z.number().int().min(1).max(10),
  delivery_score: z.number().int().min(1).max(10),
  communication_score: z.number().int().min(1).max(10),
  value_score: z.number().int().min(1).max(10),
  notes: z.string().max(2000).optional(),
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
  const vendorId = searchParams.get("vendor_id");

  let query = supabase
    .from("vendor_scorecards")
    .select("*, vendors(name)")
    .eq("org_id", orgId)
    .order("period", { ascending: false })
    .limit(50);

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
  const parsed = CreateScorecardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { quality_score, delivery_score, communication_score, value_score, ...rest } = parsed.data;
  const overall_score = Number(((quality_score + delivery_score + communication_score + value_score) / 4).toFixed(2));

  const { data, error } = await supabase
    .from("vendor_scorecards")
    .insert({ ...rest, quality_score, delivery_score, communication_score, value_score, overall_score, org_id: orgId, created_by: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data }, { status: 201 });
}
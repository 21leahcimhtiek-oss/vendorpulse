import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateVendorSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  website: z.string().url().optional().or(z.literal("")),
  category: z.string().max(100).optional(),
  tier: z.enum(["strategic", "preferred", "approved", "unapproved"]).optional(),
  status: z.enum(["active", "inactive", "under_review", "blacklisted"]).optional(),
  contact_name: z.string().max(200).optional(),
  contact_email: z.string().email().optional().or(z.literal("")),
  ai_summary: z.string().optional(),
  risk_score: z.number().int().min(0).max(100).optional(),
});

async function getOrgId(supabase: any, userId: string) {
  const { data } = await supabase.from("org_members").select("org_id").eq("user_id", userId).single();
  return data?.org_id as string | undefined;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { data, error } = await supabase
    .from("vendors")
    .select(`
      *,
      vendor_contacts(*),
      spend_records(*),
      vendor_scorecards(*),
      risk_flags(*),
      vendor_contracts(*)
    `)
    .eq("id", params.id)
    .eq("org_id", orgId)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = UpdateVendorSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { data, error } = await supabase
    .from("vendors")
    .update(parsed.data)
    .eq("id", params.id)
    .eq("org_id", orgId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { error } = await supabase.from("vendors").delete().eq("id", params.id).eq("org_id", orgId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const PatchScorecardSchema = z.object({
  quality_score: z.number().int().min(1).max(10).optional(),
  delivery_score: z.number().int().min(1).max(10).optional(),
  communication_score: z.number().int().min(1).max(10).optional(),
  value_score: z.number().int().min(1).max(10).optional(),
  notes: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { data, error } = await supabase
    .from("vendor_scorecards")
    .select("*, vendors(name)")
    .eq("id", params.id)
    .eq("org_id", member.org_id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = PatchScorecardSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const updates: any = { ...parsed.data };
  if (parsed.data.quality_score || parsed.data.delivery_score || parsed.data.communication_score || parsed.data.value_score) {
    const { data: existing } = await supabase.from("vendor_scorecards").select("*").eq("id", params.id).single();
    if (existing) {
      const q = parsed.data.quality_score ?? existing.quality_score;
      const d = parsed.data.delivery_score ?? existing.delivery_score;
      const c = parsed.data.communication_score ?? existing.communication_score;
      const v = parsed.data.value_score ?? existing.value_score;
      updates.overall_score = Number(((q + d + c + v) / 4).toFixed(2));
    }
  }

  const { data, error } = await supabase
    .from("vendor_scorecards")
    .update(updates)
    .eq("id", params.id)
    .eq("org_id", member.org_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const { error } = await supabase.from("vendor_scorecards").delete().eq("id", params.id).eq("org_id", member.org_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
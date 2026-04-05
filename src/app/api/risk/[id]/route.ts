import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const PatchFlagSchema = z.object({
  status: z.enum(["open", "acknowledged", "resolved"]),
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: member } = await supabase.from("org_members").select("org_id").eq("user_id", user.id).single();
  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const parsed = PatchFlagSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { data, error } = await supabase
    .from("risk_flags")
    .update({ status: parsed.data.status })
    .eq("id", params.id)
    .eq("org_id", member.org_id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
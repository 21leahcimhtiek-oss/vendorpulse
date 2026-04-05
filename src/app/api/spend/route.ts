import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import Papa from "papaparse";

const SpendRecordSchema = z.object({
  vendor_id: z.string().uuid(),
  amount_usd: z.number().positive(),
  category: z.string().max(100).optional(),
  department: z.string().max(100).optional(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  invoice_ref: z.string().max(100).optional(),
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
  const groupBy = searchParams.get("groupBy") ?? "vendor";
  const vendorId = searchParams.get("vendor_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("spend_records")
    .select("id, vendor_id, amount_usd, category, department, period_start, period_end, invoice_ref, vendors(name)")
    .eq("org_id", orgId)
    .order("period_start", { ascending: false });

  if (vendorId) query = query.eq("vendor_id", vendorId);
  if (from) query = query.gte("period_start", from);
  if (to) query = query.lte("period_end", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (groupBy === "raw") return NextResponse.json({ data });

  const grouped: Record<string, number> = {};
  (data ?? []).forEach((r: any) => {
    let key = "Unknown";
    if (groupBy === "vendor") key = r.vendors?.name ?? r.vendor_id;
    else if (groupBy === "category") key = r.category ?? "Uncategorized";
    else if (groupBy === "department") key = r.department ?? "Unassigned";
    else if (groupBy === "period") key = r.period_start?.slice(0, 7) ?? "Unknown";
    grouped[key] = (grouped[key] ?? 0) + Number(r.amount_usd);
  });

  const aggregated = Object.entries(grouped)
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({ data: aggregated });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = await getOrgId(supabase, user.id);
  if (!orgId) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const contentType = request.headers.get("content-type") ?? "";

  // CSV bulk import
  if (contentType.includes("text/csv") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 422 });

    const text = await file.text();
    const { data: rows } = Papa.parse(text, { header: true, skipEmptyLines: true });

    const records: any[] = [];
    const errors: string[] = [];

    (rows as any[]).forEach((row, i) => {
      const parsed = SpendRecordSchema.safeParse({
        vendor_id: row.vendor_id,
        amount_usd: parseFloat(row.amount_usd),
        category: row.category,
        department: row.department,
        period_start: row.period_start,
        period_end: row.period_end,
        invoice_ref: row.invoice_ref,
      });
      if (parsed.success) records.push({ ...parsed.data, org_id: orgId });
      else errors.push(`Row ${i + 2}: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`);
    });

    if (records.length > 0) {
      const { error } = await supabase.from("spend_records").insert(records);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: { imported: records.length, errors } });
  }

  // Single record
  const body = await request.json().catch(() => ({}));
  const parsed = SpendRecordSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });

  const { data, error } = await supabase.from("spend_records").insert({ ...parsed.data, org_id: orgId }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ data }, { status: 201 });
}
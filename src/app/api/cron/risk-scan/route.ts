import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Daily cron: scan for unacknowledged critical risk flags and create alerts
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = await createAdminClient();

  // Find critical open flags older than 48h with no alert
  const { data: flags } = await supabase
    .from("risk_flags")
    .select("id, vendor_id, org_id, severity, description")
    .eq("status", "open")
    .eq("severity", "critical")
    .lt("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString());

  if (!flags || flags.length === 0) {
    return NextResponse.json({ message: "No critical flags to process", count: 0 });
  }

  const alerts = flags.map((f) => ({
    org_id: f.org_id,
    vendor_id: f.vendor_id,
    type: "critical_risk_unacknowledged",
    message: `Critical risk flag has been open for 48+ hours: ${f.description.slice(0, 100)}`,
    severity: "critical" as const,
  }));

  const { error } = await supabase.from("alerts").insert(alerts);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ message: "Risk scan complete", alerts_created: alerts.length });
}
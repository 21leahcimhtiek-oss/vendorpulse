import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe, PRICE_IDS } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id, orgs(name, stripe_customer_id)")
    .eq("user_id", user.id)
    .single();

  if (!member) return NextResponse.json({ error: "No organization" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const plan = body.plan as keyof typeof PRICE_IDS;
  if (!PRICE_IDS[plan]) return NextResponse.json({ error: "Invalid plan" }, { status: 422 });

  const org = (member as any).orgs;
  let customerId = org?.stripe_customer_id;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { org_id: member.org_id },
    });
    customerId = customer.id;
    await supabase.from("orgs").update({ stripe_customer_id: customerId }).eq("id", member.org_id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { org_id: member.org_id, plan },
  });

  return NextResponse.json({ url: session.url });
}
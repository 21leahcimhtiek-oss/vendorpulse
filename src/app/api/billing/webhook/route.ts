import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
  }

  const supabase = await createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.CheckoutSession;
      const orgId = session.metadata?.org_id;
      const plan = session.metadata?.plan;
      if (orgId && plan) {
        await supabase.from("orgs").update({
          plan,
          stripe_subscription_id: session.subscription as string,
        }).eq("id", orgId);
      }
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const { data: org } = await supabase
        .from("orgs")
        .select("id")
        .eq("stripe_subscription_id", sub.id)
        .single();
      if (org) {
        const priceId = sub.items.data[0]?.price.id;
        const planMap: Record<string, string> = {
          [process.env.STRIPE_STARTER_PRICE_ID!]: "starter",
          [process.env.STRIPE_PRO_PRICE_ID!]: "pro",
          [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: "enterprise",
        };
        const plan = planMap[priceId] ?? "starter";
        await supabase.from("orgs").update({ plan }).eq("id", org.id);
      }
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await supabase.from("orgs").update({ plan: "starter", stripe_subscription_id: null })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
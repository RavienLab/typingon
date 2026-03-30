import Stripe from "stripe";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checkout = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],

    customer_email: session.user.email,

    line_items: [
      {
        price: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],

    metadata: {
      userId: session.user.id,
    },

    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?canceled=1`,
  });

  return NextResponse.json({ url: checkout.url });
}
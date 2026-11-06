import type { Request, Response } from "express";
import Stripe from "stripe";
import * as db from "./db";

let stripeClient: Stripe | null = null;

/** Lazy init — sem STRIPE_SECRET_KEY o servidor precisa subir mesmo assim. */
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2025-11-17.clover",
    });
  }
  return stripeClient;
}

export async function handleStripeWebhook(req: Request, res: Response) {
  const stripe = getStripe();
  if (!stripe) {
    console.warn("[Stripe Webhook] STRIPE_SECRET_KEY não configurada — webhook ignorado");
    return res.status(503).send("Stripe not configured");
  }

  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Stripe Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing signature");
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err: any) {
    console.error("[Stripe Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Stripe Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment succeeded: ${paymentIntent.id}`);

        // Update ride payment status
        const rideId = paymentIntent.metadata.ride_id;
        if (rideId) {
          await db.updateRidePaymentStatus(
            parseInt(rideId),
            "paid",
            paymentIntent.id
          );
          console.log(`[Stripe Webhook] Updated ride ${rideId} to paid`);
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(`[Stripe Webhook] Payment failed: ${paymentIntent.id}`);

        const rideId = paymentIntent.metadata.ride_id;
        if (rideId) {
          await db.updateRidePaymentStatus(
            parseInt(rideId),
            "failed",
            paymentIntent.id
          );
          console.log(`[Stripe Webhook] Updated ride ${rideId} to failed`);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

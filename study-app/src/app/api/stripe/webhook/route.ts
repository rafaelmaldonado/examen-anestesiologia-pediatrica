import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe/config";
import { adminDb } from "@/lib/firebase/admin";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const { userId, certificationId } = session.metadata!;

        if (!userId || !certificationId) {
          console.error("Missing metadata in session:", session.metadata);
          break;
        }

        if (!adminDb) {
          console.error("Database not initialized");
          break;
        }

        // Find and update the subscription record
        const subscriptionsRef = adminDb.collection('userSubscriptions');
        const snapshot = await subscriptionsRef
          .where('userId', '==', userId)
          .where('certificationId', '==', certificationId)
          .where('status', '==', 'pending')
          .orderBy('createdAt', 'desc')
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const subscriptionDoc = snapshot.docs[0];
          await subscriptionDoc.ref.update({
            status: 'paid',
            paidAt: new Date(),
            stripePaymentIntentId: session.payment_intent,
          });

          console.log(`Payment completed for user ${userId}, certification ${certificationId}`);
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        if (!adminDb) {
          console.error("Database not initialized");
          break;
        }

        // Update subscription status to failed
        const subscriptionsRef = adminDb.collection('userSubscriptions');
        const snapshot = await subscriptionsRef
          .where('stripePaymentIntentId', '==', paymentIntent.id)
          .limit(1)
          .get();

        if (!snapshot.empty) {
          const subscriptionDoc = snapshot.docs[0];
          await subscriptionDoc.ref.update({
            status: 'failed',
          });

          console.log(`Payment failed for payment intent ${paymentIntent.id}`);
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

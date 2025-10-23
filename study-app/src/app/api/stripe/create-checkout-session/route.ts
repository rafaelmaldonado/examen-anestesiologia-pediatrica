import { NextResponse } from "next/server";
import { getVerifiedUser } from "@/lib/firebase/auth-helper";
import { adminDb } from "@/lib/firebase/admin";
import { stripe } from "@/lib/stripe/config";
import { createUserSubscription } from "@/lib/stripe/helpers";

export async function POST(request: Request) {
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { certificationId } = body;

    if (!certificationId) {
      return NextResponse.json({ error: "certificationId is required" }, { status: 400 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: "Database not initialized" }, { status: 500 });
    }

    // Get certification details
    const certificationDoc = await adminDb.collection("certifications").doc(certificationId).get();
    if (!certificationDoc.exists) {
      return NextResponse.json({ error: "Certification not found" }, { status: 404 });
    }

    const certification = { id: certificationDoc.id, ...certificationDoc.data() } as any;
    
    // Check if certification is free
    if (certification.isFree) {
      return NextResponse.json({ error: "This certification is free" }, { status: 400 });
    }

    const amount = certification.price || 2999; // Default $29.99 if no price set

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email || undefined,
      metadata: {
        userId: user.uid,
        certificationId: certificationId,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Access to ${certification.name}`,
              description: certification.description || `Full access to ${certification.name} certification course and unlimited quiz attempts.`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get('origin')}/quiz/${certificationId}?payment=success`,
      cancel_url: `${request.headers.get('origin')}/certifications/${certificationId}/ratings?payment=cancelled`,
    });

    // Create pending subscription record
    await createUserSubscription({
      userId: user.uid,
      certificationId,
      stripePaymentIntentId: session.payment_intent as string,
      status: 'pending',
      amount,
      createdAt: new Date(),
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

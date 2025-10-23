'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentButtonProps {
  certificationId: string;
  certificationName: string;
  price?: number;
  isFree?: boolean;
  onSuccess?: () => void;
}

export default function PaymentButton({ 
  certificationId, 
  certificationName, 
  price, 
  isFree = false,
  onSuccess 
}: PaymentButtonProps) {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (isFree) {
      onSuccess?.();
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          certificationId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { sessionId } = await response.json();
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error } = await stripe.redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(error.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayPrice = price ? (price / 100).toFixed(2) : '29.99';

  return (
    <div className="card-dark p-6 rounded-xl">
      <div className="text-center">
        <h3 className="text-xl font-bold text-gray-200 mb-2">
          {isFree ? 'Free Access' : 'Purchase Full Access'}
        </h3>
        <p className="text-gray-400 mb-4">
          {isFree 
            ? 'This certification is completely free!'
            : `Get unlimited quiz attempts for ${certificationName}`
          }
        </p>
        
        {!isFree && (
          <div className="text-3xl font-bold text-glow-purple mb-4">
            ${displayPrice}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
            isFree 
              ? 'btn-neon-green' 
              : 'btn-neon-purple hover:scale-105'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <div className="spinner-neon w-5 h-5 mr-2"></div>
              Processing...
            </div>
          ) : (
            isFree ? 'Start Learning' : 'Purchase Access'
          )}
        </button>

        {!isFree && (
          <div className="mt-4 text-sm text-gray-400">
            <p>✓ Unlimited quiz attempts</p>
            <p>✓ Detailed explanations</p>
            <p>✓ Progress tracking</p>
            <p>✓ Lifetime access</p>
          </div>
        )}
      </div>
    </div>
  );
}

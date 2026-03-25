'use client';

import { stripePromise } from '../lib/stripe';

interface PayButtonProps {
  priceId?: string;
  label?: string;
}

export default function PayButton({
  priceId = 'price_pastlife_basic',
  label = 'Get Full Reading - $9.99'
}: PayButtonProps) {
  const handleCheckout = async () => {
    const stripe = await stripePromise;
    if (!stripe) return;

    await stripe.redirectToCheckout({
      lineItems: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      successUrl: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${window.location.origin}/cancel`,
    });
  };

  return (
    <button
      onClick={handleCheckout}
      style={{
        backgroundColor: '#635bff',
        color: 'white',
        border: 'none',
        padding: '12px 24px',
        borderRadius: '4px',
        fontSize: '16px',
        fontWeight: '600',
        cursor: 'pointer',
        marginTop: '1rem'
      }}
    >
      {label}
    </button>
  );
}

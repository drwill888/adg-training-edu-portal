// pages/api/self-paced/create-checkout-session.js
// Creates a Stripe Checkout session for the Self-Paced Journey ($149)
// Env vars required:
//   STRIPE_SECRET_KEY
//   STRIPE_SELF_PACED_PRICE_ID  — create in Stripe dashboard, $149 one-time
//   NEXT_PUBLIC_SITE_URL

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `https://${req.headers.host}`;

  try {
    const priceData = process.env.STRIPE_SELF_PACED_PRICE_ID
      ? { price: process.env.STRIPE_SELF_PACED_PRICE_ID }
      : {
          price_data: {
            currency: 'usd',
            unit_amount: 14900, // $14900
            product_data: {
              name: 'Called to Carry — Self-Paced Journey',
              description:
                '6 modules of Kingdom leadership formation. 3 months portal access. Blueprint export + Certificate included.',
            },
          },
        };

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{ ...priceData, quantity: 1 }],
      allow_promotion_codes: true,   // ← ADD THIS LINE
      success_url: `${baseUrl}/self-paced/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/self-paced?canceled=true`,
      customer_email: req.body.email || undefined,
      metadata: {
        product: 'self-paced-journey',
        source: 'called-to-carry',
      },
      billing_address_collection: 'auto',
      allow_promotion_codes: true,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe session error:', err);
    return res.status(500).json({ error: err.message });
  }
}

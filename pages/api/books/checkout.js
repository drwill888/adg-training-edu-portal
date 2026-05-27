// pages/api/books/checkout.js
// Universal Stripe checkout — handles any product slug.
// Reads price, name, and access duration from the registry.
import Stripe from 'stripe';
import { getProduct } from '@/lib/products/registry';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, firstName, lastName, productSlug } = req.body || {};
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || undefined;

  if (!productSlug) return res.status(400).json({ error: 'productSlug is required' });

  const product = getProduct(productSlug);
  if (!product) return res.status(404).json({ error: `Unknown product: ${productSlug}` });

  try {
    // Use test key if present (set STRIPE_SECRET_KEY_TEST in Vercel to test with 4242 cards)
    const stripeKey = process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeKey);
    const origin = req.headers.origin || 'https://5cblueprint.awakeningdestiny.global';

    const session = await stripe.checkout.sessions.create({
      mode:                 'payment',
      payment_method_types: ['card'],
      customer_email:       email || undefined,
      line_items: [
        {
          price_data: {
            currency:     'usd',
            product_data: {
              name:        `${product.name} — ${product.daysAccess}-Day AI Coaching Access`,
              description: product.tagline,
            },
            unit_amount: product.priceUsd,
          },
          quantity: 1,
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/books/${productSlug}?session_id={CHECKOUT_SESSION_ID}&email=${encodeURIComponent(email || '')}`,
      cancel_url:  `${origin}/books/${productSlug}`,
      metadata: {
        tier:         'product_subscriber',
        product_slug: productSlug,
        email:        email || '',
        first_name:   firstName || '',
        last_name:    lastName  || '',
        full_name:    fullName  || '',
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Book checkout error:', error.message);
    return res.status(500).json({ error: error.message || 'Failed to create checkout session' });
  }
}

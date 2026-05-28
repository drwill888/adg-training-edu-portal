// ONE-TIME USE — create a 100% off coupon in live Stripe for testing.
// Hit GET /api/admin/create-coupon?secret=adg2026 once to create it, then this file can be deleted.
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.query.secret !== 'adg2026') {
    return res.status(403).json({ error: 'forbidden' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Step 1: Ensure coupon exists
  let coupon;
  try {
    coupon = await stripe.coupons.create({
      percent_off:     100,
      duration:        'once',
      name:            'ADG Internal Test — 100% Off',
      id:              'ADG-TEST-100',
      max_redemptions: 10,
    });
  } catch (err) {
    if (err.code === 'resource_already_exists') {
      coupon = await stripe.coupons.retrieve('ADG-TEST-100');
    } else {
      return res.status(500).json({ error: `Coupon error: ${err.message}` });
    }
  }

  // Step 2: Ensure promo code exists — try create first, fall back to find
  let promo;
  try {
    promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code:   'ADGTEST100',
      active: true,
    });
  } catch (err) {
    if (err.code === 'resource_already_exists') {
      // Find it by listing all promo codes (SDK version doesn't support coupon filter)
      const all = await stripe.promotionCodes.list({ limit: 100 });
      promo = all.data.find(p => p.code === 'ADGTEST100');
      if (!promo) {
        return res.status(500).json({ error: 'ADGTEST100 exists but could not be retrieved' });
      }
    } else {
      return res.status(500).json({ error: `Promo code error: ${err.message}` });
    }
  }

  const key = process.env.STRIPE_SECRET_KEY || '';
  return res.status(200).json({
    message:        'Ready. Use this code at Stripe checkout for 100% off.',
    stripe_mode:    key.startsWith('sk_live') ? 'LIVE' : key.startsWith('sk_test') ? 'TEST' : 'UNKNOWN',
    coupon_id:      coupon.id,
    promo_code:     promo.code,
    promo_active:   promo.active,
    percent_off:    coupon.percent_off,
    max_uses:       coupon.max_redemptions,
    times_redeemed: coupon.times_redeemed,
  });
}

// ONE-TIME USE — create a 100% off coupon in live Stripe for testing.
// Hit GET /api/admin/create-coupon?secret=adg2026 once to create it, then this file can be deleted.
import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.query.secret !== 'adg2026') {
    return res.status(403).json({ error: 'forbidden' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    // Create a 100% off, single-use coupon
    const coupon = await stripe.coupons.create({
      percent_off:  100,
      duration:     'once',
      name:         'ADG Internal Test — 100% Off',
      id:           'ADG-TEST-100',
      max_redemptions: 10,   // limits to 10 uses so it can't leak into prod
    });

    // Also create a promotion code so it's usable at checkout
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code:   'ADGTEST100',
      active: true,
    });

    return res.status(200).json({
      message:       'Coupon + promo code created. Enter this at Stripe checkout.',
      coupon_id:     coupon.id,
      promo_code:    promo.code,
      percent_off:   coupon.percent_off,
      max_uses:      coupon.max_redemptions,
    });
  } catch (err) {
    // If coupon already exists, just fetch the promo code
    if (err.code === 'resource_already_exists') {
      return res.status(200).json({
        message:    'Coupon already exists.',
        promo_code: 'ADGTEST100',
        note:       'Use this code at Stripe checkout for 100% off.',
      });
    }
    return res.status(500).json({ error: err.message });
  }
}

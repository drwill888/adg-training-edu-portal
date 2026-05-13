// Resends a fresh Stripe payment link to an approved cohort applicant whose
// previous checkout session expired. Creates a new session and emails it.
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { Resend } from 'resend';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://5cblueprint.awakeningdestiny.global';

const TIER_CONFIG = {
  founders: {
    priceId: () => process.env.STRIPE_FOUNDERS_PRICE_ID,
    amount: '$997',
    label: 'Founders Cohort',
    cancelUrl: `${BASE_URL}/called-to-carry/founders/apply`,
  },
  sprint: {
    priceId: () => process.env.STRIPE_SPRINT_PRICE_ID,
    amount: '$497',
    label: '21-Day Sprint',
    cancelUrl: `${BASE_URL}/called-to-carry/sprint/apply`,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { data: { session: adminSession } } = await supabase.auth.getSession();
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');
  if (token) {
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user || user.email?.toLowerCase() !== 'meier.will@gmail.com') {
      return res.status(403).json({ error: 'Not authorized' });
    }
  }

  const { applicationId } = req.body;
  if (!applicationId) return res.status(400).json({ error: 'applicationId required' });

  const { data: app, error } = await supabase
    .from('cohort_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (error || !app) return res.status(404).json({ error: 'Application not found' });
  if (app.status !== 'approved') return res.status(400).json({ error: 'Application is not approved' });

  const config = TIER_CONFIG[app.tier];
  if (!config) return res.status(400).json({ error: `Unknown tier: ${app.tier}` });

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60),
      mode: 'payment',
      customer_email: app.email,
      line_items: [{ price: config.priceId(), quantity: 1 }],
      metadata: { application_id: app.id, tier: app.tier },
      allow_promotion_codes: true,
      success_url: `${BASE_URL}/dashboard`,
      cancel_url: config.cancelUrl,
    });

    await supabase
      .from('cohort_applications')
      .update({ stripe_session_id: session.id })
      .eq('id', app.id);

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'will@awakeningdestiny.global',
      to: app.email,
      subject: `Your enrollment link has been refreshed — ${config.label}`,
      html: `
        <div style="background:#021A35;color:#FDF8F0;font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:3rem 2rem;">
          <p style="color:#C8A951;text-transform:uppercase;letter-spacing:0.15em;font-size:0.75rem;">${config.label} · Fresh Link</p>
          <h1 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400;color:#FDF8F0;">${app.first_name}, here's your new enrollment link.</h1>
          <p style="color:rgba(253,248,240,0.85);line-height:1.75;">Your previous payment link expired. Here's a fresh one — good for the next 24 hours.</p>
          <div style="margin:2rem 0;text-align:center;">
            <a href="${session.url}" style="display:inline-block;background:#C8A951;color:#021A35;padding:16px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;">Complete Enrollment — ${config.amount} →</a>
          </div>
          <p style="color:rgba(253,248,240,0.5);font-size:0.8rem;text-align:center;margin-top:0.5rem;">⚠️ This payment link expires in 24 hours.</p>
          <p style="color:rgba(253,248,240,0.6);font-size:0.85rem;">After payment, you'll receive a separate welcome email with one-click access to your portal.</p>
          <p style="color:#C8A951;margin-top:2rem;">— Will, Founder · Awakening Destiny Global</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true, email: app.email });
  } catch (err) {
    console.error('Resend payment link error:', err);
    return res.status(500).json({ error: err.message || 'Failed to resend' });
  }
}

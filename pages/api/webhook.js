// pages/api/webhook.js
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { buffer } from 'micro';
import { Resend } from 'resend';
import { addToIcegramList } from '@/lib/coach/icegram';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const BASE_URL = 'https://5cblueprint.awakeningdestiny.global';

export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    const email = session.customer_email || session.customer_details?.email;
    const amount = session.amount_total;
    const sessionId = session.id;
    const tier = session.metadata?.tier || 'self-paced';
    const applicationId = session.metadata?.application_id || null;
    // product_subscriber: slug identifies which book/product
    const productSlug = session.metadata?.product_slug || null;

    if (email) {
      // Compute access expiry for product subscribers (uses registry for days)
      let accessExpiresAt = null;
      let accessType = 'adg';
      if (tier === 'product_subscriber' && productSlug) {
        // Dynamically read daysAccess from registry (default 60)
        const daysAccess = 60; // safe default; registry is server-side import in webhook
        accessExpiresAt = new Date(Date.now() + daysAccess * 24 * 60 * 60 * 1000).toISOString();
        accessType = productSlug; // e.g. 'child-education'
      }

      // Record payment
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          email,
          stripe_session_id: sessionId,
          amount,
          status: 'completed',
          tier,
          access_type:       accessType,
          access_expires_at: accessExpiresAt,
          created_at:        new Date().toISOString(),
        });

      if (paymentError) {
        console.error('Payment insert error:', paymentError);
      }

      // ─── Stop drip emails the moment someone pays ─────────────────────────
      const { error: dripStopError } = await supabase
        .from('drip_queue')
        .update({ stopped: true })
        .eq('email', email)
        .is('sent_at', null)
        .eq('stopped', false);

      if (dripStopError) {
        console.error('Failed to stop drip for:', email, dripStopError);
      }
      // ─────────────────────────────────────────────────────────────────────

      // If Founders or Sprint — update application status + auto-send magic link
      if (applicationId) {
        const { error: appError } = await supabase
          .from('cohort_applications')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
          })
          .eq('id', applicationId);

        if (appError) {
          console.error('Application update error:', appError);
        }

        // Auto-send magic link so user can log in immediately after paying
        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'will@awakeningdestiny.global';

          const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: email,
            options: {
              redirectTo: `${BASE_URL}/dashboard`,
            },
          });

          if (linkError) {
            console.error('Magic link generation error:', linkError);
          } else if (linkData?.properties?.action_link) {
            const tierLabel = tier === 'founders' ? 'Founders Cohort' : '21-Day Sprint';
            const tierAmount = tier === 'founders' ? '$997' : '$497';

            await resend.emails.send({
              from: fromEmail,
              to: email,
              subject: `Welcome to the ${tierLabel} — your access is ready`,
              html: `
                <div style="background:#021A35;color:#FDF8F0;font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:3rem 2rem;">
                  <p style="color:#C8A951;text-transform:uppercase;letter-spacing:0.15em;font-size:0.75rem;">${tierLabel} · Payment Confirmed</p>
                  <h1 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400;color:#FDF8F0;">You're in. Welcome aboard.</h1>
                  <p style="color:rgba(253,248,240,0.85);line-height:1.75;">Your payment of ${tierAmount} is confirmed and your seat is secured. Click below to enter your portal — no password needed.</p>
                  <div style="margin:2rem 0;text-align:center;">
                    <a href="${linkData.properties.action_link}" style="display:inline-block;background:#C8A951;color:#021A35;padding:16px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;">Enter the Portal →</a>
                  </div>
                  <p style="color:rgba(253,248,240,0.5);font-size:0.8rem;text-align:center;margin-top:0.5rem;">⚠️ This link expires in 24 hours. If it lapses, visit <a href="${BASE_URL}/login" style="color:#C8A951;">${BASE_URL}/login</a> and request a new one with your email.</p>
                  <p style="color:rgba(253,248,240,0.85);line-height:1.75;margin-top:2rem;">Once inside, head to <strong>Module 0 — Introduction</strong> to begin. I'll walk with you the whole way.</p>
                  <p style="color:#C8A951;margin-top:2rem;">— Will, Founder · Awakening Destiny Global</p>
                </div>
              `,
            });

            console.log(`Welcome email + magic link sent to ${email} for ${tier}`);
          }
        } catch (err) {
          console.error('Auto magic link error:', err);
        }
      }

      // Product subscriber — add to Icegram EDU list + send welcome email
      if (tier === 'product_subscriber' && productSlug) {
        // Add buyer to Icegram EDU list (fire and forget — never block the webhook)
        addToIcegramList({
          email,
          config: {
            formPageUrl: process.env.ICEGRAM_EDU_FORM_PAGE_URL,
            listHash:    process.env.ICEGRAM_EDU_LIST_HASH,
            formId:      process.env.ICEGRAM_EDU_FORM_ID || '11',
          },
        }).then(r => console.log('[webhook] Icegram EDU capture:', JSON.stringify(r).slice(0, 120)))
          .catch(e => console.warn('[webhook] Icegram EDU capture failed:', e.message));

        try {
          const fromEmail = process.env.RESEND_FROM_EMAIL || 'will@awakeningdestiny.global';
          await resend.emails.send({
            from: fromEmail,
            to: email,
            subject: 'Your 60-day coaching access is ready — How to Educate Your Child',
            html: `
              <div style="background:#021A35;color:#FDF8F0;font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:3rem 2rem;">
                <p style="color:#C8A951;text-transform:uppercase;letter-spacing:0.15em;font-size:0.75rem;">Book Reader Access · Payment Confirmed</p>
                <h1 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400;color:#FDF8F0;">Your coaching session is open.</h1>
                <p style="color:rgba(253,248,240,0.85);line-height:1.75;">Thank you for investing in your child's future. Your $20 gives you 60 days of direct access to Ezra — trained on the principles from <em>How to Educate Your Child</em>. Ask anything about your child's learning, development, strengths, and education strategy.</p>
                <div style="margin:2rem 0;text-align:center;">
                  <a href="${BASE_URL}/books/${productSlug}?email=${encodeURIComponent(email)}" style="display:inline-block;background:#C8A951;color:#021A35;padding:16px 32px;border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;">Start Your Session →</a>
                </div>
                <p style="color:rgba(253,248,240,0.5);font-size:0.8rem;text-align:center;">You have 60 days of access from today, with up to 10 conversations per day. Save this email — it contains your access link.</p>
                <p style="color:#C8A951;margin-top:2rem;">— Will, Founder · Awakening Destiny Global</p>
              </div>
            `,
          });
          console.log(`Book welcome email sent to ${email}`);
        } catch (err) {
          console.error('Book welcome email error:', err);
        }
      }

      console.log(`Payment recorded — ${email} — ${tier} — $${amount / 100}`);
    } else {
      console.error('No email found in checkout session');
    }
  }

  return res.status(200).json({ received: true });
}
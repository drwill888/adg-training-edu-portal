// pages/api/called-to-carry/founders/apply.js
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const resend = new Resend(process.env.RESEND_API_KEY);

const BASE_URL = 'https://5cblueprint.awakeningdestiny.global';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, email, phone, archetype, why, building, referral, smsConsent } = req.body;

  if (!firstName || !lastName || !email || !phone || !why) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'meier.will@gmail.com';
  const approvalToken = crypto.randomUUID();

  const { data: app, error } = await supabase
    .from('cohort_applications')
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      archetype: archetype || null,
      why_now: why,
      business_or_ministry: building || null,
      sms_consent: Boolean(smsConsent),
      sms_consent_timestamp: smsConsent ? new Date().toISOString() : null,
      status: 'pending',
      tier: 'founders',
      approval_token: approvalToken,
    })
    .select()
    .single();

  if (error) {
    console.error('Supabase error:', error);
    return res.status(500).json({ error: 'Failed to save application.' });
  }

  const approveUrl = `${BASE_URL}/api/called-to-carry/founders/approve?token=${approvalToken}`;

  try {
    await resend.emails.send({
      from: fromEmail,
      to: 'meier.will@gmail.com',
      replyTo: email,
      subject: `New Founders Cohort application: ${firstName} ${lastName}`,
      html: `
        <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;padding:2rem;background:#FDF8F0;color:#021A35;">
          <p style="font-size:0.78rem;letter-spacing:0.15em;text-transform:uppercase;color:#C8A951;font-weight:600;">New Application · Founders Cohort</p>
          <h1 style="font-family:'Cormorant Garamond',serif;font-size:1.6rem;font-weight:600;">${firstName} ${lastName}</h1>
          <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <p><strong>Phone:</strong> ${phone}</p>
          ${archetype ? `<p><strong>Archetype:</strong> ${archetype}</p>` : ''}
          ${building ? `<p><strong>Building:</strong> ${building}</p>` : ''}
          <hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0;"/>
          <p><strong>Why now:</strong></p>
          <p style="line-height:1.7;">${why}</p>
          <hr style="border:none;border-top:1px solid #ddd;margin:1.5rem 0;"/>
          <a href="${approveUrl}" style="display:inline-block;background:#021A35;color:#C8A951;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:1rem;">
            ✓ Approve &amp; Send Payment Link
          </a>
          <p style="font-size:0.78rem;color:#666;margin-top:1rem;">Clicking approve will automatically send ${firstName} a Stripe payment link for $997.</p>
          <p style="margin-top:1rem;word-break:break-all;font-size:0.85rem;">Or copy this link: <a href="${approveUrl}">${approveUrl}</a></p>
        </div>
      `,
    });

    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your Founders Cohort application is received',
      html: `
        <div style="background:#021A35;color:#FDF8F0;font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:3rem 2rem;">
          <p style="color:#C8A951;text-transform:uppercase;letter-spacing:0.15em;font-size:0.75rem;">Founders Cohort · Application Received</p>
          <h1 style="font-family:'Cormorant Garamond',serif;font-size:2rem;font-weight:400;color:#FDF8F0;">${firstName}, your application has been received.</h1>
          <p style="color:rgba(253,248,240,0.85);line-height:1.75;">Will reviews every application personally — usually within 48 hours. He will reach out to confirm fit and next steps.</p>
          <p style="color:rgba(253,248,240,0.85);line-height:1.75;">No payment is collected at this step. Enrollment is finalized after Will confirms your seat.</p>
          <p style="color:#C8A951;margin-top:2rem;">— Will, Founder · Awakening Destiny Global</p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Founders application error:', err);
    return res.status(500).json({ error: 'Could not submit application. Please try again.' });
  }
}
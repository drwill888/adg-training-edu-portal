// pages/api/send-magic-link.js
import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email, name } = req.body
  if (!email || !name) return res.status(400).json({ error: 'Email and name required' })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const resendApiKey = process.env.RESEND_API_KEY
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://5cblueprint.awakeningdestiny.global'

  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase service role key missing' })
  }
  if (!resendApiKey) {
    return res.status(500).json({ error: 'Resend API key missing' })
  }

  // Use admin client to generate magic link
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
      data: { full_name: name },
    },
  })

  if (error) {
    console.error('Generate link error:', error)
    return res.status(400).json({ error: error.message })
  }

  const magicLink = data?.properties?.action_link
  if (!magicLink) {
    return res.status(500).json({ error: 'Failed to generate magic link' })
  }

  // Send email via Resend API directly
  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${resendApiKey}`,
    },
    body: JSON.stringify({
      from: 'Awakening Destiny Global <noreply@awakeningdestiny.global>',
      to: [email],
      subject: 'Your sign-in link — 5C Leadership Blueprint',
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a;">
          <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="color: #021A35; font-size: 22px; margin: 0 0 4px;">5C Leadership Blueprint</h1>
            <p style="color: #C8A951; font-size: 13px; margin: 0; font-style: italic;">Awakening Destiny Global</p>
          </div>
          <p style="font-size: 15px; line-height: 1.7;">Hi ${name},</p>
          <p style="font-size: 15px; line-height: 1.7;">Click the button below to sign in to your 5C Leadership Blueprint account. This link expires in 1 hour.</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${magicLink}" style="display: inline-block; padding: 14px 36px; background: #021A35; color: #FDD20D; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 700; letter-spacing: 0.02em;">Sign In to Your Dashboard →</a>
          </div>
          <p style="font-size: 13px; color: #888; line-height: 1.6;">If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
          <p style="font-size: 11px; color: #aaa; text-align: center;">© Awakening Destiny Global · awakeningdestiny.global</p>
        </div>
      `,
    }),
  })

  if (!emailRes.ok) {
    const emailError = await emailRes.json()
    console.error('Resend error:', emailError)
    return res.status(500).json({ error: 'Failed to send email: ' + (emailError.message || JSON.stringify(emailError)) })
  }

  return res.status(200).json({ success: true })
}

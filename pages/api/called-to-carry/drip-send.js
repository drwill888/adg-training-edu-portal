// pages/api/called-to-carry/drip-send.js
// Called daily by Vercel Cron at 8 AM ET
// Sends any drip_queue rows due today, then marks them sent

import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { signToken } from '../../../lib/called-to-carry/auth/tokens';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.RESEND_FROM_EMAIL || 'Will @ ADG <will@awakeningdestiny.global>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;

export default async function handler(req, res) {
  // Protect endpoint — Vercel sends the CRON_SECRET automatically
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });const SITE_URL = 'https://5cblueprint.awakeningdestiny.global';
  }

  const today = new Date().toISOString().split('T')[0];

  // Fetch all unsent, unstopped emails due today or earlier
  const { data: dueEmails, error } = await supabase
    .from('drip_queue')
    .select('*')
    .lte('scheduled_for', today)
    .is('sent_at', null)
    .eq('stopped', false);

  if (error) {
    console.error('Drip queue fetch error:', error);
    return res.status(500).json({ error: 'Failed to fetch drip queue' });
  }

  if (!dueEmails || dueEmails.length === 0) {
    return res.status(200).json({ sent: 0, message: 'No emails due today' });
  }

  let sentCount = 0;
  const errors = [];

  for (const row of dueEmails) {
    const { id, email, first_name: firstName, archetype_name: archetypeName, email_number: emailNumber } = row;
    const journeyUrl = `${SITE_URL}/called-to-carry`;

    try {
      const unsubscribeUrl = `${SITE_URL}/api/called-to-carry/drip-unsubscribe?email=${encodeURIComponent(email)}&token=${signToken(email)}`;
      const { subject, html } = buildEmail({ emailNumber, firstName, archetypeName, journeyUrl, unsubscribeUrl });

      await resend.emails.send({ from: FROM, to: email, subject, html });

      await supabase
        .from('drip_queue')
        .update({ sent_at: new Date().toISOString() })
        .eq('id', id);

      sentCount++;
    } catch (err) {
      console.error(`Failed email ${emailNumber} to ${email}:`, err);
      errors.push({ id, email, emailNumber, error: err.message });
    }
  }

  return res.status(200).json({ sent: sentCount, errors });
}

// ─── Router ───────────────────────────────────────────────────────────────────
function buildEmail({ emailNumber, firstName, archetypeName, journeyUrl, unsubscribeUrl }) {
  switch (emailNumber) {
    case 2: return emailTwo({ firstName, archetypeName, journeyUrl, unsubscribeUrl });
    case 3: return emailThree({ firstName, archetypeName, journeyUrl, unsubscribeUrl });
    case 4: return emailFour({ firstName, archetypeName, journeyUrl, unsubscribeUrl });
    default: throw new Error(`Unknown email number: ${emailNumber}`);
  }
}

// ─── Shared helpers ───────────────────────────────────────────────────────────
function emailWrapper(content, unsubscribeUrl) {
  return `
    <div style="background:#021A35;color:#FDF8F0;font-family:'Georgia',serif;max-width:600px;margin:0 auto;padding:3rem 2rem;">
      <p style="font-size:0.75rem;letter-spacing:0.18em;text-transform:uppercase;color:#C8A951;margin:0 0 2rem;">
        Called to Carry · Awakening Destiny Global
      </p>
      ${content}
      <hr style="border:none;border-top:1px solid rgba(200,169,81,0.2);margin:3rem 0 1.5rem;" />
      <p style="font-size:0.9rem;color:#C8A951;margin:0 0 0.5rem;">— Will Meier, Founder · Awakening Destiny Global</p>
      <p style="font-size:0.72rem;color:rgba(253,248,240,0.3);margin:0.5rem 0 0;">
        © ${new Date().getFullYear()} Awakening Destiny Global · You received this because you completed the Called to Carry assessment.<br/>
        Awakening Destiny Global · PO Box 9203 · Bolton, CT 06043<br/>
        <a href="${unsubscribeUrl}" style="color:rgba(200,169,81,0.5);text-decoration:underline;">Unsubscribe</a>
      </p>
    </div>
  `;
}

function ctaButton(href, label) {
  return `
    <a href="${href}"
       style="display:inline-block;background:#C8A951;color:#021A35;font-family:sans-serif;font-weight:700;font-size:0.85rem;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:0.9rem 2rem;margin:1.5rem 0;">
      ${label}
    </a>
  `;
}

function bodyText(text) {
  return `<p style="font-size:1rem;font-weight:300;color:rgba(253,248,240,0.85);line-height:1.85;margin:1rem 0;">${text}</p>`;
}

function heading(text) {
  return `<h1 style="font-size:1.85rem;font-weight:400;line-height:1.3;color:#FDF8F0;margin:0 0 1rem;">${text}</h1>`;
}

function scripture(text) {
  return `<p style="font-size:0.95rem;font-style:italic;color:#C8A951;border-left:2px solid #C8A951;padding-left:1rem;margin:1.5rem 0;">${text}</p>`;
}

function divider() {
  return `<hr style="border:none;border-top:1px solid rgba(200,169,81,0.15);margin:1.5rem 0;" />`;
}

// ─── Email 2 — Day 3 ──────────────────────────────────────────────────────────
function emailTwo({ firstName, archetypeName, journeyUrl, unsubscribeUrl }) {
  return {
    subject: `${firstName}, your archetype has an assignment.`,
    html: emailWrapper(`
      ${heading(`${firstName}, your archetype has an assignment.`)}
      ${bodyText(`Three days ago, you discovered you're a <em style="color:#C8A951;">${archetypeName}</em>.`)}
      ${bodyText(`Most people spend their entire lives performing a role that was never built for them. They're capable. They're even gifted. But they're carrying the wrong weight.`)}
      ${scripture(`The Greek word <em>phortion</em> — translated "burden" in Matthew 11 — doesn't mean something heavy and crushing. It means a soldier's pack. A specific load assigned to a specific person for a specific mission.`)}
      ${bodyText(`Your archetype is the shape of your <em>phortion.</em>`)}
      ${bodyText(`And a <em style="color:#C8A951;">${archetypeName}</em> carries something the Body cannot afford to lose.`)}
      ${divider()}
      ${bodyText(`The 5C Leadership Blueprint is how we map it — five dimensions that form the architecture of your calling:`)}
      <ul style="font-size:1rem;color:rgba(253,248,240,0.85);line-height:2;padding-left:1.5rem;margin:1rem 0;">
        <li><strong style="color:#C8A951;">Calling</strong> — the load-bearing center of everything</li>
        <li><strong style="color:#C8A951;">Connection</strong> — the relational authority that multiplies your reach</li>
        <li><strong style="color:#C8A951;">Competency</strong> — the refined capacity that makes your grace trustworthy</li>
        <li><strong style="color:#C8A951;">Capacity</strong> — the internal strength that sustains the weight you carry</li>
        <li><strong style="color:#C8A951;">Convergence</strong> — the moment everything aligns for deployment</li>
      </ul>
      ${bodyText(`This isn't content. It's formation. And formation isn't something you consume — it's something you walk through.`)}
      ${ctaButton(journeyUrl, 'Begin Called to Carry →')}
      ${bodyText(`Three tiers. One destination. Commissioning.`)}
    `, unsubscribeUrl),
  };
}

// ─── Email 3 — Day 7 ──────────────────────────────────────────────────────────
function emailThree({ firstName, archetypeName, journeyUrl, unsubscribeUrl }) {
  return {
    subject: `The most dangerous thing a called person can do.`,
    html: emailWrapper(`
      ${heading(`The most dangerous thing a called person can do.`)}
      ${bodyText(`${firstName}, it's been a week since you took the assessment.`)}
      ${bodyText(`I'm not writing to pressure you. I'm writing because I've seen what happens to people who get a glimpse of their assignment — and walk away from it.`)}
      ${bodyText(`Not because they were unwilling. Because they were <em>waiting.</em>`)}
      ${bodyText(`Waiting for the right time. Waiting until they felt ready. Waiting until the circumstances shifted, the finances lined up, the opposition quieted down.`)}
      ${bodyText(`And the years passed.`)}
      ${scripture(`"Whether you turn to the right or to the left, your ears will hear a voice behind you, saying, 'This is the way; walk in it.'" — Isaiah 30:21`)}
      ${bodyText(`Notice — He doesn't say stand in it. Study it. Admire it. <strong style="color:#FDF8F0;">Walk.</strong>`)}
      ${bodyText(`A <em style="color:#C8A951;">${archetypeName}</em> is not designed to be perpetually in preparation. You were built to move — with weight on your shoulders and clarity in your chest.`)}
      ${divider()}
      ${bodyText(`The Called to Carry journey doesn't give you more information about your calling. It gives you the formation to <strong style="color:#FDF8F0;">step into it.</strong>`)}
      <table style="width:100%;border-collapse:collapse;margin:1.5rem 0;">
        <tr>
          <td style="padding:1rem;border:1px solid rgba(200,169,81,0.3);vertical-align:top;">
            <p style="color:#C8A951;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 0.5rem;">Self-Paced</p>
            <p style="color:#FDF8F0;font-size:1.5rem;margin:0 0 0.5rem;">$149</p>
            <p style="color:rgba(253,248,240,0.7);font-size:0.85rem;margin:0;">Start today. Go at your pace. Complete when you're ready.</p>
          </td>
          <td style="padding:1rem;border:1px solid rgba(200,169,81,0.3);vertical-align:top;">
            <p style="color:#C8A951;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 0.5rem;">21-Day Sprint</p>
            <p style="color:#FDF8F0;font-size:1.5rem;margin:0 0 0.5rem;">$497</p>
            <p style="color:rgba(253,248,240,0.7);font-size:0.85rem;margin:0;">21 days live with Will. Application required. Seats limited.</p>
          </td>
          <td style="padding:1rem;border:1px solid rgba(200,169,81,0.3);vertical-align:top;">
            <p style="color:#C8A951;font-size:0.75rem;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 0.5rem;">Founders Cohort</p>
            <p style="color:#FDF8F0;font-size:1.5rem;margin:0 0 0.5rem;">$997</p>
            <p style="color:rgba(253,248,240,0.7);font-size:0.85rem;margin:0;">8 weeks. Covenant community. Will reviews every application personally.</p>
          </td>
        </tr>
      </table>
      ${ctaButton(journeyUrl, 'Choose Your Path →')}
      ${bodyText(`Don't let another week pass as a <em style="color:#C8A951;">${archetypeName}</em> who hasn't been commissioned yet.`)}
    `, unsubscribeUrl),
  };
}

// ─── Email 4 — Day 14 ─────────────────────────────────────────────────────────
function emailFour({ firstName, archetypeName, journeyUrl, unsubscribeUrl }) {
  return {
    subject: `${firstName}, I want to say this directly.`,
    html: emailWrapper(`
      ${heading(`${firstName}, I want to say this directly.`)}
      ${bodyText(`Two weeks ago you took the 10-Q.`)}
      ${bodyText(`You found out you're a <em style="color:#C8A951;">${archetypeName}.</em>`)}
      ${bodyText(`And you haven't moved yet.`)}
      ${bodyText(`I'm not writing to shame you — I've sat in that same seat. Knowing what I carried, but not yet sure the ground beneath me was solid enough to step onto.`)}
      ${bodyText(`But I've been in ministry and marketplace leadership for over forty years. And if I've learned anything, it's this:`)}
      ${scripture(`The ground doesn't solidify before you step. It solidifies <em>under your feet</em> as you walk.`)}
      ${bodyText(`The assignment doesn't wait until you're ready. Readiness is forged in the walking.`)}
      ${divider()}
      ${bodyText(`This is the last email I'll send you about Called to Carry.`)}
      ${bodyText(`Not because I'm giving up on you — but because I honor your agency. You're a leader. You get to decide.`)}
      ${bodyText(`If you're ready to move — to stop being a <em style="color:#C8A951;">${archetypeName}</em> in concept and become one in commission — here's the door:`)}
      ${ctaButton(journeyUrl, 'Enter the Journey →')}
      ${bodyText(`If the Founders Cohort is on your heart and you want to talk first — reply to this email. I personally read my replies.`)}
      ${bodyText(`And if this season isn't the moment, that's between you and the Lord. But don't let the weight you were assigned sit unclaimed because you were waiting to feel worthy of it.`)}
      <p style="font-size:1.1rem;font-style:italic;color:#C8A951;margin:2rem 0 0.5rem;">You were called before you felt called.</p>
      ${bodyText(`Walk in it.`)}
    `, unsubscribeUrl),
  };
}
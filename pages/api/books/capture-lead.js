// pages/api/books/capture-lead.js
// Captures first name, last name, email before PDF download.
// Adds them to the Icegram Edu list using the same form-scraping
// method as the main Ezra coach capture.
// POST { firstName, lastName, email }

import { createClient } from '@supabase/supabase-js';

const FORM_PAGE_URL = process.env.ICEGRAM_EDU_FORM_PAGE_URL;
const LIST_HASH     = process.env.ICEGRAM_EDU_LIST_HASH;
const FORM_ID       = process.env.ICEGRAM_EDU_FORM_ID || '11';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Always save to Supabase so no lead is ever lost
async function saveLeadToSupabase({ email, firstName, lastName }) {
  try {
    await supabase.from('book_leads').upsert(
      { email, first_name: firstName, last_name: lastName, source: 'diagnostic-download' },
      { onConflict: 'email' }
    );
  } catch (err) {
    console.warn('[edu-capture] supabase lead save failed:', err.message);
  }
}

function getAjaxUrl() {
  if (!FORM_PAGE_URL) return null;
  const url = new URL(FORM_PAGE_URL);
  return `${url.protocol}//${url.host}/wp-admin/admin-ajax.php`;
}

async function fetchNonce() {
  const res = await fetch(FORM_PAGE_URL, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
    },
  });
  if (!res.ok) throw new Error(`form page fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const formIdentifier = html.match(/name="esfpx_es_form_identifier"\s+value="([^"]+)"/)?.[1];
  const nonce          = html.match(/name="esfpx_es-subscribe"[^>]*value="([^"]+)"/)?.[1];

  // Extended nonce patterns — different plugin versions use different names
  const nonceAlt = nonce
    || html.match(/["']esfpx_es-subscribe["']\s*:\s*["']([^"']+)["']/)?.[1]
    || html.match(/es-subscribe[_-]nonce["']\s*[,:]\s*["']([^"']+)["']/)?.[1];

  console.log('[edu-capture] nonce found:', !!nonceAlt, '| formId:', formIdentifier, '| html len:', html.length);
  if (!nonceAlt) throw new Error('could not find nonce on form page — check ICEGRAM_EDU_FORM_PAGE_URL content');
  return { nonce: nonceAlt, formIdentifier };
}

async function addToEduList({ email, firstName, lastName }) {
  if (!FORM_PAGE_URL || !LIST_HASH) {
    console.warn('[edu-capture] env vars not set — skipping Icegram');
    return { ok: false, reason: 'not_configured' };
  }

  const { nonce, formIdentifier } = await fetchNonce();
  const body = new URLSearchParams();
  body.append('es', 'subscribe');
  body.append('esfpx_email', email);
  body.append('esfpx_name', [firstName, lastName].filter(Boolean).join(' '));
  if (firstName) body.append('esfpx_first_name', firstName);
  if (lastName)  body.append('esfpx_last_name', lastName);
  body.append('esfpx_lists[]', LIST_HASH);
  body.append('esfpx_form_id', FORM_ID);
  body.append('esfpx_es_form_identifier', formIdentifier || `f${FORM_ID}-n1`);
  body.append('esfpx_status', 'Unconfirmed');
  body.append('esfpx_es-subscribe', nonce);
  body.append('esfpx_es_hp_email', '');
  body.append('es_gdpr_consent', 'true');

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent': 'Mozilla/5.0 (compatible; ADGEzraEdu/1.0)',
    Referer: FORM_PAGE_URL,
  };

  const ajaxUrl = getAjaxUrl();
  const attempts = [
    { url: `${ajaxUrl}?action=es_subscribe` },
    { url: `${ajaxUrl}?action=es_add_subscriber_from_request` },
    { url: FORM_PAGE_URL },
  ];

  for (const attempt of attempts) {
    const res  = await fetch(attempt.url, { method: 'POST', headers, body: body.toString(), redirect: 'manual' });
    const text = (await res.text()).trim();
    const ok   = res.ok && text !== '0' && text !== '-1' && !/rest_forbidden|invalid|error/i.test(text.slice(0, 200));
    console.log('[edu-capture]', attempt.url, res.status, text.slice(0, 80));
    if (ok) return { ok: true };
  }
  return { ok: false, reason: 'all_attempts_failed' };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const fn = (firstName || '').trim();
  const ln = (lastName  || '').trim();

  // Always save to Supabase first (never lose a lead)
  await saveLeadToSupabase({ email: normalizedEmail, firstName: fn, lastName: ln });

  try {
    const result = await addToEduList({ email: normalizedEmail, firstName: fn, lastName: ln });
    return res.status(200).json({ ok: true, icegram: result });
  } catch (err) {
    console.error('[edu-capture] error:', err.message);
    // Never block the download — return ok even if Icegram fails
    return res.status(200).json({ ok: true, icegram: { ok: false, error: err.message } });
  }
}

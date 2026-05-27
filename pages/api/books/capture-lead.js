// pages/api/books/capture-lead.js
// Captures first name, last name, email before PDF download.
// Strategy (in order):
//   1. WordPress REST API with Application Password (most reliable, no nonce)
//   2. Nonce-scrape + admin-ajax.php (fallback)
//   3. Supabase book_leads table (always — so no lead is ever lost)
// POST { firstName, lastName, email }

import { createClient } from '@supabase/supabase-js';

const FORM_PAGE_URL  = process.env.ICEGRAM_EDU_FORM_PAGE_URL;
const LIST_HASH      = process.env.ICEGRAM_EDU_LIST_HASH;
const FORM_ID        = process.env.ICEGRAM_EDU_FORM_ID || '11';
const WP_REST_USER   = process.env.WP_REST_USER;          // WordPress username
const WP_REST_PASS   = process.env.WP_REST_APP_PASSWORD;  // WordPress Application Password

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── 1. Always save to Supabase ────────────────────────────────────────────────
async function saveLeadToSupabase({ email, firstName, lastName }) {
  try {
    await supabase.from('book_leads').upsert(
      { email, first_name: firstName, last_name: lastName, source: 'diagnostic-download' },
      { onConflict: 'email' }
    );
    console.log('[edu-capture] supabase saved:', email);
  } catch (err) {
    console.warn('[edu-capture] supabase save failed:', err.message);
  }
}

// ── 2. WordPress REST API (no nonce required) ─────────────────────────────────
async function subscribeViaRestAPI({ email, firstName, lastName }) {
  if (!FORM_PAGE_URL || !LIST_HASH || !WP_REST_USER || !WP_REST_PASS) return false;

  try {
    const url      = new URL(FORM_PAGE_URL);
    const baseUrl  = `${url.protocol}//${url.host}`;
    const creds    = Buffer.from(`${WP_REST_USER}:${WP_REST_PASS}`).toString('base64');

    // Email Subscribers & Newsletters REST endpoint
    const res = await fetch(`${baseUrl}/wp-json/email-subscribers/v1/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${creds}`,
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name:  lastName,
        status:     'Subscribed',
        list_ids:   [LIST_HASH],
      }),
    });

    const text = await res.text();
    console.log('[edu-capture] REST API:', res.status, text.slice(0, 150));
    if (res.ok) return true;

    // Some ES versions use a different body format — try with "lists" key
    const res2 = await fetch(`${baseUrl}/wp-json/email-subscribers/v1/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${creds}`,
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name:  lastName,
        status:     'Subscribed',
        lists:      [LIST_HASH],
      }),
    });
    const text2 = await res2.text();
    console.log('[edu-capture] REST API v2:', res2.status, text2.slice(0, 150));
    return res2.ok;
  } catch (err) {
    console.warn('[edu-capture] REST API error:', err.message);
    return false;
  }
}

// ── 3. Nonce-scrape fallback ──────────────────────────────────────────────────
function getAjaxUrl() {
  if (!FORM_PAGE_URL) return null;
  const url = new URL(FORM_PAGE_URL);
  return `${url.protocol}//${url.host}/wp-admin/admin-ajax.php`;
}

async function fetchNonce() {
  const res = await fetch(FORM_PAGE_URL, {
    redirect: 'follow',
    headers: {
      'User-Agent':               'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':                   'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language':          'en-US,en;q=0.9',
      'Cache-Control':            'no-cache',
      'Pragma':                   'no-cache',
      'Upgrade-Insecure-Requests':'1',
    },
  });
  if (!res.ok) throw new Error(`form page fetch failed: ${res.status} ${res.statusText}`);
  const html = await res.text();

  const formIdentifier = html.match(/name="esfpx_es_form_identifier"\s+value="([^"]+)"/)?.[1];
  const nonce =
    html.match(/name="esfpx_es-subscribe"[^>]*value="([^"]+)"/)?.[1] ||
    html.match(/["']esfpx_es-subscribe["']\s*:\s*["']([^"']+)["']/)?.[1] ||
    html.match(/es-subscribe[_-]nonce["']\s*[,:]\s*["']([^"']+)["']/)?.[1];

  console.log('[edu-capture] nonce found:', !!nonce, '| formId:', formIdentifier, '| html len:', html.length);
  if (!nonce) throw new Error('nonce not found on form page');
  return { nonce, formIdentifier };
}

async function subscribeViaNonce({ email, firstName, lastName }) {
  if (!FORM_PAGE_URL || !LIST_HASH) return false;

  const { nonce, formIdentifier } = await fetchNonce();
  const body = new URLSearchParams();
  body.append('es', 'subscribe');
  body.append('esfpx_email', email);
  body.append('esfpx_name', [firstName, lastName].filter(Boolean).join(' '));
  if (firstName) body.append('esfpx_first_name', firstName);
  if (lastName)  body.append('esfpx_last_name',  lastName);
  body.append('esfpx_lists[]', LIST_HASH);
  body.append('esfpx_form_id', FORM_ID);
  body.append('esfpx_es_form_identifier', formIdentifier || `f${FORM_ID}-n1`);
  body.append('esfpx_status', 'Unconfirmed');
  body.append('esfpx_es-subscribe', nonce);
  body.append('esfpx_es_hp_email', '');
  body.append('es_gdpr_consent', 'true');

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
    'User-Agent':   'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Referer':      FORM_PAGE_URL,
  };

  const ajaxUrl = getAjaxUrl();
  for (const url of [`${ajaxUrl}?action=es_subscribe`, `${ajaxUrl}?action=es_add_subscriber_from_request`, FORM_PAGE_URL]) {
    const res  = await fetch(url, { method: 'POST', headers, body: body.toString(), redirect: 'manual' });
    const text = (await res.text()).trim();
    const ok   = res.ok && text !== '0' && text !== '-1' && !/rest_forbidden|invalid|error/i.test(text.slice(0, 200));
    console.log('[edu-capture] nonce attempt', url, res.status, text.slice(0, 80));
    if (ok) return true;
  }
  return false;
}

// ── Handler ───────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const fn = (firstName || '').trim();
  const ln = (lastName  || '').trim();

  // Always save to Supabase first (insurance — never lose a lead)
  await saveLeadToSupabase({ email: normalizedEmail, firstName: fn, lastName: ln });

  // Try REST API first, then nonce fallback
  let icegramOk = false;
  try {
    icegramOk = await subscribeViaRestAPI({ email: normalizedEmail, firstName: fn, lastName: ln });
    if (!icegramOk) {
      console.log('[edu-capture] REST API did not succeed, trying nonce fallback');
      icegramOk = await subscribeViaNonce({ email: normalizedEmail, firstName: fn, lastName: ln });
    }
  } catch (err) {
    console.error('[edu-capture] all Icegram methods failed:', err.message);
  }

  console.log('[edu-capture] final result for', normalizedEmail, '— icegram:', icegramOk);
  return res.status(200).json({ ok: true, icegram: { ok: icegramOk } });
}

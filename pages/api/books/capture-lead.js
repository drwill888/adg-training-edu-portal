// pages/api/books/capture-lead.js
// Captures first name, last name, email before PDF download.
// Adds them to the Icegram Edu list using the same form-scraping
// method as the main Ezra coach capture.
// POST { firstName, lastName, email }

const FORM_PAGE_URL = process.env.ICEGRAM_EDU_FORM_PAGE_URL;
const LIST_HASH     = process.env.ICEGRAM_EDU_LIST_HASH;
const FORM_ID       = process.env.ICEGRAM_EDU_FORM_ID || '11';

function getAjaxUrl() {
  if (!FORM_PAGE_URL) return null;
  const url = new URL(FORM_PAGE_URL);
  return `${url.protocol}//${url.host}/wp-admin/admin-ajax.php`;
}

async function fetchNonce() {
  const res = await fetch(FORM_PAGE_URL, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ADGEzraEdu/1.0)' },
  });
  if (!res.ok) throw new Error(`form page fetch failed: ${res.status}`);
  const html = await res.text();

  const formIdentifier = html.match(/name="esfpx_es_form_identifier"\s+value="([^"]+)"/)?.[1];
  const nonce          = html.match(/name="esfpx_es-subscribe"[^>]*value="([^"]+)"/)?.[1];

  if (!nonce) throw new Error('could not find nonce on form page');
  return { nonce, formIdentifier };
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

  try {
    const result = await addToEduList({
      email: email.trim().toLowerCase(),
      firstName: (firstName || '').trim(),
      lastName:  (lastName  || '').trim(),
    });
    return res.status(200).json({ ok: true, icegram: result });
  } catch (err) {
    console.error('[edu-capture] error:', err.message);
    // Never block the download — return ok even if Icegram fails
    return res.status(200).json({ ok: true, icegram: { ok: false, error: err.message } });
  }
}

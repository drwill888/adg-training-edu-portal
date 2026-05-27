// pages/api/books/capture-lead.js
// Adds diagnostic template downloaders to Icegram Express (Ezra Edu list).
// Uses the same nonce-based form-submission method as lib/coach/icegram.js —
// no REST API auth needed, just the public form page + list hash.
// Also saves every lead to Supabase book_leads as a backup.
// POST { firstName, lastName, email }

import { createClient } from '@supabase/supabase-js';
import { addToIcegramList } from '@/lib/coach/icegram';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Edu list config — uses the dedicated EDU form (form 11) and its WordPress page.
const EDU_CONFIG = {
  formPageUrl: process.env.ICEGRAM_EDU_FORM_PAGE_URL,       // EDU form page (form 11)
  listHash:    process.env.ICEGRAM_EDU_LIST_HASH,            // EDU list hash
  formId:      process.env.ICEGRAM_EDU_FORM_ID || '11',     // EDU form ID
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const fn = (firstName || '').trim();
  const ln = (lastName  || '').trim();

  // ── 1. Always save to Supabase (never lose a lead) ────────────────────────
  try {
    await supabase.from('book_leads').upsert(
      { email: normalizedEmail, first_name: fn, last_name: ln, source: 'diagnostic-download' },
      { onConflict: 'email' }
    );
    console.log('[edu-capture] supabase saved:', normalizedEmail);
  } catch (err) {
    console.warn('[edu-capture] supabase save failed:', err.message);
  }

  // ── 2. Icegram via form submission (no API key needed) ────────────────────
  if (!EDU_CONFIG.formPageUrl || !EDU_CONFIG.listHash) {
    console.warn('[edu-capture] ICEGRAM_EDU_FORM_PAGE_URL or ICEGRAM_EDU_LIST_HASH not set — skipping Icegram. formPageUrl:', EDU_CONFIG.formPageUrl, 'listHash:', EDU_CONFIG.listHash ? 'set' : 'missing');
    return res.status(200).json({ ok: true, icegram: { ok: false, reason: 'not_configured' } });
  }

  try {
    const result = await addToIcegramList({
      email:     normalizedEmail,
      firstName: fn,
      lastName:  ln,
      config:    EDU_CONFIG,
    });

    console.log('[edu-capture] Icegram result:', JSON.stringify(result).slice(0, 200));
    return res.status(200).json({ ok: true, icegram: result });
  } catch (err) {
    console.error('[edu-capture] Icegram error:', err.message);
    return res.status(200).json({ ok: true, icegram: { ok: false, reason: 'error', detail: err.message } });
  }
}

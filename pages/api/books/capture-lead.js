// pages/api/books/capture-lead.js
// Adds diagnostic template downloaders to Icegram Express list.
// Mirrors pages/api/called-to-carry/capture-lead.js (the working one).
// Also saves every lead to Supabase book_leads as a backup.
// POST { firstName, lastName, email }

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = email.trim().toLowerCase();
  const fn = (firstName || '').trim();
  const ln = (lastName  || '').trim();

  // ── 1. Always save to Supabase (insurance — never lose a lead) ─────────────
  try {
    await supabase.from('book_leads').upsert(
      { email: normalizedEmail, first_name: fn, last_name: ln, source: 'diagnostic-download' },
      { onConflict: 'email' }
    );
    console.log('[edu-capture] supabase saved:', normalizedEmail);
  } catch (err) {
    console.warn('[edu-capture] supabase save failed:', err.message);
  }

  // ── 2. Icegram Express via WordPress REST API ──────────────────────────────
  const wpUrl  = process.env.WORDPRESS_URL;
  const wpUser = process.env.WP_APP_USER;
  const wpPass = process.env.WP_APP_PASSWORD;
  const listId = process.env.ICEGRAM_EDU_LIST_ID;   // numeric ID of Ezra-Edu Download List

  if (!wpUrl || !wpUser || !wpPass || !listId) {
    console.warn('[edu-capture] WP credentials or list ID not set — skipping Icegram');
    return res.status(200).json({ ok: true, icegram: { ok: false, reason: 'credentials_missing' } });
  }

  try {
    const credentials = Buffer.from(`${wpUser}:${wpPass}`).toString('base64');

    const response = await fetch(`${wpUrl}/wp-json/icegram-express/v1/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`,
      },
      body: JSON.stringify({
        email:      normalizedEmail,
        first_name: fn,
        last_name:  ln,
        list_id:    parseInt(listId, 10),
        source:     'ezra-edu-diagnostic-download',
      }),
    });

    const data = await response.json();
    console.log('[edu-capture] Icegram response:', response.status, JSON.stringify(data).slice(0, 120));

    if (!response.ok) {
      console.error('[edu-capture] Icegram error:', JSON.stringify(data));
      return res.status(200).json({ ok: true, icegram: { ok: false, reason: 'icegram_error' } });
    }

    return res.status(200).json({ ok: true, icegram: { ok: true } });
  } catch (err) {
    console.error('[edu-capture] network error:', err.message);
    return res.status(200).json({ ok: true, icegram: { ok: false, reason: 'network_error' } });
  }
}

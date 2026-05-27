// pages/api/books/diagnostic/save.js
// Free for all — saves form data to Supabase by email.
// POST { email, productSlug, data }
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, productSlug = 'child-education', data, childName } = req.body || {};
  if (!email || !data) return res.status(400).json({ error: 'email and data are required' });

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedChild = (childName ?? data?.child_name ?? '').trim();

  try {
    const { error } = await supabase
      .from('diagnostic_plans')
      .upsert(
        { email: normalizedEmail, product_slug: productSlug, child_name: normalizedChild, data },
        { onConflict: 'email,product_slug,child_name' }
      );

    if (error) throw error;
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[diagnostic/save]', err.message);
    return res.status(500).json({ error: 'Failed to save' });
  }
}

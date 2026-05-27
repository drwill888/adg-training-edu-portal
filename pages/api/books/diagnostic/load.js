// pages/api/books/diagnostic/load.js
// Free for all — loads saved form data by email.
// GET ?email=...&productSlug=...
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email, productSlug = 'child-education' } = req.query;
  if (!email) return res.status(400).json({ error: 'email is required' });

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const { data: row, error } = await supabase
      .from('diagnostic_plans')
      .select('data, summary, updated_at')
      .eq('email', normalizedEmail)
      .eq('product_slug', productSlug)
      .maybeSingle();

    if (error) throw error;
    return res.status(200).json({ data: row?.data || null, summary: row?.summary || null, updated_at: row?.updated_at || null });
  } catch (err) {
    console.error('[diagnostic/load]', err.message);
    return res.status(500).json({ error: 'Failed to load' });
  }
}

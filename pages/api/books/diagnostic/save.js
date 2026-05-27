// pages/api/books/diagnostic/save.js
// Saves diagnostic form data to Supabase.
// Free: one child plan per email.
// Paid: unlimited children — gated at save time.
// POST { email, productSlug, data, childName? }

import { createClient } from '@supabase/supabase-js';
import { checkProductAccess } from '@/lib/products/access';

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
    // Check how many distinct child plans this email already has
    const { data: existing, error: fetchErr } = await supabase
      .from('diagnostic_plans')
      .select('child_name')
      .eq('email', normalizedEmail)
      .eq('product_slug', productSlug);

    if (fetchErr) throw fetchErr;

    const existingChildren = existing?.map(r => r.child_name) ?? [];
    const isNewChild = !existingChildren.includes(normalizedChild);
    const hasOtherChildren = existingChildren.some(c => c !== normalizedChild);

    // If adding a second (or more) child, require paid access
    if (isNewChild && hasOtherChildren) {
      const access = await checkProductAccess(normalizedEmail, productSlug);
      if (!access.allowed) {
        return res.status(200).json({
          blocked: true,
          reason: 'multi_child_requires_purchase',
          message: `You already have a plan saved. Adding plans for multiple children requires a coaching subscription ($19.99). Purchase access to add plans for all your children.`,
        });
      }
    }

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

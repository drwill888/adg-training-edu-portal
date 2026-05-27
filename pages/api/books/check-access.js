// pages/api/books/check-access.js
// Returns whether an email has active paid access to a product.
// GET ?email=...&productSlug=...
// Response: { allowed: boolean, reason?: string, expiresAt?: string }

import { checkProductAccess } from '@/lib/products/access';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email, productSlug } = req.query;
  if (!email || !productSlug) {
    return res.status(400).json({ allowed: false, reason: 'missing_params' });
  }

  try {
    const result = await checkProductAccess(email.trim().toLowerCase(), productSlug);
    return res.status(200).json(result);
  } catch (err) {
    console.error('[check-access]', err.message);
    return res.status(200).json({ allowed: false, reason: 'error' });
  }
}

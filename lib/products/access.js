// lib/products/access.js
// Shared access-checking logic for all product/book subscriptions.
// Works entirely off the product slug — no book-specific code here.
import { supabaseAdmin } from '../supabase.js';
import { getProduct } from './registry.js';

export async function checkProductAccess(email, productSlug) {
  if (!email || !productSlug || !supabaseAdmin) {
    return { allowed: false, reason: 'no_email' };
  }

  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('access_type, access_expires_at')
    .eq('email', normalizedEmail)
    .eq('access_type', productSlug)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return { allowed: false, reason: 'no_payment' };
  }

  if (data.access_expires_at && new Date(data.access_expires_at) < new Date()) {
    return { allowed: false, reason: 'expired', expiresAt: data.access_expires_at };
  }

  return { allowed: true, expiresAt: data.access_expires_at };
}

export async function checkDailyLimit(email, productSlug) {
  if (!email || !productSlug || !supabaseAdmin) {
    return { ok: true, used: 0, limit: 10 };
  }

  const product = getProduct(productSlug);
  const limit = product?.dailyLimit ?? 10;
  const normalizedEmail = email.trim().toLowerCase();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabaseAdmin
    .from('product_daily_usage')
    .select('count')
    .eq('email', normalizedEmail)
    .eq('product_slug', productSlug)
    .eq('date', today)
    .maybeSingle();

  const used = data?.count ?? 0;

  return used >= limit
    ? { ok: false, used, limit }
    : { ok: true,  used, limit };
}

export async function incrementDailyUsage(email, productSlug) {
  if (!email || !productSlug || !supabaseAdmin) return;

  const { error } = await supabaseAdmin.rpc('increment_product_usage', {
    p_email: email.trim().toLowerCase(),
    p_slug:  productSlug,
  });

  if (error) console.warn('[products/access] increment failed', error.message);
}

// pages/api/books/ingest.js
// Admin-only: chunks, embeds, and loads a book's knowledge base into Supabase.
// POST /api/books/ingest  { productSlug: 'child-education' }
// Header: x-admin-key: <ADMIN_SECRET>
import fs from 'fs';
import path from 'path';
import { getEmbeddings } from '@/lib/embeddings';
import { supabaseAdmin } from '@/lib/supabase';
import { getProduct } from '@/lib/products/registry';

const CHUNK_SEPARATOR = /\n---\n/;
const MIN_CHUNK_LENGTH = 100;

const ADMIN_EMAIL = 'meier.will@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Accept either x-admin-key header OR a valid Supabase admin session token
  const adminKey = req.headers['x-admin-key'];
  const bearerToken = (req.headers['authorization'] || '').replace('Bearer ', '');

  let authorized = adminKey && adminKey === process.env.ADMIN_SECRET;

  if (!authorized && bearerToken) {
    // Verify supabase session belongs to the admin
    const { createClient } = await import('@supabase/supabase-js');
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await client.auth.getUser(bearerToken);
    if (data?.user?.email === ADMIN_EMAIL) authorized = true;
  }

  if (!authorized) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { productSlug } = req.body || {};
  if (!productSlug) return res.status(400).json({ error: 'productSlug is required' });

  const product = getProduct(productSlug);
  if (!product) return res.status(404).json({ error: `Unknown product: ${productSlug}` });

  try {
    const filePath = path.join(process.cwd(), 'knowledge', product.knowledgeFile);
    const raw = fs.readFileSync(filePath, 'utf-8');

    const chunks = raw
      .split(CHUNK_SEPARATOR)
      .map((c) => c.trim())
      .filter((c) => c.length >= MIN_CHUNK_LENGTH && !c.startsWith('# PLACEHOLDER'));

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'No usable chunks found in knowledge file' });
    }

    const embeddings = await getEmbeddings(chunks);

    // Delete existing chunks for this product (idempotent re-runs)
    await supabaseAdmin.from('coach_chunks').delete().eq('source', productSlug);

    const rows = chunks.map((content, i) => ({
      content,
      embedding: embeddings[i],
      source:    productSlug,
    }));

    const { error } = await supabaseAdmin.from('coach_chunks').insert(rows);
    if (error) throw error;

    return res.status(200).json({
      ok:              true,
      product:         product.name,
      productSlug,
      chunksIngested:  rows.length,
      message:         `${rows.length} chunks ingested for "${product.name}".`,
    });
  } catch (err) {
    console.error('Ingest error:', err);
    return res.status(500).json({ error: err.message || 'Ingest failed' });
  }
}

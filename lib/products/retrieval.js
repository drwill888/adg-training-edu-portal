// lib/products/retrieval.js
// Shared retrieval logic for all products — filters coach_chunks by product slug.
import { supabaseAdmin } from '../supabase.js';

export async function matchProductChunks(embedding, productSlug, count = 5) {
  const { data, error } = await supabaseAdmin.rpc('match_coach_chunks', {
    query_embedding: embedding,
    match_count:     count,
    filter_source:   productSlug,
  });

  if (error) throw error;
  return data ?? [];
}

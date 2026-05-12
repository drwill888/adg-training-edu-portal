import { supabaseAdmin } from "../supabase.js";

export async function matchCoachChunks(embedding, count = 5) {
  const { data, error } = await supabaseAdmin.rpc("match_coach_chunks", {
    query_embedding: embedding,
    match_count: count,
  });

  if (error) throw error;
  return data ?? [];
}

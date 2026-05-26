import { supabaseAdmin } from "../supabase.js";

export async function matchCoachChunks(embedding, count = 5) {
  // Always filter to 'adg' source so the main Ezra coach never mixes in
  // content from other products (e.g. child-education book chunks).
  const { data, error } = await supabaseAdmin.rpc("match_coach_chunks", {
    query_embedding:  embedding,
    match_count:      count,
    filter_source:    "adg",
  });

  if (error) throw error;
  return data ?? [];
}

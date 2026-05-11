import { supabaseAdmin } from "../supabase.js";

export async function getOrCreateConversation(sessionId) {
  if (!supabaseAdmin) throw new Error("Database is not configured");

  const { data: existing } = await supabaseAdmin
    .from("coach_conversations")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) return existing;

  const { data, error } = await supabaseAdmin
    .from("coach_conversations")
    .insert({ session_id: sessionId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function logMessage(conversationId, role, content) {
  if (!supabaseAdmin) return;
  await supabaseAdmin.from("coach_messages").insert({
    conversation_id: conversationId,
    role,
    content,
  });
}

export async function getRecentMessages(conversationId, limit = 8) {
  if (!supabaseAdmin) return [];

  const { data } = await supabaseAdmin
    .from("coach_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).reverse();
}

export async function getUserMessageCount(conversationId) {
  if (!supabaseAdmin) return 0;

  const { count } = await supabaseAdmin
    .from("coach_messages")
    .select("*", { count: "exact", head: true })
    .eq("conversation_id", conversationId)
    .eq("role", "user");

  return count ?? 0;
}

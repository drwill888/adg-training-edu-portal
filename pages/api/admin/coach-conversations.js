// Admin browse of coach conversations.
//   GET  /api/admin/coach-conversations              → list (paginated, newest first)
//   GET  /api/admin/coach-conversations?id=<uuid>    → full thread + lead info
//
// Auth: admin email only.

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";

const ADMIN_EMAIL = "meier.will@gmail.com";

async function getCallerEmail(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  try {
    const anon = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
    const { data } = await anon.auth.getUser(token);
    return data?.user?.email?.toLowerCase() || null;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  if (!["GET", "DELETE"].includes(req.method)) {
    res.setHeader("Allow", "GET, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  const email = await getCallerEmail(req);
  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "DELETE") {
    const id = req.query.id;
    if (!id) return res.status(400).json({ error: "id is required" });
    try {
      await supabaseAdmin.from("coach_messages").delete().eq("conversation_id", id);
      const { error } = await supabaseAdmin.from("coach_conversations").delete().eq("id", id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    } catch (err) {
      console.error("[admin/coach-conversations] delete error", err);
      return res.status(500).json({ error: err.message || "Server error" });
    }
  }

  try {
    if (req.query.id) {
      const id = req.query.id;
      const { data: conv, error: cErr } = await supabaseAdmin
        .from("coach_conversations")
        .select("*")
        .eq("id", id)
        .single();
      if (cErr) throw cErr;

      const { data: messages, error: mErr } = await supabaseAdmin
        .from("coach_messages")
        .select("id, role, content, created_at")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true });
      if (mErr) throw mErr;

      let lead = null;
      if (conv.lead_id) {
        const { data: l } = await supabaseAdmin
          .from("coach_leads")
          .select("first_name, last_name, email, interest")
          .eq("id", conv.lead_id)
          .maybeSingle();
        lead = l;
      }

      return res.status(200).json({ conversation: conv, messages: messages || [], lead });
    }

    const limit = Math.min(parseInt(req.query.limit || "50", 10), 200);
    const { data: convs, error } = await supabaseAdmin
      .from("coach_conversations")
      .select("id, session_id, summary, primary_5c, recommended_next_step, lead_id, created_at, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (error) throw error;

    // Hydrate with message counts and lead emails
    const ids = (convs || []).map((c) => c.id);
    const leadIds = (convs || []).map((c) => c.lead_id).filter(Boolean);

    const { data: msgRows } = ids.length
      ? await supabaseAdmin
          .from("coach_messages")
          .select("conversation_id, role")
          .in("conversation_id", ids)
      : { data: [] };
    const msgCount = (msgRows || []).reduce((acc, m) => {
      acc[m.conversation_id] = (acc[m.conversation_id] || 0) + 1;
      return acc;
    }, {});

    const { data: leadRows } = leadIds.length
      ? await supabaseAdmin
          .from("coach_leads")
          .select("id, first_name, last_name, email")
          .in("id", leadIds)
      : { data: [] };
    const leadById = (leadRows || []).reduce((acc, l) => {
      acc[l.id] = l;
      return acc;
    }, {});

    const rows = (convs || []).map((c) => ({
      ...c,
      message_count: msgCount[c.id] || 0,
      lead: c.lead_id ? leadById[c.lead_id] || null : null,
    }));

    return res.status(200).json({ conversations: rows });
  } catch (err) {
    console.error("[admin/coach-conversations] error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

import { supabaseAdmin } from "@/lib/supabase";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { conversationId, email, firstName, interest } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  try {
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("coach_leads")
      .insert({
        conversation_id: conversationId || null,
        email,
        first_name: firstName || null,
        interest: interest || null,
      })
      .select()
      .single();

    if (leadError) throw leadError;

    if (conversationId) {
      await supabaseAdmin
        .from("coach_conversations")
        .update({ lead_id: lead.id, updated_at: new Date().toISOString() })
        .eq("id", conversationId);
    }

    return res.status(200).json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error("Lead capture error:", err);
    return res.status(500).json({ error: "Failed to save lead" });
  }
}

import { supabaseAdmin } from "@/lib/supabase";
import { addToIcegramList, isIcegramConfigured } from "@/lib/coach/icegram";

const ALLOWED_ORIGINS = [
  "https://awakeningdestiny.global",
  "https://www.awakeningdestiny.global",
];

export default async function handler(req, res) {
  const origin = req.headers.origin || "";
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { conversationId, email, firstName, lastName, interest, consentMarketing } = req.body;
  if (!email) return res.status(400).json({ error: "email is required" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  try {
    const { data: lead, error: leadError } = await supabaseAdmin
      .from("coach_leads")
      .insert({
        conversation_id: conversationId || null,
        email,
        first_name: firstName || null,
        last_name: lastName || null,
        interest: interest || null,
        consent_marketing: Boolean(consentMarketing),
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

    // Push to Make webhook if the visitor opted in to marketing.
    let webhook = null;
    if (consentMarketing && isIcegramConfigured()) {
      webhook = await addToIcegramList({ email, firstName, lastName, interest });
    }

    return res.status(200).json({ success: true, leadId: lead.id, webhook });
  } catch (err) {
    console.error("Lead capture error:", err);
    return res.status(500).json({ error: "Failed to save lead" });
  }
}

import { supabaseAdmin } from "@/lib/supabase";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { conversationId, sendVisitorEmail = false, sendTeamEmail = false } = req.body;
  if (!conversationId) return res.status(400).json({ error: "conversationId is required" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  try {
    const { data: conversation } = await supabaseAdmin
      .from("coach_conversations")
      .select("*, coach_leads(*)")
      .eq("id", conversationId)
      .single();

    const { data: messages } = await supabaseAdmin
      .from("coach_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (!messages?.length) {
      return res.status(200).json({ summary: "No messages to summarize." });
    }

    const transcript = messages
      .map((m) => `${m.role === "user" ? "Visitor" : "ADG Guide"}: ${m.content}`)
      .join("\n\n");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `Analyze this ADG website coaching conversation and return a JSON object with:
- "summary": 2-3 sentence summary of the visitor's situation and interests
- "primary_5c": which of Calling/Connection/Competency/Capacity/Convergence is most relevant
- "recommended_next_step": the single best next step (e.g. "Book a Discovery Conversation")
Return only valid JSON.`,
          },
          { role: "user", content: transcript },
        ],
      }),
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "{}";

    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = { summary: raw, primary_5c: null, recommended_next_step: null };
    }

    await supabaseAdmin
      .from("coach_conversations")
      .update({
        summary: parsed.summary,
        primary_5c: parsed.primary_5c,
        recommended_next_step: parsed.recommended_next_step,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationId);

    const lead = conversation?.coach_leads;
    if (resend && lead?.email) {
      const from = process.env.RESEND_FROM_EMAIL || "noreply@awakeningdestiny.global";
      const teamTo = process.env.COACH_TEAM_EMAIL;

      if (sendVisitorEmail) {
        await resend.emails
          .send({
            from,
            to: lead.email,
            subject: "Your ADG Coaching Conversation Summary",
            html: `<p>Hi ${lead.first_name || "there"},</p>
<p>Here's a summary of your coaching conversation with the ADG Guide:</p>
<p><strong>Summary:</strong> ${parsed.summary}</p>
<p><strong>Primary growth area:</strong> ${parsed.primary_5c}</p>
<p><strong>Recommended next step:</strong> ${parsed.recommended_next_step}</p>
<p>Ready to go deeper? Visit <a href="https://awakeningdestiny.global">awakeningdestiny.global</a> to book a Discovery Conversation with our team.</p>
<p>— The ADG Team</p>`,
          })
          .catch(console.error);
      }

      if (sendTeamEmail && teamTo) {
        await resend.emails
          .send({
            from,
            to: teamTo,
            subject: `New ADG Website Lead: ${lead.first_name || ""} <${lead.email}>`,
            html: `<p><strong>New lead from the website coaching agent:</strong></p>
<p>Name: ${lead.first_name || "Unknown"}<br>Email: ${lead.email}<br>Interest: ${lead.interest || "Not specified"}</p>
<p><strong>Summary:</strong> ${parsed.summary}</p>
<p><strong>Primary 5C:</strong> ${parsed.primary_5c}</p>
<p><strong>Recommended next step:</strong> ${parsed.recommended_next_step}</p>`,
          })
          .catch(console.error);
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error("Summary error:", err);
    return res.status(500).json({ error: "Failed to generate summary" });
  }
}

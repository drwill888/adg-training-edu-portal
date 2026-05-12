import { getEmbedding } from "@/lib/embeddings";
import { matchCoachChunks } from "@/lib/coach/retrieval";
import { COACH_SYSTEM_PROMPT, buildCoachPrompt, buildHistoryMessages } from "@/lib/coach/prompt";
import {
  getOrCreateConversation,
  logMessage,
  getRecentMessages,
  getUserMessageCount,
} from "@/lib/coach/session";
import {
  COACH_CONFIG,
  checkGovernor,
  clientIpFromReq,
  hashIp,
  logUsage,
} from "@/lib/coach/usage";

const FREE_QUESTION_LIMIT = parseInt(process.env.COACH_FREE_QUESTION_LIMIT || "3", 10);

const GATE_MESSAGE =
  "I'd love to keep going. Share your name and email so I can give you more personal guidance — and so the conversation lives somewhere you can return to.";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId, question, hasLead, email } = req.body;
  if (!sessionId || !question) {
    return res.status(400).json({ error: "sessionId and question are required" });
  }

  try {
    const conversation = await getOrCreateConversation(sessionId);
    const conversationId = conversation.id;

    const ipHash = hashIp(clientIpFromReq(req));
    const normalizedEmail = (email || "").trim().toLowerCase() || null;

    // 1) Soft gate after N free messages → email form
    if (!hasLead) {
      const count = await getUserMessageCount(conversationId);
      if (count >= FREE_QUESTION_LIMIT) {
        return res.status(200).json({ answer: GATE_MESSAGE, conversationId, gated: true });
      }
    }

    // 2) Governor: wallet + per-IP + per-email
    const governor = await checkGovernor({ ipHash, email: normalizedEmail });
    if (!governor.ok) {
      // Log the attempt as a user message but no assistant reply / no OpenAI call
      await logMessage(conversationId, "user", question);
      return res.status(200).json({
        answer: governor.message,
        conversationId,
        gated: false,
        capped: true,
        reason: governor.reason,
      });
    }

    // 3) Retrieval
    const queryEmbedding = await getEmbedding(question);
    const matches = await matchCoachChunks(queryEmbedding, 5);
    const context = matches.map((m, i) => `[${i + 1}] ${m.content}`).join("\n\n---\n\n");

    // 4) History + prompt
    const history = await getRecentMessages(conversationId, 8);
    const historyMessages = buildHistoryMessages(history);
    const userPrompt = buildCoachPrompt({ question, context });

    const messages = [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: userPrompt },
    ];

    // 5) Call OpenAI with capped reply length
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: COACH_CONFIG.model,
        max_tokens: COACH_CONFIG.maxReplyTokens,
        messages,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      console.error("OpenAI error:", JSON.stringify(data));
      return res.status(500).json({ error: "Failed to generate response" });
    }

    const answer = data.choices?.[0]?.message?.content || "";

    // 6) Persist messages + usage in parallel
    await Promise.all([
      logMessage(conversationId, "user", question),
      logMessage(conversationId, "assistant", answer),
      logUsage({
        conversationId,
        ipHash,
        email: normalizedEmail,
        model: COACH_CONFIG.model,
        usage: data.usage,
      }),
    ]);

    return res.status(200).json({ answer, conversationId, gated: false });
  } catch (err) {
    console.error("Coach chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

import { getEmbedding } from "@/lib/embeddings";
import { matchCoachChunks } from "@/lib/coach/retrieval";
import { COACH_SYSTEM_PROMPT, buildCoachPrompt, buildHistoryMessages } from "@/lib/coach/prompt";
import {
  getOrCreateConversation,
  logMessage,
  getRecentMessages,
  getUserMessageCount,
} from "@/lib/coach/session";

const FREE_QUESTION_LIMIT = parseInt(process.env.COACH_FREE_QUESTION_LIMIT || "5", 10);

const GATE_MESSAGE =
  "I'd love to keep helping! To continue our conversation, please share your name and email so I can give you more personalized guidance.";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { sessionId, question, hasLead } = req.body;
  if (!sessionId || !question) {
    return res.status(400).json({ error: "sessionId and question are required" });
  }

  try {
    const conversation = await getOrCreateConversation(sessionId);
    const conversationId = conversation.id;

    // Gate unauthenticated visitors after FREE_QUESTION_LIMIT user messages
    if (!hasLead) {
      const count = await getUserMessageCount(conversationId);
      if (count >= FREE_QUESTION_LIMIT) {
        return res.status(200).json({ answer: GATE_MESSAGE, conversationId, gated: true });
      }
    }

    // Embed + retrieve relevant KB content
    const queryEmbedding = await getEmbedding(question);
    const matches = await matchCoachChunks(queryEmbedding, 5);
    const context = matches.map((m, i) => `[${i + 1}] ${m.content}`).join("\n\n---\n\n");

    // Build message history for multi-turn context
    const history = await getRecentMessages(conversationId, 8);
    const historyMessages = buildHistoryMessages(history);
    const userPrompt = buildCoachPrompt({ question, context });

    const messages = [
      { role: "system", content: COACH_SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: userPrompt },
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({ model: "gpt-4o", max_tokens: 800, messages }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      console.error("OpenAI error:", JSON.stringify(data));
      return res.status(500).json({ error: "Failed to generate response" });
    }

    const answer = data.choices?.[0]?.message?.content || "";

    await logMessage(conversationId, "user", question);
    await logMessage(conversationId, "assistant", answer);

    return res.status(200).json({ answer, conversationId, gated: false });
  } catch (err) {
    console.error("Coach chat error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}

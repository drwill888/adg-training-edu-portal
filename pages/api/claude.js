import { enforceAiRateLimit } from "../../lib/ratelimit";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const rl = await enforceAiRateLimit(req);
  if (!rl.ok) {
    res.setHeader("Retry-After", String(rl.retryAfter));
    return res.status(429).json({
      error: "Too many requests. Please slow down.",
      retryAfter: rl.retryAfter,
    });
  }

  try {
    const { prompt, messages } = req.body;
    const msgs = messages || [{ role: "user", content: prompt }];

    const { systemPrompt } = req.body;
    const finalMsgs = systemPrompt
      ? [{ role: "system", content: systemPrompt }, ...msgs]
      : msgs;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        max_tokens: 1800,
        messages: finalMsgs,
      }),
    });

    const data = await response.json();

    if (response.status !== 200) {
      return res.status(200).json({
        response: "API Error: " + JSON.stringify(data),
      });
    }

    const text = data.choices?.[0]?.message?.content || "";
    res.status(200).json({ response: text, content: data.choices });
  } catch (error) {
    res.status(200).json({ response: "Error: " + error.message });
  }
}

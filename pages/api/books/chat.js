// pages/api/books/chat.js
// Universal book chat endpoint — handles any product slug.
// The client sends { sessionId, question, email, productSlug } in the request body.
import path from 'path';
import { getEmbedding } from '@/lib/embeddings';
import { matchProductChunks } from '@/lib/products/retrieval';
import { checkProductAccess, checkDailyLimit, incrementDailyUsage } from '@/lib/products/access';
import { getProduct } from '@/lib/products/registry';
import { getOrCreateConversation, logMessage, getRecentMessages } from '@/lib/coach/session';
import { COACH_CONFIG } from '@/lib/coach/usage';

const ALLOWED_ORIGINS = [
  'https://awakeningdestiny.global',
  'https://www.awakeningdestiny.global',
  'https://5cblueprint.awakeningdestiny.global',
  'https://ezra.edu.awakeningdestiny.global',
];

// Lazy-load a product's prompt module by slug
const promptCache = {};
async function getPromptModule(productSlug) {
  if (promptCache[productSlug]) return promptCache[productSlug];
  // Dynamic import — each book's prompt lives at lib/products/<slug>/prompt.js
  const mod = await import(`@/lib/products/${productSlug}/prompt`);
  promptCache[productSlug] = mod;
  return mod;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId, question, email, productSlug } = req.body;

  if (!sessionId || !question || !productSlug) {
    return res.status(400).json({ error: 'sessionId, question, and productSlug are required' });
  }

  const product = getProduct(productSlug);
  if (!product) {
    return res.status(404).json({ error: `Unknown product: ${productSlug}` });
  }

  if (!email) {
    return res.status(200).json({
      answer:  'Please enter your email to access your coaching session.',
      blocked: true,
      reason:  'no_email',
    });
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    // 1) Check paid access + expiry
    const access = await checkProductAccess(normalizedEmail, productSlug);
    if (!access.allowed) {
      const copy = {
        no_email:   'Please enter your email to access your session.',
        no_payment: "I don't see an active subscription for that email. Purchase access below to begin.",
        expired:    'Your access has expired. You can renew below to continue the conversation.',
      };
      return res.status(200).json({
        answer:  copy[access.reason] || 'Access not found. Please check your email or purchase access below.',
        blocked: true,
        reason:  access.reason,
      });
    }

    // 2) Daily limit
    const limit = await checkDailyLimit(normalizedEmail, productSlug);
    if (!limit.ok) {
      return res.status(200).json({
        answer:     `You've used all ${limit.limit} of your conversations for today. Come back tomorrow — Ezra will be here.`,
        blocked:    true,
        reason:     'daily_limit',
        used:       limit.used,
        dailyLimit: limit.limit,
      });
    }

    // 3) Load prompt module for this product
    const promptMod = await getPromptModule(productSlug);
    const systemPrompt = promptMod.SYSTEM_PROMPT;
    const buildPrompt  = promptMod.buildPrompt;
    const buildHistory = promptMod.buildHistoryMessages;

    // 4) Session — tag with productSlug so admin can filter by book
    const conversation   = await getOrCreateConversation(sessionId, productSlug);
    const conversationId = conversation.id;

    // 5) Retrieval
    const queryEmbedding = await getEmbedding(question);
    const matches        = await matchProductChunks(queryEmbedding, productSlug, 5);
    const context        = matches.map((m, i) => `[${i + 1}] ${m.content}`).join('\n\n---\n\n');

    // 6) History + prompt
    const history        = await getRecentMessages(conversationId, 8);
    const historyMessages = buildHistory(history);
    const userPrompt     = buildPrompt({ question, context });

    const messages = [
      { role: 'system',  content: systemPrompt },
      ...historyMessages,
      { role: 'user',    content: userPrompt },
    ];

    // 7) Call OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization:  'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model:      COACH_CONFIG.model,
        max_tokens: COACH_CONFIG.maxReplyTokens,
        messages,
      }),
    });

    const data = await response.json();
    if (response.status !== 200) {
      console.error(`OpenAI error [${productSlug}]:`, JSON.stringify(data));
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    const answer = data.choices?.[0]?.message?.content || '';

    // 8) Persist + increment in parallel
    await Promise.all([
      logMessage(conversationId, 'user', question),
      logMessage(conversationId, 'assistant', answer),
      incrementDailyUsage(normalizedEmail, productSlug),
    ]);

    return res.status(200).json({
      answer,
      conversationId,
      blocked:    false,
      remaining:  limit.limit - limit.used - 1,
      dailyLimit: limit.limit,
    });
  } catch (err) {
    console.error(`Book chat error [${productSlug}]:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

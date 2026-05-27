// pages/api/books/chat.js
// Universal book chat endpoint — handles any product slug.
// Embeddings: OpenAI text-embedding-3-small (unchanged)
// Chat:       Anthropic Claude (warmer, more pastoral coaching tone)
// The client sends { sessionId, question, email, productSlug } in the request body.
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { getEmbedding } from '@/lib/embeddings';
import { matchProductChunks } from '@/lib/products/retrieval';
import { checkProductAccess, checkDailyLimit, incrementDailyUsage } from '@/lib/products/access';
import { getProduct } from '@/lib/products/registry';
import { getOrCreateConversation, logMessage, getRecentMessages } from '@/lib/coach/session';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const CLAUDE_MODEL      = process.env.BOOK_CLAUDE_MODEL || 'claude-sonnet-4-5';
const CLAUDE_MAX_TOKENS = parseInt(process.env.BOOK_CLAUDE_MAX_TOKENS || '1024', 10);

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

  const { sessionId, question, email, productSlug, childName = '' } = req.body;

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
    const buildPrompt  = promptMod.buildPrompt;
    const buildHistory = promptMod.buildHistoryMessages;

    // 3b) Load the parent's diagnostic plan for this child and inject into system prompt
    let systemPrompt = promptMod.SYSTEM_PROMPT;
    try {
      const query = supabase
        .from('diagnostic_plans')
        .select('data, summary, child_name')
        .eq('email', normalizedEmail)
        .eq('product_slug', productSlug);

      // If childName specified, load that child's plan; otherwise load most recent
      if (childName) query.eq('child_name', childName);
      else query.order('updated_at', { ascending: false });

      const { data: planRow } = await query.maybeSingle();

      if (planRow?.data && Object.keys(planRow.data).length > 5) {
        const d = planRow.data;
        const name = d.child_name || planRow.child_name || 'this child';
        const planBlock = planRow.summary
          ? `AI PROFILE SUMMARY:\n${planRow.summary}`
          : `CHILD: ${name}, Age/Grade: ${d.age_grade || 'not provided'}
PRIMARY GIFTS: ${[d.gift_1, d.gift_2, d.gift_3].filter(Boolean).join(', ') || 'not provided'}
PASSIONS: ${d.passions || 'not provided'}
LEARNING PATHWAY: ${['Visual','Auditory','Kinesthetic','Read/Write'].filter(p => d[`primary_pathway_${p}`]).join(', ') || 'not provided'}
CHALLENGES: ${[d.challenge_1, d.challenge_2, d.challenge_3].filter(Boolean).join(', ') || 'not provided'}
FORMATION PRIORITIES: ${[d.priority_1, d.priority_2, d.priority_3].filter(Boolean).join(' / ') || 'not provided'}
WHO THEY ARE BECOMING: ${d.becoming || 'not provided'}`;

        systemPrompt = `${promptMod.SYSTEM_PROMPT}

═══════════════════════════════════════════
THIS PARENT'S COMPLETED DIAGNOSTIC PLAN
═══════════════════════════════════════════
The parent has already filled out the Child Strategic Plan Diagnostic for ${name}. You have their answers below. Use this to personalize every response. Do NOT ask for information already provided here. Reference specific details from their plan to show you know this child.

${planBlock}
═══════════════════════════════════════════`;
        console.log(`[chat] Loaded diagnostic plan for ${name} (${normalizedEmail})`);
      }
    } catch (planErr) {
      console.warn('[chat] Could not load diagnostic plan:', planErr.message);
    }

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

    // 7) Call Claude — system prompt is a top-level param, not a message role
    const claudeResponse = await anthropic.messages.create({
      model:      CLAUDE_MODEL,
      max_tokens: CLAUDE_MAX_TOKENS,
      system:     systemPrompt,
      messages:   [
        ...historyMessages,
        { role: 'user', content: userPrompt },
      ],
    });

    const answer = claudeResponse.content?.[0]?.text || '';

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

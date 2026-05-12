// Governor + usage tracking for the Ezra coach.
//
// Tracks per-reply spend in coach_usage. Enforces three caps:
//   1. Wallet cap          — total $ spent this month
//   2. Per-IP daily cap    — messages per IP today
//   3. Per-email daily cap — messages per email today
//
// All limits and pricing are env-driven so they can be tuned without code edits.

import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase";

const MODEL = process.env.COACH_MODEL || "gpt-4o-mini";
const MAX_REPLY_TOKENS = parseInt(process.env.COACH_MAX_REPLY_TOKENS || "400", 10);

const WALLET_USD_PER_MONTH = parseFloat(process.env.COACH_WALLET_USD_PER_MONTH || "5");
const PER_IP_PER_DAY = parseInt(process.env.COACH_PER_IP_PER_DAY || "15", 10);
const PER_EMAIL_PER_DAY = parseInt(process.env.COACH_PER_EMAIL_PER_DAY || "10", 10);

// Pricing per 1M tokens, USD. Override with COACH_PRICE_IN / COACH_PRICE_OUT env vars.
// Defaults reflect gpt-4o-mini list pricing.
const PRICE_IN = parseFloat(process.env.COACH_PRICE_IN_PER_M || "0.15");
const PRICE_OUT = parseFloat(process.env.COACH_PRICE_OUT_PER_M || "0.60");

export const COACH_CONFIG = {
  model: MODEL,
  maxReplyTokens: MAX_REPLY_TOKENS,
  walletUsdPerMonth: WALLET_USD_PER_MONTH,
  perIpPerDay: PER_IP_PER_DAY,
  perEmailPerDay: PER_EMAIL_PER_DAY,
  priceInPerM: PRICE_IN,
  priceOutPerM: PRICE_OUT,
};

export function hashIp(ip) {
  if (!ip) return null;
  return crypto.createHash("sha256").update(String(ip)).digest("hex").slice(0, 32);
}

export function clientIpFromReq(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (fwd) return String(fwd).split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

export function computeCostUsd({ prompt_tokens = 0, completion_tokens = 0 }) {
  const inputUsd = (prompt_tokens / 1_000_000) * PRICE_IN;
  const outputUsd = (completion_tokens / 1_000_000) * PRICE_OUT;
  return Number((inputUsd + outputUsd).toFixed(6));
}

function startOfMonthIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
function startOfDayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export async function getMonthSpendUsd() {
  if (!supabaseAdmin) return 0;
  const { data, error } = await supabaseAdmin
    .from("coach_usage")
    .select("cost_usd")
    .gte("created_at", startOfMonthIso());
  if (error) return 0;
  return (data || []).reduce((s, r) => s + Number(r.cost_usd || 0), 0);
}

async function countToday({ ipHash, email }) {
  if (!supabaseAdmin) return 0;
  let q = supabaseAdmin
    .from("coach_usage")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startOfDayIso());
  if (ipHash) q = q.eq("ip_hash", ipHash);
  if (email) q = q.eq("email", email);
  const { count, error } = await q;
  if (error) return 0;
  return count || 0;
}

// Returns { ok: true } if the request may proceed, or { ok: false, reason, message } if blocked.
export async function checkGovernor({ ipHash, email }) {
  const spend = await getMonthSpendUsd();
  if (spend >= WALLET_USD_PER_MONTH) {
    return {
      ok: false,
      reason: "wallet_cap",
      message:
        "Ezra has had a busy month with lots of leaders. He's resting until the 1st of next month. In the meantime, you can book a Discovery Call with Will or email him directly.",
    };
  }

  if (ipHash) {
    const ipCount = await countToday({ ipHash });
    if (ipCount >= PER_IP_PER_DAY) {
      return {
        ok: false,
        reason: "ip_cap",
        message:
          "You've had a rich conversation today. Come back tomorrow, or book a Discovery Call to talk with Will directly.",
      };
    }
  }

  if (email) {
    const emailCount = await countToday({ email });
    if (emailCount >= PER_EMAIL_PER_DAY) {
      return {
        ok: false,
        reason: "email_cap",
        message:
          "You've had a rich conversation today. Take some time to sit with what's emerged — Ezra will be here again tomorrow.",
      };
    }
  }

  return { ok: true };
}

export async function logUsage({
  conversationId,
  ipHash,
  email,
  model,
  usage,
}) {
  if (!supabaseAdmin) return;
  const cost = computeCostUsd({
    prompt_tokens: usage?.prompt_tokens || 0,
    completion_tokens: usage?.completion_tokens || 0,
  });
  try {
    await supabaseAdmin.from("coach_usage").insert({
      conversation_id: conversationId || null,
      ip_hash: ipHash || null,
      email: email || null,
      model: model || MODEL,
      prompt_tokens: usage?.prompt_tokens || 0,
      completion_tokens: usage?.completion_tokens || 0,
      cost_usd: cost,
    });
  } catch (e) {
    console.warn("[coach/usage] log failed", e.message);
  }
}

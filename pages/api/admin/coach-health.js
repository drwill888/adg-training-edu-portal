// Coach Health metrics for the admin dashboard.
// Returns: { config, today, month, recent }

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { COACH_CONFIG } from "@/lib/coach/usage";

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

function startOfMonthIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}
function startOfDayIso() {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  const email = await getCallerEmail(req);
  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const monthIso = startOfMonthIso();
    const dayIso = startOfDayIso();

    const [{ data: monthRows }, { data: dayRows }, { data: recent }, { count: leadsMonth }] =
      await Promise.all([
        supabaseAdmin
          .from("coach_usage")
          .select("cost_usd, prompt_tokens, completion_tokens, email, ip_hash")
          .gte("created_at", monthIso),
        supabaseAdmin
          .from("coach_usage")
          .select("cost_usd, prompt_tokens, completion_tokens, email, ip_hash")
          .gte("created_at", dayIso),
        supabaseAdmin
          .from("coach_usage")
          .select("id, email, ip_hash, model, prompt_tokens, completion_tokens, cost_usd, created_at")
          .order("created_at", { ascending: false })
          .limit(20),
        supabaseAdmin
          .from("coach_leads")
          .select("id", { count: "exact", head: true })
          .gte("created_at", monthIso),
      ]);

    function summarize(rows) {
      const r = rows || [];
      const cost = r.reduce((s, x) => s + Number(x.cost_usd || 0), 0);
      const inTok = r.reduce((s, x) => s + (x.prompt_tokens || 0), 0);
      const outTok = r.reduce((s, x) => s + (x.completion_tokens || 0), 0);
      const ips = new Set(r.map((x) => x.ip_hash).filter(Boolean)).size;
      const emails = new Set(r.map((x) => x.email).filter(Boolean)).size;
      return { count: r.length, cost: Number(cost.toFixed(4)), inTok, outTok, ips, emails };
    }

    function topGroups(rows, key, n = 5) {
      const tally = {};
      for (const r of rows || []) {
        const k = r[key];
        if (!k) continue;
        tally[k] = (tally[k] || 0) + 1;
      }
      return Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([k, v]) => ({ key: k, count: v }));
    }

    return res.status(200).json({
      config: COACH_CONFIG,
      month: {
        ...summarize(monthRows),
        leads: leadsMonth || 0,
        topIps: topGroups(monthRows, "ip_hash"),
        topEmails: topGroups(monthRows, "email"),
      },
      today: summarize(dayRows),
      recent: recent || [],
    });
  } catch (err) {
    console.error("[admin/coach-health]", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

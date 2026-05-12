// Sends a captured lead to a Make.com webhook.
// Make handles the actual Icegram add (and anything else) visually.
//
// Requires in .env.local:
//   MAKE_WEBHOOK_URL=https://hook.us2.make.com/abc123...

const MAKE_WEBHOOK_URL = process.env.MAKE_WEBHOOK_URL;
const COACH_LIST_ID = process.env.ICEGRAM_COACH_LIST_ID
  ? parseInt(process.env.ICEGRAM_COACH_LIST_ID, 10)
  : null;

export function isLeadWebhookConfigured() {
  return Boolean(MAKE_WEBHOOK_URL);
}

// Keep the old name as an alias for the lead.js import — but it now sends
// to Make instead of calling Icegram directly.
export const isIcegramConfigured = isLeadWebhookConfigured;

export async function addToIcegramList({ email, firstName, listIds, interest }) {
  if (!MAKE_WEBHOOK_URL) {
    console.warn("[lead-webhook] MAKE_WEBHOOK_URL not configured — skipping");
    return { ok: false, reason: "not_configured" };
  }

  const resolvedListIds =
    listIds && listIds.length ? listIds : COACH_LIST_ID ? [COACH_LIST_ID] : [];

  try {
    const res = await fetch(MAKE_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        first_name: firstName || "",
        interest: interest || "",
        list_ids: resolvedListIds,
        source: "adg-website-coach",
        timestamp: new Date().toISOString(),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[lead-webhook] request failed", res.status, text);
      return { ok: false, status: res.status, body: text };
    }
    console.log("[lead-webhook] sent to Make", text.slice(0, 100));
    return { ok: true, body: text };
  } catch (err) {
    console.error("[lead-webhook] fetch error", err.message);
    return { ok: false, error: err.message };
  }
}

// Icegram Express API helper.
// Adds a subscriber to a list via the Icegram REST API.
//
// Requires in .env.local:
//   ICEGRAM_API_KEY=...
//   ICEGRAM_API_URL=https://awakeningdestiny.global    (no trailing slash)
//   ICEGRAM_LIST_ID=<list id from Icegram admin>

const ICEGRAM_API_KEY = process.env.ICEGRAM_API_KEY;
const ICEGRAM_API_URL = process.env.ICEGRAM_API_URL || "https://awakeningdestiny.global";
const ICEGRAM_LIST_ID = process.env.ICEGRAM_LIST_ID;

export function isIcegramConfigured() {
  return Boolean(ICEGRAM_API_KEY && ICEGRAM_LIST_ID);
}

// Best-effort call to Icegram Express. Tries the most common modern endpoint.
// Failure is logged but never throws — we don't want a third-party outage to
// block lead capture into our own database.
export async function addToIcegramList({ email, firstName, listIds }) {
  if (!isIcegramConfigured()) {
    console.warn("[icegram] not configured — skipping");
    return { ok: false, reason: "not_configured" };
  }

  const ids = (listIds && listIds.length ? listIds : [ICEGRAM_LIST_ID]).map(String);
  const endpoint = `${ICEGRAM_API_URL.replace(/\/$/, "")}/wp-json/icegram-mailer/v1/subscriber`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": ICEGRAM_API_KEY,
      },
      body: JSON.stringify({
        email,
        first_name: firstName || "",
        lists: ids,
        status: "subscribed",
      }),
    });

    const body = await res.text();
    if (!res.ok) {
      console.error("[icegram] request failed", res.status, body);
      return { ok: false, status: res.status, body };
    }
    return { ok: true, body };
  } catch (err) {
    console.error("[icegram] fetch error", err.message);
    return { ok: false, error: err.message };
  }
}

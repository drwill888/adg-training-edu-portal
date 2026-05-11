// Icegram Express (Email Subscribers v1) API helper.
// Uses WordPress Application Passwords (Basic Auth) for authentication.
//
// Requires in .env.local:
//   WP_USERNAME=<wordpress admin username>
//   WP_APP_PASSWORD=<application password, spaces OK>
//   ICEGRAM_API_URL=https://awakeningdestiny.global   (defaults to this)
//   ICEGRAM_LIST_ID=<list id from Icegram admin>     (optional)

const WP_USERNAME = process.env.WP_USERNAME;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const ICEGRAM_API_URL = process.env.ICEGRAM_API_URL || "https://awakeningdestiny.global";
const ICEGRAM_LIST_ID = process.env.ICEGRAM_LIST_ID;

export function isIcegramConfigured() {
  return Boolean(WP_USERNAME && WP_APP_PASSWORD);
}

function authHeader() {
  // Strip spaces from app password — WordPress accepts both but the bare form
  // is what Basic Auth standardizes on.
  const password = (WP_APP_PASSWORD || "").replace(/\s+/g, "");
  const token = Buffer.from(`${WP_USERNAME}:${password}`).toString("base64");
  return `Basic ${token}`;
}

// Best-effort call to add a subscriber to the email-subscribers list.
// Failure is logged but never throws — we don't want a third-party outage to
// block lead capture into our own database.
export async function addToIcegramList({ email, firstName, listIds }) {
  if (!isIcegramConfigured()) {
    console.warn("[icegram] not configured — skipping");
    return { ok: false, reason: "not_configured" };
  }

  const ids = (listIds && listIds.length ? listIds : [ICEGRAM_LIST_ID]).filter(Boolean).map(String);
  const endpoint = `${ICEGRAM_API_URL.replace(/\/$/, "")}/wp-json/email-subscribers/v1/subscribers`;

  const body = {
    email,
    first_name: firstName || "",
    status: "subscribed",
  };
  if (ids.length) body.list_ids = ids;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: authHeader(),
      },
      body: JSON.stringify(body),
    });

    const text = await res.text();
    if (!res.ok) {
      console.error("[icegram] request failed", res.status, text);
      return { ok: false, status: res.status, body: text };
    }
    console.log("[icegram] subscriber added", text);
    return { ok: true, body: text };
  } catch (err) {
    console.error("[icegram] fetch error", err.message);
    return { ok: false, error: err.message };
  }
}

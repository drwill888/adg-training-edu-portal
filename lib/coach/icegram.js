// Subscribes a captured coach lead directly to the Icegram Express list
// by submitting the public subscription form (no API auth needed).
//
// How it works:
//   1. GET the form page to extract a fresh nonce
//   2. POST the form data (email, name, list hash, nonce) to admin-ajax.php
//
// Requires in .env.local:
//   ICEGRAM_FORM_PAGE_URL=https://awakeningdestiny.global/email-subscribers-form-id10/
//   ICEGRAM_LIST_HASH=19ec2e511f67
//   ICEGRAM_FORM_ID=10        (optional, defaults to 10)
//   ICEGRAM_WP_BASE=https://awakeningdestiny.global  (optional, derived from form URL)

const FORM_PAGE_URL = process.env.ICEGRAM_FORM_PAGE_URL;
const LIST_HASH = process.env.ICEGRAM_LIST_HASH;
const FORM_ID = process.env.ICEGRAM_FORM_ID || "10";

function getAjaxUrl() {
  if (!FORM_PAGE_URL) return null;
  const url = new URL(FORM_PAGE_URL);
  return `${url.protocol}//${url.host}/wp-admin/admin-ajax.php`;
}

export function isLeadWebhookConfigured() {
  return Boolean(FORM_PAGE_URL && LIST_HASH);
}

// Alias retained so existing imports keep working.
export const isIcegramConfigured = isLeadWebhookConfigured;

async function fetchNonce() {
  const res = await fetch(FORM_PAGE_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; AwakeningDestinyCoach/1.0; +https://awakeningdestiny.global)",
    },
  });
  if (!res.ok) throw new Error(`form page fetch failed: ${res.status}`);
  const html = await res.text();

  const formIdentifier = html.match(
    /name="esfpx_es_form_identifier"\s+value="([^"]+)"/
  )?.[1];
  const nonce = html.match(/name="esfpx_es-subscribe"[^>]*value="([^"]+)"/)?.[1];

  if (!nonce) throw new Error("could not find nonce on form page");
  return { nonce, formIdentifier };
}

export async function addToIcegramList({ email, firstName, interest }) {
  if (!isLeadWebhookConfigured()) {
    console.warn("[icegram] ICEGRAM_FORM_PAGE_URL or ICEGRAM_LIST_HASH not configured — skipping");
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { nonce, formIdentifier } = await fetchNonce();

    const body = new URLSearchParams();
    body.append("es", "subscribe");
    body.append("esfpx_email", email);
    body.append("esfpx_name", firstName || "");
    body.append("esfpx_lists[]", LIST_HASH);
    body.append("esfpx_form_id", FORM_ID);
    body.append("esfpx_es_form_identifier", formIdentifier || `f${FORM_ID}-n1`);
    body.append("esfpx_status", "Unconfirmed");
    body.append("esfpx_es-subscribe", nonce);
    body.append("esfpx_es_hp_email", "");
    body.append("es_gdpr_consent", "true");
    if (interest) body.append("esfpx_interest", interest);

    const ajaxUrl = getAjaxUrl();
    const res = await fetch(`${ajaxUrl}?action=es_add_subscriber_from_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (compatible; AwakeningDestinyCoach/1.0; +https://awakeningdestiny.global)",
        Referer: FORM_PAGE_URL,
      },
      body: body.toString(),
    });

    const text = await res.text();

    if (!res.ok) {
      console.error("[icegram] subscribe failed", res.status, text.slice(0, 300));
      return { ok: false, status: res.status, body: text.slice(0, 300) };
    }

    // If admin-ajax returns "0" the action wasn't recognized — fall back to
    // posting to the form page directly (some plugin builds handle it there).
    if (text.trim() === "0") {
      const fallback = await fetch(FORM_PAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent":
            "Mozilla/5.0 (compatible; AwakeningDestinyCoach/1.0; +https://awakeningdestiny.global)",
          Referer: FORM_PAGE_URL,
        },
        body: body.toString(),
        redirect: "manual",
      });
      const fbText = await fallback.text();
      console.log(
        "[icegram] fallback page POST",
        fallback.status,
        fbText.slice(0, 200)
      );
      return {
        ok: fallback.status === 200 || fallback.status === 302,
        status: fallback.status,
        via: "page",
        body: fbText.slice(0, 200),
      };
    }

    console.log("[icegram] subscribed", text.slice(0, 200));
    return { ok: true, body: text.slice(0, 200) };
  } catch (err) {
    console.error("[icegram] error", err.message);
    return { ok: false, error: err.message };
  }
}

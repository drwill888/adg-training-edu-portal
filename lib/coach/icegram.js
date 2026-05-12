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

export async function addToIcegramList({ email, firstName, lastName, interest }) {
  if (!isLeadWebhookConfigured()) {
    console.warn("[icegram] ICEGRAM_FORM_PAGE_URL or ICEGRAM_LIST_HASH not configured — skipping");
    return { ok: false, reason: "not_configured" };
  }

  try {
    const { nonce, formIdentifier } = await fetchNonce();

    const body = new URLSearchParams();
    body.append("es", "subscribe");
    body.append("esfpx_email", email);
    body.append("esfpx_name", [firstName, lastName].filter(Boolean).join(" "));
    if (firstName) body.append("esfpx_first_name", firstName);
    if (lastName) body.append("esfpx_last_name", lastName);
    body.append("esfpx_lists[]", LIST_HASH);
    body.append("esfpx_form_id", FORM_ID);
    body.append("esfpx_es_form_identifier", formIdentifier || `f${FORM_ID}-n1`);
    body.append("esfpx_status", "Unconfirmed");
    body.append("esfpx_es-subscribe", nonce);
    body.append("esfpx_es_hp_email", "");
    body.append("es_gdpr_consent", "true");
    if (interest) body.append("esfpx_interest", interest);

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (compatible; AwakeningDestinyCoach/1.0; +https://awakeningdestiny.global)",
      Referer: FORM_PAGE_URL,
    };

    const ajaxUrl = getAjaxUrl();
    const attempts = [
      { label: "ajax:es_subscribe", url: `${ajaxUrl}?action=es_subscribe` },
      {
        label: "ajax:es_add_subscriber_from_request",
        url: `${ajaxUrl}?action=es_add_subscriber_from_request`,
      },
      { label: "page", url: FORM_PAGE_URL },
    ];

    let last = null;
    for (const attempt of attempts) {
      const res = await fetch(attempt.url, {
        method: "POST",
        headers,
        body: body.toString(),
        redirect: "manual",
      });
      const text = await res.text();
      const trimmed = text.trim();
      const looksLikeSuccess =
        res.ok &&
        trimmed !== "0" &&
        trimmed !== "-1" &&
        !/rest_forbidden|invalid|error/i.test(trimmed.slice(0, 200));

      console.log(
        `[icegram] ${attempt.label}`,
        res.status,
        trimmed.slice(0, 120).replace(/\s+/g, " ")
      );

      last = { ok: looksLikeSuccess, status: res.status, via: attempt.label, body: trimmed.slice(0, 200) };
      if (looksLikeSuccess) return last;
    }

    return last || { ok: false, reason: "no_attempts" };
  } catch (err) {
    console.error("[icegram] error", err.message);
    return { ok: false, error: err.message };
  }
}

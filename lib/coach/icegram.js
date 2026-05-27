// Subscribes a lead to an Icegram Express list by submitting the public
// subscription form (no API auth needed).
//
// How it works:
//   1. GET the form page to extract a fresh nonce
//   2. POST the form data (email, name, list hash, nonce) to admin-ajax.php
//
// Coach list env vars (used by default):
//   ICEGRAM_FORM_PAGE_URL   — e.g. https://awakeningdestiny.global/email-subscribers-form-id10/
//   ICEGRAM_LIST_HASH       — e.g. 19ec2e511f67
//   ICEGRAM_FORM_ID         — e.g. 10
//
// Edu list env vars (pass as config to addToIcegramList):
//   ICEGRAM_EDU_FORM_PAGE_URL
//   ICEGRAM_EDU_LIST_HASH
//   ICEGRAM_EDU_FORM_ID

const FORM_PAGE_URL = process.env.ICEGRAM_FORM_PAGE_URL;
const LIST_HASH = process.env.ICEGRAM_LIST_HASH;
const FORM_ID = process.env.ICEGRAM_FORM_ID || "10";

export function isLeadWebhookConfigured() {
  return Boolean(FORM_PAGE_URL && LIST_HASH);
}

// Alias retained so existing imports keep working.
export const isIcegramConfigured = isLeadWebhookConfigured;

async function fetchNonce(formPageUrl) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (compatible; AwakeningDestinyCoach/1.0; +https://awakeningdestiny.global)",
  };

  let res = await fetch(formPageUrl, { headers });
  let usedFallback = false;

  // If the configured page 404s, fall back to the coach form page —
  // WP nonces are site-wide across all Icegram forms on the same install.
  if (!res.ok && FORM_PAGE_URL && formPageUrl !== FORM_PAGE_URL) {
    console.warn(`[icegram] form page ${res.status} at ${formPageUrl} — trying coach fallback`);
    res = await fetch(FORM_PAGE_URL, { headers });
    usedFallback = true;
  }

  if (!res.ok) throw new Error(`form page fetch failed: ${res.status}`);
  const html = await res.text();

  // Only use the extracted form identifier when we loaded the actual target page.
  // If we fell back, the identifier will be for the wrong form — let the caller
  // supply the default (f{formId}-n1) instead.
  const formIdentifier = usedFallback
    ? null
    : html.match(/name="esfpx_es_form_identifier"\s+value="([^"]+)"/)?.[1];

  const nonce = html.match(/name="esfpx_es-subscribe"[^>]*value="([^"]+)"/)?.[1];

  if (!nonce) throw new Error("could not find nonce on form page");
  return { nonce, formIdentifier };
}

/**
 * addToIcegramList({ email, firstName, lastName, interest, config })
 *
 * config (optional) — override the default coach list env vars:
 *   { formPageUrl, listHash, formId }
 *
 * If config is omitted, uses ICEGRAM_FORM_PAGE_URL / ICEGRAM_LIST_HASH / ICEGRAM_FORM_ID.
 */
export async function addToIcegramList({ email, firstName, lastName, interest, config } = {}) {
  const formPageUrl = config?.formPageUrl || FORM_PAGE_URL;
  const listHash    = config?.listHash    || LIST_HASH;
  const formId      = config?.formId      || FORM_ID;

  if (!formPageUrl || !listHash) {
    console.warn("[icegram] form page URL or list hash not configured — skipping");
    return { ok: false, reason: "not_configured" };
  }

  const ajaxUrl = (() => {
    const u = new URL(formPageUrl);
    return `${u.protocol}//${u.host}/wp-admin/admin-ajax.php`;
  })();

  try {
    const { nonce, formIdentifier } = await fetchNonce(formPageUrl);

    const body = new URLSearchParams();
    body.append("es", "subscribe");
    body.append("esfpx_email", email);
    body.append("esfpx_name", [firstName, lastName].filter(Boolean).join(" "));
    if (firstName) body.append("esfpx_first_name", firstName);
    if (lastName) body.append("esfpx_last_name", lastName);
    body.append("esfpx_lists[]", listHash);
    body.append("esfpx_form_id", formId);
    body.append("esfpx_es_form_identifier", formIdentifier || `f${formId}-n1`);
    body.append("esfpx_status", "Unconfirmed");
    body.append("esfpx_es-subscribe", nonce);
    body.append("esfpx_es_hp_email", "");
    body.append("es_gdpr_consent", "true");
    if (interest) body.append("esfpx_interest", interest);

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent":
        "Mozilla/5.0 (compatible; AwakeningDestinyCoach/1.0; +https://awakeningdestiny.global)",
      Referer: formPageUrl,
    };

    const attempts = [
      { label: "ajax:es_subscribe", url: `${ajaxUrl}?action=es_subscribe` },
      { label: "ajax:es_add_subscriber_from_request", url: `${ajaxUrl}?action=es_add_subscriber_from_request` },
      { label: "page", url: formPageUrl },
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

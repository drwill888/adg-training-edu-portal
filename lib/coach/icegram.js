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

  let html = null;

  // Try the configured page first. Fall back to the coach page if:
  //   (a) the page is unreachable (!res.ok), OR
  //   (b) the page loads but has no Icegram nonce (wrong URL, admin redirect, etc.)
  // WP nonces are site-wide — any page with the Icegram plugin active works.
  if (formPageUrl && formPageUrl !== FORM_PAGE_URL) {
    try {
      const res = await fetch(formPageUrl, { headers });
      if (res.ok) {
        const text = await res.text();
        if (/name="esfpx_es-subscribe"/.test(text)) {
          html = text; // page has the nonce — use it
        } else {
          console.warn(`[icegram] nonce not found at ${formPageUrl} — trying coach fallback`);
        }
      } else {
        console.warn(`[icegram] form page ${res.status} at ${formPageUrl} — trying coach fallback`);
      }
    } catch (err) {
      console.warn(`[icegram] form page fetch error at ${formPageUrl}: ${err.message} — trying coach fallback`);
    }
  }

  // Fall back to the coach page if we don't have HTML with a nonce yet
  if (!html) {
    if (!FORM_PAGE_URL) throw new Error("no usable form page URL configured");
    const res = await fetch(FORM_PAGE_URL, { headers });
    if (!res.ok) throw new Error(`coach form page fetch failed: ${res.status}`);
    html = await res.text();
  }

  const nonce = html.match(/name="esfpx_es-subscribe"[^>]*value="([^"]+)"/)?.[1];
  if (!nonce) throw new Error("could not find nonce on form page");

  // Extract the form identifier (e.g. f11-p6711-n1) — includes WP post ID so must be read from page
  const formIdentifier = html.match(/name="esfpx_es_form_identifier"\s+value="([^"]+)"/)?.[1] || null;

  // Extract email page ID and URL — required for page-fallback POST to succeed
  const emailPageId  = html.match(/name="esfpx_es_email_page"\s+value="([^"]+)"/)?.[1]     || null;
  const emailPageUrl = html.match(/name="esfpx_es_email_page_url"\s+value="([^"]+)"/)?.[1] || null;

  return { nonce, formIdentifier, emailPageId, emailPageUrl };
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
    const { nonce, formIdentifier, emailPageId, emailPageUrl } = await fetchNonce(formPageUrl);

    const body = new URLSearchParams();
    body.append("es", "subscribe");
    body.append("esfpx_email", email);
    body.append("esfpx_name", [firstName, lastName].filter(Boolean).join(" "));
    if (firstName) body.append("esfpx_first_name", firstName);
    if (lastName) body.append("esfpx_last_name", lastName);
    body.append("esfpx_lists[]", listHash);
    body.append("esfpx_form_id", formId);
    // Use identifier extracted from the page — it includes the WP post ID (e.g. f11-p6711-n1)
    // and must match exactly what Icegram generated. Fall back to f{formId}-n1 only if missing.
    body.append("esfpx_es_form_identifier", formIdentifier || `f${formId}-n1`);
    if (emailPageId)  body.append("esfpx_es_email_page",     emailPageId);
    if (emailPageUrl) body.append("esfpx_es_email_page_url", emailPageUrl);
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
      { label: "ajax:es_subscribe",                url: `${ajaxUrl}?action=es_subscribe`,                  isPage: false },
      { label: "ajax:es_add_subscriber_from_request", url: `${ajaxUrl}?action=es_add_subscriber_from_request`, isPage: false },
      { label: "page",                              url: formPageUrl,                                        isPage: true  },
    ];

    let last = null;
    for (const attempt of attempts) {
      const res = await fetch(attempt.url, {
        method: "POST",
        headers,
        body: body.toString(),
        redirect: attempt.isPage ? "follow" : "manual",   // follow redirect on page attempt
      });
      const text = await res.text();
      const trimmed = text.trim();

      // AJAX attempts: success = non-HTML, non-zero, non-error response
      //
      // Page attempt success detection (verified by live curl testing):
      //   - Fresh success   → form section present, es_subscription_message span is EMPTY
      //     (Icegram processes silently; JS would normally show "Successfully Subscribed.")
      //   - Error (rate-limit / email exists) → form section present, span has "error" class + text
      //   - Bad nonce       → form section ABSENT from response (~7 KB smaller than normal)
      //
      // Indicator: if `name="esfpx_es_form_identifier"` is in the response, the nonce was
      // valid and Icegram processed the submission — count that as success.
      // Rate-limit and "already exists" errors still mean the email is on the list.
      const looksLikeSuccess = attempt.isPage
        ? res.ok && /name="esfpx_es_form_identifier"/.test(trimmed)
        : res.ok &&
          trimmed !== "0" &&
          trimmed !== "-1" &&
          !trimmed.startsWith("<!") &&
          !trimmed.startsWith("<html") &&
          !/rest_forbidden|invalid|error/i.test(trimmed.slice(0, 200));

      // For page attempts log the subscription message content (empty = silent success)
      const logSnippet = attempt.isPage
        ? (trimmed.match(/class="es_subscription_message[^"]*"[^>]*>([^<]*)<\/span>/)?.[1]?.trim() ||
           (trimmed.includes("esfpx_es_form_identifier") ? "(subscribed — silent success)" : "(form section absent — nonce failed)"))
        : trimmed.slice(0, 120).replace(/\s+/g, " ");
      console.log(`[icegram] ${attempt.label}`, res.status, logSnippet);

      last = { ok: looksLikeSuccess, status: res.status, via: attempt.label, body: trimmed.slice(0, 200) };
      if (looksLikeSuccess) return last;
    }

    return last || { ok: false, reason: "no_attempts" };
  } catch (err) {
    console.error("[icegram] error", err.message);
    return { ok: false, error: err.message };
  }
}

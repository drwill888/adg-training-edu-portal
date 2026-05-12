// Helpers to extract clean text from URLs and PDFs for the coach KB.

function decodeEntities(s) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)));
}

export function htmlToText(html) {
  if (!html) return "";
  // Drop script/style/nav/footer chunks entirely
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "");

  // Preserve paragraph breaks
  cleaned = cleaned
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li|tr|br)>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  // Strip all remaining tags
  cleaned = cleaned.replace(/<[^>]+>/g, " ");
  cleaned = decodeEntities(cleaned);

  // Collapse whitespace
  cleaned = cleaned
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");

  return cleaned;
}

function extractTitle(html, fallback) {
  const og =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1];
  if (og) return decodeEntities(og).trim();
  const t = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1];
  if (t) return decodeEntities(t).trim();
  return fallback;
}

export async function fetchUrlAsDocument(rawUrl) {
  let url = rawUrl.trim();
  // Convert Google Doc share URL to plain-text export when possible
  const gdocMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (gdocMatch) {
    url = `https://docs.google.com/document/d/${gdocMatch[1]}/export?format=txt`;
  }

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; ADGCoachKbBot/1.0; +https://awakeningdestiny.global)",
      Accept: "text/html,text/plain,application/xhtml+xml,*/*;q=0.8",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`Fetch failed (${res.status}) for ${url}`);
  }

  const contentType = (res.headers.get("content-type") || "").toLowerCase();
  const body = await res.text();

  let content;
  let title;
  if (contentType.includes("text/html")) {
    content = htmlToText(body);
    title = extractTitle(body, url);
  } else {
    content = body.trim();
    title = url;
  }

  if (!content || content.length < 80) {
    throw new Error("Fetched content was empty or too short to ingest");
  }

  return { url, title, content };
}

export async function extractPdfText(buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  const out = await pdfParse(buffer);
  const text = (out.text || "")
    .split("\n")
    .map((l) => l.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n");
  if (!text || text.length < 80) {
    throw new Error("PDF parsed but contained no readable text");
  }
  return text;
}

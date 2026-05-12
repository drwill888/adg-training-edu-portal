// Import documents into the coach KB.
//   POST  body: { mode: "url",  url,  title? }                  → single URL
//   POST  body: { mode: "bulk", urls: [string, ...] }           → multiple URLs
//   POST  multipart/form-data with field "file"                 → PDF upload
//
// Auth: same admin email as /api/admin/coach-kb.

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { getEmbeddings } from "@/lib/embeddings";
import { fetchUrlAsDocument, extractPdfText } from "@/lib/coach/import-helpers";

const ADMIN_EMAIL = "meier.will@gmail.com";
const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;
const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB

export const config = {
  api: { bodyParser: { sizeLimit: "20mb" } },
};

function chunkText(text) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + CHUNK_SIZE, text.length);
    chunks.push(text.slice(start, end).trim());
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.length > 40);
}

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

async function ingest({ title, source, content, metadata = {} }) {
  const { data: doc, error: docErr } = await supabaseAdmin
    .from("coach_documents")
    .insert({ title, source: source || null, content, metadata })
    .select()
    .single();
  if (docErr) throw docErr;

  const chunks = chunkText(content);
  if (chunks.length === 0) return { id: doc.id, chunkCount: 0 };

  const embeddings = await getEmbeddings(chunks);
  const rows = chunks.map((chunk, i) => ({
    document_id: doc.id,
    content: chunk,
    embedding: embeddings[i],
    chunk_index: i,
    metadata,
  }));
  const { error: chunkErr } = await supabaseAdmin.from("coach_chunks").insert(rows);
  if (chunkErr) throw chunkErr;
  return { id: doc.id, chunkCount: rows.length };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  const email = await getCallerEmail(req);
  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // PDF upload — JSON body with { mode: "pdf", filename, base64 }
    if (req.body?.mode === "pdf") {
      const { filename, base64 } = req.body;
      if (!base64) return res.status(400).json({ error: "base64 file required" });
      const buf = Buffer.from(base64, "base64");
      if (buf.length > MAX_PDF_BYTES) {
        return res.status(413).json({ error: "PDF too large (max 15MB)" });
      }
      const text = await extractPdfText(buf);
      const title = filename ? filename.replace(/\.pdf$/i, "") : "Untitled PDF";
      const result = await ingest({
        title,
        source: "pdf",
        content: text,
        metadata: { filename },
      });
      return res.status(200).json({ ok: true, items: [{ title, ...result }] });
    }

    if (req.body?.mode === "url") {
      const { url, title } = req.body;
      if (!url) return res.status(400).json({ error: "url required" });
      const fetched = await fetchUrlAsDocument(url);
      const result = await ingest({
        title: title?.trim() || fetched.title,
        source: fetched.url,
        content: fetched.content,
        metadata: { url: fetched.url },
      });
      return res
        .status(200)
        .json({ ok: true, items: [{ url: fetched.url, title: title || fetched.title, ...result }] });
    }

    if (req.body?.mode === "bulk") {
      const urls = (req.body.urls || []).map((u) => u.trim()).filter(Boolean);
      if (urls.length === 0) return res.status(400).json({ error: "urls array required" });
      const items = [];
      for (const url of urls) {
        try {
          const fetched = await fetchUrlAsDocument(url);
          const result = await ingest({
            title: fetched.title,
            source: fetched.url,
            content: fetched.content,
            metadata: { url: fetched.url },
          });
          items.push({ url, title: fetched.title, ok: true, ...result });
        } catch (err) {
          items.push({ url, ok: false, error: err.message });
        }
      }
      return res.status(200).json({ ok: true, items });
    }

    return res.status(400).json({ error: "Unsupported mode" });
  } catch (err) {
    console.error("[admin/coach-kb-import] error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

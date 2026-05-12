// Admin CRUD for the coach knowledge base.
// GET    /api/admin/coach-kb              → list documents (id, title, source, chunk_count, updated_at)
// POST   /api/admin/coach-kb              → { title, source?, content, metadata? } create doc + chunks
// PUT    /api/admin/coach-kb?id=<uuid>    → { title?, source?, content?, metadata? } replace doc + chunks
// DELETE /api/admin/coach-kb?id=<uuid>    → delete document (chunks cascade)
//
// Auth: caller must be the admin email (verified via Supabase access token in Authorization header).

import { createClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase";
import { getEmbeddings } from "@/lib/embeddings";

const ADMIN_EMAIL = "meier.will@gmail.com";
const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

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

async function ingestChunks(docId, content, metadata) {
  const chunks = chunkText(content);
  if (chunks.length === 0) return 0;
  const embeddings = await getEmbeddings(chunks);
  const rows = chunks.map((chunk, i) => ({
    document_id: docId,
    content: chunk,
    embedding: embeddings[i],
    chunk_index: i,
    metadata: metadata || {},
  }));
  const { error } = await supabaseAdmin.from("coach_chunks").insert(rows);
  if (error) throw error;
  return rows.length;
}

export default async function handler(req, res) {
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  const email = await getCallerEmail(req);
  if (!email || email !== ADMIN_EMAIL.toLowerCase()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    if (req.method === "GET") {
      const { data: docs, error } = await supabaseAdmin
        .from("coach_documents")
        .select("id, title, source, content, metadata, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      const ids = docs.map((d) => d.id);
      const { data: chunks } = ids.length
        ? await supabaseAdmin
            .from("coach_chunks")
            .select("document_id")
            .in("document_id", ids)
        : { data: [] };
      const countByDoc = (chunks || []).reduce((acc, c) => {
        acc[c.document_id] = (acc[c.document_id] || 0) + 1;
        return acc;
      }, {});

      return res.status(200).json({
        documents: docs.map((d) => ({ ...d, chunk_count: countByDoc[d.id] || 0 })),
      });
    }

    if (req.method === "POST") {
      const { title, source, content, metadata } = req.body || {};
      if (!title || !content) {
        return res.status(400).json({ error: "title and content are required" });
      }
      const { data: doc, error: docErr } = await supabaseAdmin
        .from("coach_documents")
        .insert({ title, source: source || null, content, metadata: metadata || {} })
        .select()
        .single();
      if (docErr) throw docErr;
      const chunkCount = await ingestChunks(doc.id, content, metadata);
      return res.status(200).json({ id: doc.id, chunkCount });
    }

    if (req.method === "PUT") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id query param required" });
      const { title, source, content, metadata } = req.body || {};

      const patch = {};
      if (title !== undefined) patch.title = title;
      if (source !== undefined) patch.source = source || null;
      if (content !== undefined) patch.content = content;
      if (metadata !== undefined) patch.metadata = metadata || {};

      const { error: updErr } = await supabaseAdmin
        .from("coach_documents")
        .update(patch)
        .eq("id", id);
      if (updErr) throw updErr;

      if (content !== undefined) {
        const { error: delErr } = await supabaseAdmin
          .from("coach_chunks")
          .delete()
          .eq("document_id", id);
        if (delErr) throw delErr;
        const chunkCount = await ingestChunks(id, content, metadata);
        return res.status(200).json({ id, chunkCount, rechunked: true });
      }

      return res.status(200).json({ id, rechunked: false });
    }

    if (req.method === "DELETE") {
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: "id query param required" });
      const { error } = await supabaseAdmin
        .from("coach_documents")
        .delete()
        .eq("id", id);
      if (error) throw error;
      return res.status(200).json({ id, deleted: true });
    }

    res.setHeader("Allow", "GET, POST, PUT, DELETE");
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("[admin/coach-kb] error", err);
    return res.status(500).json({ error: err.message || "Server error" });
  }
}

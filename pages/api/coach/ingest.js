import { supabaseAdmin } from "@/lib/supabase";
import { getEmbeddings } from "@/lib/embeddings";

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

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const token = req.headers["x-ingest-token"];
  if (!token || token !== process.env.COACH_INGEST_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  if (!supabaseAdmin) return res.status(500).json({ error: "Database is not configured" });

  const { title, source, content, metadata = {} } = req.body;
  if (!title || !content) return res.status(400).json({ error: "title and content are required" });

  try {
    const { data: doc, error: docError } = await supabaseAdmin
      .from("coach_documents")
      .insert({ title, source: source || null, content, metadata })
      .select()
      .single();

    if (docError) throw docError;

    const chunks = chunkText(content);
    const embeddings = await getEmbeddings(chunks);

    const rows = chunks.map((chunk, i) => ({
      document_id: doc.id,
      content: chunk,
      embedding: embeddings[i],
      chunk_index: i,
      metadata,
    }));

    const { error: chunkError } = await supabaseAdmin.from("coach_chunks").insert(rows);
    if (chunkError) throw chunkError;

    return res.status(200).json({ success: true, documentId: doc.id, chunkCount: rows.length });
  } catch (err) {
    console.error("Ingest error:", err);
    return res.status(500).json({ error: "Failed to ingest document" });
  }
}

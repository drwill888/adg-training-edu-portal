// pages/api/admin/edu-kb.js
// CRUD for the Edu knowledge base (coach_chunks with source = product_slug).
// GET    /api/admin/edu-kb?slug=child-education    → list documents
// POST   /api/admin/edu-kb                         → add document (chunks + embeds)
// DELETE /api/admin/edu-kb?id=<doc_id>             → delete document + its chunks
import { createClient } from '@supabase/supabase-js';
import { getEmbeddings } from '@/lib/embeddings';

const ADMIN_EMAIL  = 'meier.will@gmail.com';
const CHUNK_SIZE   = 600; // chars per chunk

async function getAdmin(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return null;
  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { data } = await client.auth.getUser(token);
  return data?.user?.email === ADMIN_EMAIL ? data.user : null;
}

function chunkText(text) {
  const paragraphs = text.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const chunks = [];
  let current = '';
  for (const para of paragraphs) {
    if ((current + '\n\n' + para).length > CHUNK_SIZE && current) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? current + '\n\n' + para : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length ? chunks : [text.trim()];
}

export default async function handler(req, res) {
  const user = await getAdmin(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { id, slug = 'child-education' } = req.query;

  // ── DELETE document + its chunks ─────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    // Get the doc to find its title (used as chunk group tag)
    const { data: doc } = await supabase.from('edu_documents').select('title').eq('id', id).single();
    // Delete chunks tagged with this doc id
    await supabase.from('coach_chunks').delete().eq('document_id', id);
    // Delete the document record
    const { error } = await supabase.from('edu_documents').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── GET list ─────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('edu_documents')
      .select('id, title, chunk_count, created_at, updated_at')
      .eq('product_slug', slug)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ documents: data || [] });
  }

  // ── POST: add new document ────────────────────────────────────────────────
  if (req.method === 'POST') {
    const { title, content, productSlug = slug } = req.body || {};
    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ error: 'title and content are required' });
    }

    // Insert document record first
    const { data: doc, error: docErr } = await supabase
      .from('edu_documents')
      .insert({ product_slug: productSlug, title: title.trim(), content: content.trim() })
      .select()
      .single();

    if (docErr) return res.status(500).json({ error: docErr.message });

    // Chunk + embed
    const chunks   = chunkText(content.trim());
    const embeddings = await getEmbeddings(chunks);

    const rows = chunks.map((c, i) => ({
      content:     c,
      embedding:   embeddings[i],
      source:      productSlug,
      document_id: doc.id,
    }));

    const { error: chunkErr } = await supabase.from('coach_chunks').insert(rows);
    if (chunkErr) return res.status(500).json({ error: chunkErr.message });

    // Update chunk count
    await supabase
      .from('edu_documents')
      .update({ chunk_count: rows.length, updated_at: new Date().toISOString() })
      .eq('id', doc.id);

    return res.status(200).json({ ok: true, id: doc.id, chunkCount: rows.length });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

// pages/api/admin/edu-conversations.js
// List, read, and delete Ezra Edu (book) conversations.
// GET  /api/admin/edu-conversations?slug=child-education        → list
// GET  /api/admin/edu-conversations?id=<id>                     → thread
// DELETE /api/admin/edu-conversations?id=<id>                   → delete
import { createClient } from '@supabase/supabase-js';

const ADMIN_EMAIL = 'meier.will@gmail.com';

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

export default async function handler(req, res) {
  const user = await getAdmin(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { id, slug = 'child-education' } = req.query;

  // ── DELETE ───────────────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    if (!id) return res.status(400).json({ error: 'id required' });
    await supabase.from('coach_messages').delete().eq('conversation_id', id);
    const { error } = await supabase.from('coach_conversations').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // ── GET thread ───────────────────────────────────────────────────────────
  if (id) {
    const { data: conv } = await supabase
      .from('coach_conversations')
      .select('*')
      .eq('id', id)
      .single();

    const { data: messages } = await supabase
      .from('coach_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    return res.status(200).json({ conversation: conv, messages: messages || [] });
  }

  // ── GET list ─────────────────────────────────────────────────────────────
  const { data: conversations, error } = await supabase
    .from('coach_conversations')
    .select(`
      id, session_id, product_slug, created_at, updated_at,
      coach_messages(count)
    `)
    .eq('product_slug', slug)
    .order('updated_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ error: error.message });

  const list = (conversations || []).map((c) => ({
    id:            c.id,
    session_id:    c.session_id,
    product_slug:  c.product_slug,
    updated_at:    c.updated_at,
    created_at:    c.created_at,
    message_count: c.coach_messages?.[0]?.count ?? 0,
  }));

  return res.status(200).json({ conversations: list });
}

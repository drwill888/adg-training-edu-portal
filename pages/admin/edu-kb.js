// Admin: manage the Ezra Edu (book) knowledge base.
// Documents are stored in edu_documents and chunked into coach_chunks with source='child-education'.
// GET    /api/admin/edu-kb?slug=child-education    → list
// POST   /api/admin/edu-kb                         → add (chunks + embeds)
// DELETE /api/admin/edu-kb?id=<doc_id>             → remove doc + chunks
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AdminNav from '../../components/AdminNav';
import { useIsMobile } from '../../lib/useBreakpoint';

const ADMIN_EMAIL = 'meier.will@gmail.com';
const NAVY   = '#021A35';
const GOLD   = '#FDD20D';
const CREAM  = '#FDF8F0';
const BORDER = 'rgba(2,26,53,0.12)';

const inputStyle = {
  padding: '10px 12px', borderRadius: 8, border: `1px solid ${BORDER}`,
  fontSize: 14, fontFamily: 'inherit', outline: 'none',
  width: '100%', boxSizing: 'border-box',
};

const btn = (variant = 'primary') => ({
  padding: '10px 18px', borderRadius: 8,
  border: variant === 'primary' ? 'none' : variant === 'danger' ? 'none' : `1px solid ${BORDER}`,
  background: variant === 'primary' ? NAVY : variant === 'danger' ? '#ef4444' : 'white',
  color: variant === 'primary' || variant === 'danger' ? GOLD : NAVY,
  fontWeight: 600, fontSize: 13, cursor: 'pointer',
});

export default function EduKbAdmin() {
  const isMobile = useIsMobile();
  const [user, setUser]             = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [documents, setDocuments]   = useState([]);
  const [loading, setLoading]       = useState(false);
  const [adding, setAdding]         = useState(false); // show add form
  const [form, setForm]             = useState({ title: '', content: '' });
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const [error, setError]           = useState('');
  const [status, setStatus]         = useState('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      setAuthChecked(true);
    });
  }, []);

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    return data.session ? `Bearer ${data.session.access_token}` : '';
  }

  async function loadDocs() {
    setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/admin/edu-kb?slug=child-education', {
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load');
      setDocuments(json.documents || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) loadDocs();
  }, [user]);

  async function save() {
    if (!form.title.trim() || !form.content.trim()) {
      return setError('Title and content are both required.');
    }
    setSaving(true);
    setError('');
    setStatus('Embedding and saving…');
    try {
      const res = await fetch('/api/admin/edu-kb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: await authHeader() },
        body: JSON.stringify({
          title:       form.title.trim(),
          content:     form.content.trim(),
          productSlug: 'child-education',
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Save failed');
      setStatus(`Saved — ${json.chunkCount} chunk${json.chunkCount !== 1 ? 's' : ''} created.`);
      setForm({ title: '', content: '' });
      setAdding(false);
      await loadDocs();
    } catch (e) { setError(e.message); setStatus(''); }
    finally { setSaving(false); }
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.title}"? This also removes all its embedded chunks.`)) return;
    setDeleting(doc.id);
    setError('');
    try {
      const res  = await fetch(`/api/admin/edu-kb?id=${doc.id}`, {
        method: 'DELETE',
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Delete failed');
      setStatus('Deleted.');
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (e) { setError(e.message); }
    finally { setDeleting(null); }
  }

  if (!authChecked) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <div style={{ padding: 40 }}>Please <a href="/login">log in</a>.</div>;
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) return <div style={{ padding: 40 }}>Not authorized.</div>;

  return (
    <main style={{ minHeight: '100vh', background: CREAM, fontFamily: "'Outfit', sans-serif" }}>
      <AdminNav />
      <div style={{ maxWidth: 960, margin: '0 auto', padding: isMobile ? '20px 14px' : '32px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', gap: isMobile ? 16 : 12, marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, color: NAVY, margin: 0 }}>
              Ezra · Edu Knowledge Base
            </h1>
            <p style={{ color: 'rgba(2,26,53,0.6)', fontSize: 13, margin: '4px 0 0' }}>
              Documents Ezra Edu retrieves from when answering book subscribers. Add passages from the manuscript or polished Q&amp;As promoted from conversations.
            </p>
          </div>
          {!adding && (
            <button style={{ ...btn('primary'), whiteSpace: 'nowrap' }} onClick={() => { setAdding(true); setError(''); setStatus(''); }}>
              + Add document
            </button>
          )}
        </div>

        {/* Status / Error */}
        {error  && <div style={{ background: '#fee2e2', color: '#991b1b', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{error}</div>}
        {status && <div style={{ background: '#dcfce7', color: '#166534', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{status}</div>}

        {/* Add form */}
        {adding && (
          <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 12 }}>New KB document</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input
                placeholder="Title (e.g. 'Chapter 3 — Learning Styles')"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
              />
              <textarea
                placeholder="Paste the content here — manuscript passages, Q&As, or key principles. Gets chunked at ~600 chars and embedded for retrieval."
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={14}
                style={{ ...inputStyle, resize: 'vertical' }}
              />
              <div style={{ fontSize: 12, color: 'rgba(2,26,53,0.55)' }}>
                Tip: separate distinct sections with a blank line so the chunker splits cleanly between ideas.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button style={btn('secondary')} onClick={() => { setAdding(false); setForm({ title: '', content: '' }); setError(''); }}>Cancel</button>
                <button style={btn('primary')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save & embed'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Document list */}
        <div style={{ background: 'white', border: `1px solid ${BORDER}`, borderRadius: 12, overflow: 'hidden' }}>
          {/* Table header (desktop) */}
          {!isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px', padding: '12px 16px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'rgba(2,26,53,0.5)', borderBottom: `1px solid ${BORDER}` }}>
              <div>Title</div>
              <div>Added</div>
              <div>Chunks</div>
              <div style={{ textAlign: 'right' }}>Action</div>
            </div>
          )}

          {loading && <div style={{ padding: 20, color: 'rgba(2,26,53,0.6)', fontSize: 14 }}>Loading…</div>}
          {!loading && documents.length === 0 && (
            <div style={{ padding: 20, color: 'rgba(2,26,53,0.6)', fontSize: 14 }}>
              No documents yet. Click "Add document" to start building the knowledge base, or promote a good answer from <a href="/admin/edu-conversations" style={{ color: NAVY }}>Edu Conversations</a>.
            </div>
          )}

          {documents.map((d) =>
            isMobile ? (
              <div key={d.id} style={{ padding: '14px 14px', borderBottom: `1px solid ${BORDER}`, color: NAVY }}>
                <div style={{ fontWeight: 600, fontSize: 14, wordBreak: 'break-word' }}>{d.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(2,26,53,0.6)', marginTop: 4 }}>
                  {new Date(d.created_at).toLocaleDateString()} · {d.chunk_count} chunk{d.chunk_count !== 1 ? 's' : ''}
                </div>
                <div style={{ marginTop: 10 }}>
                  <button style={{ ...btn('danger'), padding: '7px 14px', fontSize: 12 }} disabled={deleting === d.id} onClick={() => remove(d)}>
                    {deleting === d.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            ) : (
              <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 80px 100px', padding: '14px 16px', fontSize: 14, color: NAVY, borderBottom: `1px solid ${BORDER}`, alignItems: 'center' }}>
                <div style={{ fontWeight: 600 }}>{d.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(2,26,53,0.6)' }}>{new Date(d.created_at).toLocaleDateString()}</div>
                <div style={{ fontSize: 13 }}>{d.chunk_count}</div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button style={{ ...btn('danger'), padding: '7px 14px', fontSize: 12 }} disabled={deleting === d.id} onClick={() => remove(d)}>
                    {deleting === d.id ? 'Deleting…' : 'Delete'}
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        {/* Footer hint */}
        <p style={{ fontSize: 12, color: 'rgba(2,26,53,0.45)', marginTop: 16, textAlign: 'center' }}>
          All documents shown are scoped to <strong>child-education</strong>. Use{' '}
          <a href="/admin/edu-conversations" style={{ color: NAVY }}>Edu Conversations</a> to promote a great answer directly into this KB.
        </p>
      </div>
    </main>
  );
}

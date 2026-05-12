import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClient } from '@supabase/supabase-js';
import Head from 'next/head';
import AdminNav from '../../components/AdminNav';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function BlueprintApplications() {
  const router = useRouter();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [processing, setProcessing] = useState(null);
  const [noteTarget, setNoteTarget] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => { fetchApps(); }, [filter]);

async function fetchApps() {
    setLoading(true);
    const res = await fetch(`/api/admin/get-blueprint-applications?status=${filter}`);
    const data = await res.json();
    setApps(data.applications || []);
    setLoading(false);
  }
  
  async function handleAction(id, action) {
    setProcessing(id);
    const res = await fetch('/api/admin/approve-blueprint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: id, action, notes: noteTarget === id ? note : '' }),
    });
    if (res.ok) { setNoteTarget(null); setNote(''); await fetchApps(); }
    else { const d = await res.json(); alert(d.error || 'Failed'); }
    setProcessing(null);
  }

  const STATUS = { pending: { bg: '#FEF3C7', text: '#92400E' }, approved: { bg: '#D1FAE5', text: '#065F46' }, rejected: { bg: '#FEE2E2', text: '#991B1B' } };

  return (
    <>
      <Head><title>Blueprint Applications — ADG Admin</title></Head>
      <div style={{ minHeight: '100vh', background: '#F8F9FA', fontFamily: "'Outfit', sans-serif" }}>
        <AdminNav />
        <div style={{ background: '#021A35', padding: '20px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ color: '#FDD20D', margin: 0, fontSize: 20, fontWeight: 600 }}>ADG Admin</h1>
            <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 13 }}>Blueprint Applications</p>
          </div>
          <button onClick={() => router.push('/dashboard')}
            style={{ background: 'transparent', border: '1px solid #334155', color: '#94a3b8', padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
            Dashboard
          </button>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {['pending', 'approved', 'rejected', 'all'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{ padding: '8px 20px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  background: filter === f ? '#021A35' : '#E2E8F0', color: filter === f ? 'white' : '#475569' }}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {loading ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 60 }}>Loading...</p>
          ) : apps.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', padding: 60 }}>No {filter !== 'all' ? filter : ''} applications.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {apps.map(app => {
                const sc = STATUS[app.status] || STATUS.pending;
                return (
                  <div key={app.id} style={{ background: 'white', borderRadius: 12, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: '#021A35' }}>{app.first_name} {app.last_name}</h3>
                          <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 12, background: sc.bg, color: sc.text, textTransform: 'uppercase' }}>
                            {app.status}
                          </span>
                          {app.paid_at && <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>Paid ✓</span>}
                        </div>
                        <a href={`mailto:${app.email}`} style={{ color: '#0172BC', fontSize: 14, textDecoration: 'none' }}>{app.email}</a>
                        {app.phone && <span style={{ color: '#64748b', fontSize: 14, marginLeft: 16 }}>{app.phone}</span>}
                      </div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>
                        {new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 12 }}>
                      {[['Archetype', app.archetype], ['Stage', app.leadership_stage], ['City', app.city]].map(([l, v]) => v ? (
                        <div key={l}><div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                          <div style={{ fontSize: 14, color: '#334155' }}>{v}</div></div>
                      ) : null)}
                    </div>
                    {app.business_or_ministry && <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Business / Ministry</div>
                      <div style={{ fontSize: 14, color: '#334155' }}>{app.business_or_ministry}</div>
                    </div>}
                    {app.why_now && <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: 3 }}>Why Now</div>
                      <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.5 }}>{app.why_now}</div>
                    </div>}

                    {noteTarget === app.id && (
                      <textarea value={note} onChange={e => setNote(e.target.value)}
                        placeholder="Optional note sent to applicant in approval email..."
                        rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginTop: 12 }} />
                    )}

                    {app.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}>
                        <button
                          onClick={() => noteTarget === app.id ? handleAction(app.id, 'approve') : setNoteTarget(app.id)}
                          disabled={processing === app.id}
                          style={{ background: noteTarget === app.id ? '#10B981' : '#021A35', color: 'white', border: 'none', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: processing === app.id ? 0.6 : 1 }}>
                          {processing === app.id ? 'Processing...' : noteTarget === app.id ? 'Confirm Approve + Send Email' : 'Approve'}
                        </button>
                        <button onClick={() => handleAction(app.id, 'reject')} disabled={processing === app.id}
                          style={{ background: 'white', color: '#DC2626', border: '1px solid #DC2626', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                          Reject
                        </button>
                        {noteTarget === app.id && (
                          <button onClick={() => { setNoteTarget(null); setNote(''); }}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  return { props: {} };
}
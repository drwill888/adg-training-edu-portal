// pages/mid-journey-report.js
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const OFFICE_DISPLAY = {
  apostolic: 'Apostolic', prophetic: 'Prophetic', evangelistic: 'Evangelistic',
  pastoral: 'Pastoral', teaching: 'Teaching',
};
const OVERLAY_DISPLAY = {
  builder: 'Builder', burden_bearer: 'Burden Bearer', reformer: 'Reformer',
  covenant_keeper: 'Covenant Keeper', equipper: 'Equipper',
};

const backButtonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  padding: '10px 20px',
  backgroundColor: '#FDD20D',
  color: '#021A35',
  fontFamily: 'Outfit, sans-serif',
  fontWeight: '700',
  fontSize: '15px',
  borderRadius: '6px',
  textDecoration: 'none',
  letterSpacing: '0.02em',
};

export default function MidJourneyReportPage() {
  const [state, setState] = useState({ loading: true, report: null, userId: null });

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        window.location.href = '/login?redirect=/mid-journey-report';
        return;
      }

      const res = await fetch('/api/mid-journey/get-report', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!res.ok) {
        window.location.href = '/login?redirect=/mid-journey-report';
        return;
      }

      const { report, userId } = await res.json();
      setState({ loading: false, report, userId });
    })();
  }, []);

  function handleDownload() {
    if (!state.userId) return;
    window.location.href = `/api/mid-journey/download-docx?userId=${state.userId}`;
  }

  if (state.loading) {
    return (
      <div style={styles.page}>
        <main style={styles.main}>
          <p style={styles.loading}>Loading your report…</p>
        </main>
      </div>
    );
  }

  if (!state.report) {
    return (
      <div style={styles.page}>
        <Head><title>Mid-Journey Blueprint — Awakening Destiny</title></Head>
        <main style={styles.main}>
          <p style={styles.eyebrow}>Mid-Journey Blueprint</p>
          <h1 style={styles.lockedTitle}>Not Yet Unlocked</h1>
          <p style={styles.lockedBody}>
            Your Mid-Journey Blueprint becomes available after you complete the Capacity module (Module 4).
          </p>
          <div style={{ textAlign: 'center' }}>
            <a href="/dashboard" style={backButtonStyle}>
              ← Back to Dashboard
            </a>
          </div>
        </main>
      </div>
    );
  }

  const officeName = OFFICE_DISPLAY[state.report.archetype_office] || state.report.archetype_office;
  const overlayName = OVERLAY_DISPLAY[state.report.archetype_overlay] || state.report.archetype_overlay;
  const archetypeDisplay = `The ${officeName} ${overlayName}`;

  return (
    <div style={styles.page}>
      <Head>
        <title>Your Mid-Journey Blueprint — Awakening Destiny</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <main style={styles.main}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Mid-Journey Blueprint · Your Report</p>
          <h1 style={styles.title}>{archetypeDisplay}</h1>
          <p style={styles.subtitle}>Generated at the Capacity threshold — your formation diagnostic across Calling, Connection, Competency, and Capacity.</p>
        </div>
        <div style={styles.actionRow}>
          <button onClick={handleDownload} style={styles.downloadBtn}>
            Download as Word Document
          </button>
          <a href="/dashboard" style={backButtonStyle}>
            ← Back to Dashboard
          </a>
        </div>
        <article style={styles.article}>
          {renderMarkdown(state.report.content)}
        </article>
        <div style={styles.footer}>
          <p style={styles.footerNote}>
            Generated {new Date(state.report.generated_at).toLocaleDateString('en-US', {
              month: 'long', day: 'numeric', year: 'numeric'
            })} · Awakening Destiny Global
          </p>
          <p style={{ fontSize: '0.7rem', opacity: 0.35, marginTop: '0.75rem', lineHeight: 1.6 }}>
            © {new Date().getFullYear()} Awakening Destiny Global. All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.
          </p>
        </div>
      </main>
    </div>
  );
}

function renderMarkdown(text) {
  if (!text) return null;
  return text.trim().split(/\n\n+/).map((block, i) => {
    if (block.startsWith('## ')) {
      return <h2 key={i} style={styles.h2}>{block.replace(/^## /, '')}</h2>;
    }
    const parts = block.split(/(\*[^*]+\*)/g).map((part, j) => {
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={j} style={styles.italic}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
    return <p key={i} style={styles.para}>{parts}</p>;
  });
}

const styles = {
  page: { background: '#021A35', minHeight: '100vh', color: '#FDF8F0', fontFamily: "'Outfit', sans-serif" },
  main: { maxWidth: '720px', margin: '0 auto', padding: '4rem 1.5rem 6rem' },
  loading: { textAlign: 'center', opacity: 0.6, padding: '4rem 0', fontFamily: "'Outfit', sans-serif" },
  header: { textAlign: 'center', marginBottom: '2rem' },
  eyebrow: { color: '#C8A951', letterSpacing: '0.14em', fontSize: '0.78rem', textTransform: 'uppercase', marginBottom: '1.5rem', fontWeight: 500 },
  title: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2.2rem, 6vw, 3.6rem)', fontWeight: 400, lineHeight: 1.1, marginBottom: '1rem' },
  subtitle: { fontSize: '1rem', lineHeight: 1.6, opacity: 0.7, fontStyle: 'italic', maxWidth: '520px', margin: '0 auto' },
  actionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' },
  downloadBtn: { background: '#C8A951', color: '#021A35', border: 'none', borderRadius: '4px', padding: '0.8rem 1.6rem', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  article: { fontFamily: 'Georgia, serif' },
  h2: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.4rem, 3.5vw, 1.9rem)', fontWeight: 400, color: '#C8A951', marginTop: '2.5rem', marginBottom: '1rem', borderBottom: '1px solid rgba(200,169,81,0.2)', paddingBottom: '0.5rem' },
  para: { fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '1.25rem', opacity: 0.92 },
  italic: { fontStyle: 'italic', color: '#FDD20D' },
  footer: { textAlign: 'center', marginTop: '4rem', paddingTop: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)' },
  footerNote: { fontSize: '0.78rem', opacity: 0.45, letterSpacing: '0.05em' },
  lockedTitle: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2.5rem', fontWeight: 400, textAlign: 'center', marginBottom: '1.5rem' },
  lockedBody: { fontSize: '1.05rem', lineHeight: 1.7, textAlign: 'center', opacity: 0.8, maxWidth: '480px', margin: '1rem auto 2.5rem' },
};
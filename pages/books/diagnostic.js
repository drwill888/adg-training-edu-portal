// pages/books/diagnostic.js
// Fillable HTML version of the Child Strategic Plan Diagnostic.
// Auto-expanding textareas, cloud save/load by email, AI summary (paid).

import Head from 'next/head';
import { useState, useEffect, useRef, useCallback } from 'react';

const NAVY = '#1e2a4a';
const GOLD = '#c8a45a';
const CREAM = '#fdf8f0';
const BODY  = '#2d2d2d';
const RULE  = '#e0e0e0';
const FIELD_BG = '#f9f9f9';
const STORAGE_KEY = 'ezra-edu-diagnostic-v1';
const PRODUCT_SLUG = 'child-education';

// ─── Auto-resize textarea ───────────────────────────────────────────────────
function Field({ name, label, value, onChange, rows = 3 }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto';
      ref.current.style.height = ref.current.scrollHeight + 'px';
    }
  }, [value]);

  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && (
        <label style={{ display: 'block', fontSize: '0.9rem', color: BODY, fontWeight: 500, marginBottom: 6, lineHeight: 1.5 }}>
          {label}
        </label>
      )}
      {/* Screen: editable textarea */}
      <textarea
        ref={ref}
        className="screen-field"
        rows={rows}
        value={value || ''}
        onChange={(e) => onChange(name, e.target.value)}
        style={{
          width: '100%', boxSizing: 'border-box',
          border: `1px solid #d0d0d0`, borderRadius: 6,
          padding: '10px 12px', fontSize: '0.9rem',
          fontFamily: 'inherit', lineHeight: 1.6,
          color: BODY, background: FIELD_BG,
          resize: 'none', overflow: 'hidden',
          minHeight: `${rows * 1.6 * 14 + 20}px`,
          transition: 'border-color 0.15s',
          outline: 'none',
        }}
        onFocus={e => e.target.style.borderColor = GOLD}
        onBlur={e => e.target.style.borderColor = '#d0d0d0'}
      />
      {/* Print: plain text box — shows the filled value reliably across all browsers */}
      <div
        className="print-field"
        style={{
          border: `1px solid #bbb`, borderRadius: 6,
          padding: '10px 12px', fontSize: '0.9rem',
          lineHeight: 1.6, color: BODY, background: 'white',
          minHeight: `${rows * 1.6 * 14 + 20}px`,
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        }}
      >
        {value || ''}
      </div>
    </div>
  );
}

// ─── Checkbox ───────────────────────────────────────────────────────────────
function Check({ name, label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 8, fontSize: '0.88rem', color: BODY, lineHeight: 1.5 }}>
      {/* Screen checkbox */}
      <input
        type="checkbox"
        className="screen-field"
        checked={!!checked}
        onChange={e => onChange(name, e.target.checked)}
        style={{ marginTop: 3, accentColor: NAVY, flexShrink: 0, width: 14, height: 14 }}
      />
      {/* Print indicator */}
      <span className="print-check" style={{ flexShrink: 0, marginTop: 2, fontSize: '0.95rem', lineHeight: 1 }}>
        {checked ? '☑' : '☐'}
      </span>
      {label}
    </label>
  );
}

// ─── Inline checkbox group ───────────────────────────────────────────────────
function CheckGroup({ prefix, options, values, onChange, namePrefix }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {prefix && <p style={{ fontSize: '0.9rem', color: BODY, fontWeight: 500, marginBottom: 8 }}>{prefix}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 20px' }}>
        {options.map(opt => (
          <Check
            key={opt}
            name={`${namePrefix}_${opt}`}
            label={opt}
            checked={values?.[`${namePrefix}_${opt}`]}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Numbered fields ─────────────────────────────────────────────────────────
function NumberedFields({ count, label, namePrefix, values, onChange }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      {label && <p style={{ fontSize: '0.9rem', color: BODY, fontWeight: 500, marginBottom: 10 }}>{label}</p>}
      {Array.from({ length: count }, (_, i) => {
        const val = values?.[`${namePrefix}_${i + 1}`] || '';
        return (
          <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: GOLD, marginTop: 10, flexShrink: 0, minWidth: 18 }}>{i + 1}.</span>
            {/* Screen */}
            <textarea
              className="screen-field"
              rows={2}
              value={val}
              onChange={e => onChange(`${namePrefix}_${i + 1}`, e.target.value)}
              style={{
                flex: 1, border: `1px solid #d0d0d0`, borderRadius: 6,
                padding: '8px 12px', fontSize: '0.9rem', fontFamily: 'inherit',
                lineHeight: 1.6, color: BODY, background: FIELD_BG,
                resize: 'none', overflow: 'hidden', minHeight: 52,
              }}
              onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e => e.target.style.borderColor = '#d0d0d0'}
            />
            {/* Print */}
            <div
              className="print-field"
              style={{
                flex: 1, border: '1px solid #bbb', borderRadius: 6,
                padding: '8px 12px', fontSize: '0.9rem', lineHeight: 1.6,
                color: BODY, background: 'white', minHeight: 52,
                whiteSpace: 'pre-wrap', wordBreak: 'break-word',
              }}
            >{val}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────
function SectionHeader({ num, title, tagline }) {
  return (
    <div style={{ marginBottom: '1.5rem', paddingTop: '1.5rem' }}>
      <p style={{ color: GOLD, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 4, fontFamily: 'Outfit, sans-serif' }}>
        Section {num}
      </p>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', fontWeight: 600, color: NAVY, marginBottom: tagline ? 4 : 0 }}>
        {title}
      </h2>
      {tagline && <p style={{ fontSize: '0.85rem', color: GOLD, fontStyle: 'italic', margin: 0 }}>{tagline}</p>}
      <div style={{ height: 1, background: NAVY, marginTop: 10 }} />
    </div>
  );
}

function H1({ children }) {
  return (
    <div style={{ marginBottom: '1.25rem', paddingTop: '1.25rem' }}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.5rem', fontWeight: 600, color: NAVY, marginBottom: 6 }}>{children}</h2>
      <div style={{ height: 1, background: NAVY }} />
    </div>
  );
}

function Body({ children, italic }) {
  return (
    <p style={{ fontSize: '0.9rem', color: BODY, lineHeight: 1.75, marginBottom: '1rem', fontStyle: italic ? 'italic' : 'normal' }}>
      {children}
    </p>
  );
}

function Bold({ children }) {
  return <p style={{ fontSize: '0.9rem', color: BODY, fontWeight: 700, marginBottom: 8 }}>{children}</p>;
}

// ─── MI Table ────────────────────────────────────────────────────────────────
function MITable({ values, onChange }) {
  const intelligences = [
    'Linguistic (words, reading, writing)',
    'Logical-Mathematical (patterns, reasoning)',
    'Spatial (visual, design, navigation)',
    'Bodily-Kinesthetic (movement, hands-on)',
    'Musical (rhythm, melody, sound)',
    'Interpersonal (reading people, leading)',
    'Intrapersonal (self-awareness, reflection)',
    'Naturalistic (living systems, environment)',
  ];
  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    border: `1px solid #d0d0d0`, borderRadius: 4,
    padding: '6px 8px', fontSize: '0.82rem',
    fontFamily: 'inherit', color: BODY, background: FIELD_BG,
    outline: 'none',
  };
  return (
    <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: NAVY }}>
            {['Intelligence', 'Strength 1–5', 'Evidence / Notes'].map(h => (
              <th key={h} style={{ color: 'white', textAlign: 'left', padding: '8px 10px', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {intelligences.map((intel, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#eef2fa' : 'white', borderBottom: `1px solid ${RULE}` }}>
              <td style={{ padding: '8px 10px', fontSize: '0.83rem', color: BODY }}>{intel}</td>
              <td style={{ padding: '6px 8px', minWidth: 80 }}>
                <select
                  className="screen-field"
                  value={values?.[`mi_rating_${i}`] || ''}
                  onChange={e => onChange(`mi_rating_${i}`, e.target.value)}
                  style={{ ...inputStyle, width: '100%' }}
                >
                  <option value="">—</option>
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className="print-field" style={{ fontSize: '0.85rem', fontWeight: 700 }}>{values?.[`mi_rating_${i}`] || '—'}</span>
              </td>
              <td style={{ padding: '6px 8px' }}>
                <input
                  type="text"
                  className="screen-field"
                  value={values?.[`mi_notes_${i}`] || ''}
                  onChange={e => onChange(`mi_notes_${i}`, e.target.value)}
                  placeholder="Observed moment, habit, or unprompted choice…"
                  style={{ ...inputStyle }}
                />
                <span className="print-field" style={{ fontSize: '0.83rem' }}>{values?.[`mi_notes_${i}`] || ''}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Review Table ────────────────────────────────────────────────────────────
function ReviewTable({ values, onChange }) {
  const rows = ['Month 1', 'Month 2', 'Month 3 — Plan Refresh'];
  const cols = ["What's Working", "What's Not", 'Adjustment'];
  return (
    <div style={{ marginBottom: '1.5rem', overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: NAVY }}>
            {['Checkpoint', ...cols].map(h => (
              <th key={h} style={{ color: 'white', textAlign: 'left', padding: '8px 10px', fontWeight: 600, fontSize: '0.8rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? '#eef2fa' : 'white', borderBottom: `1px solid ${RULE}` }}>
              <td style={{ padding: '8px 10px', fontWeight: 700, fontSize: '0.83rem', color: BODY, whiteSpace: 'nowrap' }}>{row}</td>
              {cols.map(col => {
                const rv = values?.[`review_${i}_${col}`] || '';
                return (
                  <td key={col} style={{ padding: '6px 8px', verticalAlign: 'top' }}>
                    {/* Screen */}
                    <textarea
                      className="screen-field"
                      rows={2}
                      value={rv}
                      onChange={e => onChange(`review_${i}_${col}`, e.target.value)}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        border: `1px solid #d0d0d0`, borderRadius: 4,
                        padding: '5px 8px', fontSize: '0.82rem',
                        fontFamily: 'inherit', color: BODY, background: '#fafafa',
                        resize: 'none', overflow: 'hidden', minHeight: 52,
                      }}
                      onInput={e => { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; }}
                    />
                    {/* Print */}
                    <div
                      className="print-field"
                      style={{
                        border: '1px solid #bbb', borderRadius: 4,
                        padding: '5px 8px', fontSize: '0.82rem',
                        color: BODY, background: 'white', minHeight: 52,
                        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                      }}
                    >{rv}</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function DiagnosticPage() {
  const [values, setValues]             = useState({});
  const [saveEmail, setSaveEmail]       = useState('');
  const [cloudStatus, setCloudStatus]   = useState(''); // 'saving' | 'saved' | 'loaded' | 'error'
  const [multiChildBlocked, setMCB]    = useState(false); // paid gate for 2nd+ child
  const [summary, setSummary]           = useState('');
  const [summaryLoading, setSumLoading] = useState(false);
  const [summaryBlocked, setSumBlocked] = useState(false);
  const [summaryError, setSumError]     = useState('');

  // Load from localStorage on mount — also pick up ?email= from URL (passed from paid session)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setValues(JSON.parse(stored));

      // URL email takes priority (coming from paid Ezra session)
      const urlEmail = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('email')
        : null;
      const storedEmail = localStorage.getItem(STORAGE_KEY + '_email');
      const emailToUse = urlEmail ? decodeURIComponent(urlEmail) : storedEmail;

      if (emailToUse) {
        setSaveEmail(emailToUse);
        try { localStorage.setItem(STORAGE_KEY + '_email', emailToUse); } catch (_) {}
      }
    } catch (_) {}
  }, []);

  // Warn before leaving if data is filled but email not saved to cloud
  useEffect(() => {
    function handleBeforeUnload(e) {
      const hasData = Object.values(values).some(v => v && String(v).trim().length > 0);
      const emailSaved = Boolean(saveEmail && saveEmail.includes('@'));
      if (hasData && !emailSaved) {
        e.preventDefault();
        e.returnValue = 'Your plan has not been saved to the cloud yet. Enter your email before leaving so you don\'t lose your work.';
        return e.returnValue;
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [values, saveEmail]);

  // Load from cloud when email is entered
  const loadFromCloud = useCallback(async (email) => {
    if (!email || !email.includes('@')) return;
    try {
      const res = await fetch(`/api/books/diagnostic/load?email=${encodeURIComponent(email)}&productSlug=${PRODUCT_SLUG}`);
      const json = await res.json();
      if (json.data) {
        setValues(json.data);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(json.data)); } catch (_) {}
        if (json.summary) setSummary(json.summary);
        setCloudStatus('loaded');
        setTimeout(() => setCloudStatus(''), 3000);
      }
    } catch (_) {}
  }, []);

  // Debounced save to localStorage + cloud
  const saveTimer = useRef(null);
  const handleChange = useCallback((name, val) => {
    setValues(prev => {
      const next = { ...prev, [name]: val };
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) {}
        const email = localStorage.getItem(STORAGE_KEY + '_email');
        if (email && email.includes('@')) {
          setCloudStatus('saving');
          try {
            const saveRes = await fetch('/api/books/diagnostic/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, productSlug: PRODUCT_SLUG, data: next }),
            });
            const saveJson = await saveRes.json();
            if (saveJson.blocked && saveJson.reason === 'multi_child_requires_purchase') {
              setMCB(true);
              setCloudStatus('error');
            } else {
              setMCB(false);
              setCloudStatus('saved');
              setTimeout(() => setCloudStatus(''), 2500);
            }
          } catch (_) { setCloudStatus('error'); }
        }
      }, 1200);
      return next;
    });
  }, []);

  async function handleEmailSave(email) {
    setSaveEmail(email);
    try { localStorage.setItem(STORAGE_KEY + '_email', email); } catch (_) {}
    if (email && email.includes('@')) {
      await loadFromCloud(email);
    }
  }

  async function generateSummary() {
    if (!saveEmail || !saveEmail.includes('@')) {
      setSumError('Enter your email above first so we know who you are.');
      return;
    }
    setSumLoading(true);
    setSumBlocked(false);
    setSumError('');
    try {
      const res = await fetch('/api/books/diagnostic/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: saveEmail, productSlug: PRODUCT_SLUG, data: values }),
      });
      const json = await res.json();
      if (json.blocked) {
        setSumBlocked(true);
      } else if (json.summary) {
        setSummary(json.summary);
      } else {
        setSumError('Something went wrong. Please try again.');
      }
    } catch (_) {
      setSumError('Something went wrong. Please try again.');
    } finally {
      setSumLoading(false);
    }
  }

  const F = (name, label, rows) => <Field name={name} label={label} value={values[name]} onChange={handleChange} rows={rows || 3} />;
  const CB = (name, label) => <Check name={name} label={label} checked={values[name]} onChange={handleChange} />;
  const CG = (prefix, options, namePrefix) => <CheckGroup prefix={prefix} options={options} values={values} onChange={handleChange} namePrefix={namePrefix} />;
  const NF = (count, label, namePrefix, rows) => <NumberedFields count={count} label={label} namePrefix={namePrefix} values={values} onChange={handleChange} />;

  return (
    <>
      <Head>
        <title>Child Strategic Plan Diagnostic — Ezra Edu</title>
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Outfit:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          @media print {
            .no-print    { display: none !important; }
            .screen-field { display: none !important; }
            .print-field  { display: block !important; }
            .print-check  { display: inline-block !important; }
            body { margin: 0; }
            .print-page { max-width: 100% !important; padding: 0.5in 0.75in !important; }
            select { border: 1px solid #ccc !important; background: white !important; }
            h2, p, div { orphans: 3; widows: 3; }
            .section-block { page-break-inside: avoid; }
            table { page-break-inside: auto; }
            tr { page-break-inside: avoid; }
          }
          .print-field { display: none; }
          .print-check  { display: none; }
          * { box-sizing: border-box; }
          textarea:focus, input:focus, select:focus { outline: none; }
        `}</style>
      </Head>

      {/* ── Top bar ── */}
      <div className="no-print" style={{ background: NAVY, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: GOLD, fontWeight: 700, fontSize: '0.9rem', fontFamily: 'Outfit, sans-serif', letterSpacing: '0.08em' }}>EZRA EDU</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem' }}>Child Strategic Plan Diagnostic</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {cloudStatus === 'saving'  && <span style={{ color: 'rgba(200,164,90,0.7)', fontSize: '0.78rem' }}>Saving…</span>}
          {cloudStatus === 'saved'   && <span style={{ color: GOLD, fontSize: '0.78rem' }}>✓ Saved</span>}
          {cloudStatus === 'loaded'  && <span style={{ color: GOLD, fontSize: '0.78rem' }}>✓ Plan loaded</span>}
          {cloudStatus === 'error'   && <span style={{ color: '#f87171', fontSize: '0.78rem' }}>Save failed</span>}
          <a
            href="/child-strategic-plan.pdf"
            download
            style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.82rem', textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 6, padding: '6px 14px' }}
          >
            ↓ Blank PDF template
          </a>
          <button
            onClick={() => {
              // Ensure all table inputs have print siblings updated, then print
              window.print();
            }}
            style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            🖨 Save Filled Form as PDF
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="print-page" style={{ maxWidth: 780, margin: '0 auto', padding: '2.5rem 1.5rem 4rem', fontFamily: "'Outfit', system-ui, sans-serif" }}>

        {/* Cover heading */}
        <div style={{ textAlign: 'center', paddingBottom: '2rem', borderBottom: `2px solid ${NAVY}`, marginBottom: '2rem' }}>
          <p style={{ color: GOLD, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 8, fontFamily: 'Outfit, sans-serif' }}>Ezra Edu</p>
          <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 5vw, 2.8rem)', fontWeight: 600, color: NAVY, marginBottom: 8 }}>
            Child Strategic Plan Diagnostic
          </h1>
          <p style={{ fontSize: '0.88rem', color: '#555', marginBottom: 4 }}>A formation-based equipping plan grounded in the nine enhancements</p>
          <p style={{ fontSize: '0.82rem', color: '#888' }}>Companion to <em>How We Educate Children and Develop Talent</em> · Will &amp; Donna Meier</p>
        </div>

        {/* ── Cloud save banner ── */}
        <div className="no-print" style={{ background: '#eef2fa', border: `1px solid rgba(30,42,74,0.15)`, borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <p style={{ fontSize: '0.82rem', fontWeight: 700, color: NAVY, marginBottom: 2 }}>💾 Save &amp; sync your plan</p>
            <p style={{ fontSize: '0.78rem', color: '#555', margin: 0 }}>Enter your email to save your answers and pick up from any device.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={saveEmail}
              onChange={e => setSaveEmail(e.target.value)}
              onBlur={e => handleEmailSave(e.target.value)}
              style={{ border: '1px solid #c8c8c8', borderRadius: 6, padding: '8px 12px', fontSize: '0.85rem', outline: 'none', minWidth: 220, color: NAVY }}
            />
            <button
              onClick={() => handleEmailSave(saveEmail)}
              style={{ background: NAVY, color: GOLD, border: 'none', borderRadius: 6, padding: '8px 16px', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {cloudStatus === 'loaded' ? '✓ Loaded' : 'Load / Save'}
            </button>
          </div>
        </div>

        {/* Multi-child purchase gate banner */}
        {multiChildBlocked && (
          <div className="no-print" style={{ background: '#fff8ee', border: '2px solid #c8a45a', borderRadius: 12, padding: '1.25rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.95rem', fontWeight: 700, color: NAVY, marginBottom: 4 }}>⚠️ Multiple children require a subscription</p>
              <p style={{ fontSize: '0.85rem', color: '#555', margin: 0, lineHeight: 1.6 }}>
                You already have a plan saved for another child. Adding plans for multiple children requires a coaching subscription ($19.99). Purchase access to save plans for all your children.
              </p>
            </div>
            <a
              href="/books/child-education#purchase"
              style={{ display: 'inline-block', background: NAVY, color: GOLD, padding: '11px 24px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              💳 Get Access — $19.99
            </a>
          </div>
        )}

        {/* How to Use */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <H1>How to Use This Diagnostic</H1>
          <Body><strong>Education is never neutral. Information is not formation. See the child before you shape the child.</strong></Body>
          <Body>This is a strategic plan, not a worksheet. It maps the nine enhancements from <em>How We Educate Children and Develop Talent</em> onto one specific child you are forming. You can complete it alone, with a co-parent or co-teacher, or alongside Ezra Edu — the AI coaching agent trained on the book.</Body>
          <Body>Three convictions shape this work:</Body>
          <ul style={{ paddingLeft: 24, marginBottom: '1rem' }}>
            {['Every child carries a designed problem they were built to solve.', 'The bar does not drop. The doorway gets wider.', 'Formation is not delegable. The adult in front of the child carries something no system can replace.'].map((t, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: BODY, lineHeight: 1.75, marginBottom: 4 }}>{t}</li>
            ))}
          </ul>
          <Body>Work through the sections in order. Do not rush. If you do not know the answer, that itself is information — Ezra Edu can walk you through observation questions. Review the plan every ninety days.</Body>
        </div>

        {/* Child Snapshot */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <H1>Child Snapshot</H1>
          {F('child_name', "Child's Name:")}
          {F('age_grade', 'Age and Grade:')}
          {CG('Primary Setting:', ['Homeschool', 'Private', 'Public', 'Co-op', 'Other'], 'setting')}
          {F('lead_adults', 'Lead Adult(s):')}
          {F('plan_started', 'Plan Started:')}
          {F('next_review', 'Next Review (90 days):')}
          {F('child_now', 'One sentence that describes who this child is right now:', 3)}
          {F('child_future', 'What you most want for this child five years from now:', 4)}
        </div>

        {/* Section 1 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={1} title="Gifting and Passion" tagline="Orientation and the Designed Problem" />
          <Body>Gifting tells you what this child can do. Passion tells you what they will not quit. Together they point to the kind of problem this child was designed to solve in the world.</Body>
          {F('gifts_do_well', 'What does this child do well without being told?')}
          {F('gifts_lights_up', 'What lights them up under challenge — what do they not quit?')}
          {CG('What kind of problem does this child seem designed to solve?', ['Organize', 'Empathize', 'Innovate', 'Analyze', 'Lead', 'Build', 'Repair', 'Other'], 'problem_type')}
          {NF(3, 'Top three observed gifts (specific, not generic):', 'gift')}
          {F('passions', 'Current passion(s) — what they return to without being forced:')}
          <Bold>Action This Season</Bold>
          {F('action_exposure', 'One real-world exposure connected to gifting:')}
          {F('action_mirror', 'One person who can mirror this gift back to the child:')}
        </div>

        {/* Section 2 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={2} title="Multiple Intelligences" tagline="The bar does not drop. The doorway gets wider." />
          <Body>Rate this child's natural strength in each domain on a scale of 1 to 5. Note evidence — a moment, a habit, an unprompted choice that reveals the intelligence.</Body>
          <MITable values={values} onChange={handleChange} />
          {F('mi_doorways', 'Top two doorways — lead instruction through these:')}
          {F('mi_expand', 'One weak domain to gently expand (not force):')}
        </div>

        {/* Section 3 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={3} title="Adversity as a Teacher" tagline="Challenge is not removed. It is stewarded." />
          <Body>Children do not auto-extract meaning from hardship. The adult interprets the challenge. The interpretation shapes whether adversity becomes formation or wound.</Body>
          {NF(3, 'Current real challenges this child is facing (academic, social, emotional, spiritual):', 'challenge')}
          {F('adversity_curriculum', 'Hidden curriculum each challenge could teach (resilience, perseverance, humility, courage, discernment):', 4)}
          {CG('How adversity is currently being interpreted in this child\'s hearing:', ['Dead end / unfair', 'Training ground / formation'], 'adversity_frame')}
          {F('adversity_framing', 'One framing adjustment to make this season:')}
          {F('adversity_lean', 'One challenge to lean into rather than rescue from:')}
        </div>

        {/* Section 4 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={4} title="Shepherd the Heart" tagline="Formation before performance." />
          <Body>Behavior flows from the heart. Managing behavior without shepherding the heart produces compliance without character. The heart is the soil. Everything else grows from it.</Body>
          {F('heart_loves', 'What does this child currently love?')}
          {F('heart_fears', 'What does this child currently fear?')}
          {F('heart_wants', 'What does this child want to be true about themselves?')}
          {F('heart_performance', 'Where is performance being mistaken for formation in our adult relationship with this child?', 4)}
          {F('heart_conversation', 'One conversation to have this week — not about behavior, but about the heart underneath:')}
          <Bold>Heart Rhythms to Establish</Bold>
          {CB('heart_rhythm_1', 'One weekly intentional heart conversation')}
          {CB('heart_rhythm_2', 'One regular way the child sees their primary adult receive correction with grace')}
          {CB('heart_rhythm_3', 'One regular practice of confession, repair, and restoration in the home')}
        </div>

        {/* Section 5 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={5} title="Learning Pathways" tagline="Use the doorway first, then expand the house." />
          {CG('Primary pathway:', ['Visual', 'Auditory', 'Kinesthetic', 'Read/Write'], 'primary_pathway')}
          {CG('Also consider:', ['Conversational', 'Project-based'], 'also_consider')}
          {F('secondary_pathway', 'Secondary pathway:')}
          {F('stuck_subject', 'Subject this child is currently stuck in:')}
          {F('try_pathway', 'Try this pathway instead this week:')}
          <Bold>Environmental Adjustments</Bold>
          {F('env_light', 'Light:')}
          {F('env_sound', 'Sound:')}
          {F('env_time', 'Time of day they think best:')}
          {F('env_posture', 'Body posture (sitting, standing, moving):')}
          {F('env_experiment', 'One two-week experiment to run:')}
        </div>

        {/* Section 6 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={6} title="Activate Creativity" tagline="Creativity connects students to meaning." />
          <Body>Every child carries creative capacity. Most children are not born with low creativity — they are born into environments that quiet it. The adult's job is to protect the conditions in which creativity can come out.</Body>
          {CG('Current state of this child\'s creativity:', ['Flourishing', 'Present but quiet', 'Suppressed', 'Underdeveloped'], 'creativity_state')}
          {F('creativity_blocks', 'What blocks it (be specific):', 4)}
          {NF(3, 'Three weekly creativity practices to install:', 'creativity_practice')}
          {F('creativity_project', 'One creative project this child will own start-to-finish in the next 60 days:')}
        </div>

        {/* Section 7 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={7} title="Humor" tagline="A signal of safety, security, and health." />
          <Body>Humor is diagnostic. It tells you whether the room is safe. When laughter rises, learning rises with it. When humor turns into mockery or shame, the room has closed.</Body>
          {CG('In the last 90 days, this child\'s laughter has:', ['Increased', 'Stayed the same', 'Decreased'], 'humor_trend')}
          {F('humor_change', 'What changed?')}
          {F('humor_appears', 'Where in the day does humor appear naturally?')}
          {F('humor_wounded', 'Where has humor been wounded (sarcasm, mockery, shame-based teasing)?')}
          {F('humor_repair', 'Repair needed:')}
          {F('humor_recover', 'One adult-modeled habit of light-heartedness to recover:')}
        </div>

        {/* Section 8 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={8} title="Group Projects" tagline="Socialization, collaboration, and contribution." />
          {CG("This child's current group role:", ['Initiator', 'Connector', 'Builder', 'Encourager', 'Quality-checker', 'Observer', 'Disrupter', 'Avoider'], 'group_role')}
          {F('collab_strengths', 'Strengths in collaboration:')}
          {F('collab_gaps', 'Gaps in collaboration:')}
          <Bold>One Real Group Project in the Next 90 Days</Bold>
          {F('project_what', 'What:')}
          {F('project_role', 'Their role:')}
          {F('project_stretch', 'A role they do not default to that they should try:')}
          <Bold>Skills to Coach During This Project</Bold>
          {CB('skill_disagree', 'Voicing respectful disagreement')}
          {CB('skill_correction', 'Receiving correction without withdrawing')}
          {CB('skill_lead', 'Leading without controlling')}
          {CB('skill_follow', 'Following without disappearing')}
          {CB('skill_repair', 'Repairing after conflict')}
        </div>

        {/* Section 9 */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <SectionHeader num={9} title="Train Critical Thinking" tagline="Discern roots, assumptions, and outcomes." />
          {CG('Current critical thinking baseline:', ['Accepts most at face value', 'Asks why naturally', 'Skeptical without grounding', 'Beginning to test claims'], 'ct_baseline')}
          <Bold>Inputs Currently Shaping This Child the Most</Bold>
          {F('ct_screens', 'Screens:')}
          {F('ct_peers', 'Peers:')}
          {F('ct_algorithms', 'Algorithms / platforms:')}
          {F('ct_adults', 'Adults outside the home:')}
          {F('ct_books', 'Books / curriculum:')}
          {F('ct_rep', 'One low-pressure critical-thinking rep to install this week:')}
          <Bold>Six Questions to Teach This Child to Ask of Any Claim</Bold>
          <ol style={{ paddingLeft: 24, marginBottom: '1rem' }}>
            {['Who is saying this?', 'What are they assuming?', 'What is the evidence?', 'What is the alternative?', 'What is at stake — for them, and for me?', 'Does this hold up when I bring it to Scripture?'].map((q, i) => (
              <li key={i} style={{ fontSize: '0.9rem', color: BODY, lineHeight: 1.75, marginBottom: 4 }}>{q}</li>
            ))}
          </ol>
        </div>

        {/* Putting It All Together */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <H1>Putting It All Together</H1>
          <Body italic>A formation plan does not have to be complicated. It does need to be intentional.</Body>
          {NF(3, 'Top three formation priorities for this child for the next 90 days:', 'priority')}
          <Bold>Weekly Rhythm We Will Hold</Bold>
          {CB('rhythm_strengths', 'One conversation about strengths and passion + one real-world exposure')}
          {CB('rhythm_heart', 'One intentional heart conversation')}
          {CB('rhythm_pathway', 'One learning-pathway experiment')}
          {CB('rhythm_creative', 'One creative project moment')}
          {CB('rhythm_challenge', 'One challenge held (not rescued from)')}
          {CB('rhythm_collab', 'One collaborative project touchpoint')}
          {CB('rhythm_ct', 'One critical-thinking rep')}
          <div style={{ marginTop: '1rem' }} />
          <Bold>Primary Adult Accountable for Each Priority</Bold>
          {F('accountable_1', 'Priority 1:')}
          {F('accountable_2', 'Priority 2:')}
          {F('accountable_3', 'Priority 3:')}
          {F('stop_doing', 'What we will stop doing (something must go for something new to begin):', 4)}
        </div>

        {/* Identity Declaration */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <H1>Identity Declaration</H1>
          <Body><strong>What This Child Carries Into Adulthood</strong></Body>
          <Body>Every child carries an unspoken question into adulthood: did anyone really see me? Speak these words. Speak them often. Speak them out loud.</Body>
          {NF(3, 'Three things we want this child to know we see in them:', 'identity')}
          {F('scripture', 'Scripture or promise we will speak over this child this season:', 4)}
          {F('becoming', 'One sentence describing who this child is becoming:')}
        </div>

        {/* Review Cadence */}
        <div className="section-block" style={{ marginBottom: '2rem' }}>
          <H1>Review Cadence</H1>
          <Body italic>Children grow non-linearly. The plan adapts as the child reveals more of who they were made to be.</Body>
          <ReviewTable values={values} onChange={handleChange} />
          {F('ezra_notes', 'Notes from coaching with Ezra Edu (patterns, insights, things to track):', 6)}
        </div>

        {/* ── AI Summary ── */}
        <div style={{ borderTop: `2px solid ${NAVY}`, paddingTop: '2rem', marginBottom: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <p style={{ color: GOLD, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 6, fontFamily: 'Outfit, sans-serif' }}>Paid Feature</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.6rem', fontWeight: 600, color: NAVY, marginBottom: 8 }}>Your Child&apos;s Profile Summary</h2>
            <p style={{ fontSize: '0.88rem', color: '#555', maxWidth: 520, margin: '0 auto 1.5rem', lineHeight: 1.7 }}>
              Ezra reads everything you&apos;ve entered and writes a personalized 5–7 paragraph profile of your child — who they are, how they learn, what their heart needs, and who they&apos;re becoming. Available with your {'{'}60{'}'}-day coaching access.
            </p>

            {/* Already have a summary */}
            {summary && !summaryLoading && (
              <div style={{ background: '#f5f0e8', border: `1px solid rgba(200,164,90,0.35)`, borderRadius: 12, padding: '1.75rem 2rem', textAlign: 'left', marginBottom: '1.25rem', maxWidth: 680, margin: '0 auto 1.25rem' }}>
                <p style={{ color: GOLD, fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 12, fontFamily: 'Outfit, sans-serif' }}>✦ Ezra&apos;s Profile Summary</p>
                {summary.split('\n\n').map((para, i) => (
                  <p key={i} style={{ fontSize: '0.92rem', color: BODY, lineHeight: 1.85, marginBottom: i < summary.split('\n\n').length - 1 ? '1rem' : 0 }}>{para}</p>
                ))}
              </div>
            )}

            {/* Generate / regenerate button */}
            {!summaryBlocked && (
              <button
                onClick={generateSummary}
                disabled={summaryLoading}
                style={{ background: summary ? 'transparent' : NAVY, color: summary ? NAVY : GOLD, border: `2px solid ${NAVY}`, borderRadius: 8, padding: '13px 32px', fontWeight: 700, fontSize: '0.95rem', cursor: summaryLoading ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: summaryLoading ? 0.7 : 1 }}
              >
                {summaryLoading ? 'Ezra is reading your answers…' : summary ? '↺ Regenerate Summary' : '✦ Generate My Child\'s Summary'}
              </button>
            )}

            {/* Blocked — needs purchase */}
            {summaryBlocked && (
              <div style={{ background: '#fff8ee', border: `1px solid rgba(200,164,90,0.4)`, borderRadius: 10, padding: '1.25rem 1.5rem', maxWidth: 480, margin: '0 auto' }}>
                <p style={{ fontWeight: 700, color: NAVY, marginBottom: 6, fontSize: '0.95rem' }}>This feature requires coaching access.</p>
                <p style={{ fontSize: '0.85rem', color: '#555', marginBottom: 14, lineHeight: 1.6 }}>Purchase 60-day Ezra access to unlock your child&apos;s personalized profile summary and full AI coaching.</p>
                <a href="/books/child-education#purchase" style={{ display: 'inline-block', background: NAVY, color: GOLD, padding: '10px 24px', borderRadius: 7, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none' }}>
                  💳 Get Access — $19.99
                </a>
              </div>
            )}

            {summaryError && <p style={{ color: '#ef4444', fontSize: '0.82rem', marginTop: 10 }}>{summaryError}</p>}
          </div>
        </div>

        {/* Close */}
        <div style={{ borderTop: `1px solid ${RULE}`, paddingTop: '2rem', textAlign: 'center' }}>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.1rem', color: NAVY, fontWeight: 600, marginBottom: 8 }}>Continue with Ezra Edu</p>
          <p style={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.75, maxWidth: 520, margin: '0 auto 1rem' }}>
            Once you have completed this diagnostic, bring it into Ezra Edu and ask it to walk through the plan with you. Ezra will coach you through each enhancement, help you find what you cannot yet see, and adapt the plan as your child grows.
          </p>
          <a href="https://ezra.edu.awakeningdestiny.global" style={{ color: GOLD, fontWeight: 700, fontSize: '0.9rem' }}>
            ezra.edu.awakeningdestiny.global
          </a>
          <p style={{ fontSize: '0.82rem', color: '#999', marginTop: '1.5rem', fontStyle: 'italic' }}>
            This plan is a tool, not a verdict. The Spirit forms the carrier. The carrier forms the child. Ezra Edu walks alongside.
          </p>
          <p style={{ fontSize: '0.78rem', color: '#bbb', marginTop: 8 }}>Forming. Gathering. Releasing. · Awakening Destiny Global · awakeningdestiny.global</p>
        </div>

        {/* ── Floating "save your work" nudge — appears once fields are filled but no email yet ── */}
        {!saveEmail && Object.values(values).filter(v => v && String(v).trim().length > 0).length >= 3 && (
          <div className="no-print" style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 999,
            background: NAVY, color: 'white', borderRadius: 12,
            padding: '14px 20px', maxWidth: 320,
            boxShadow: '0 8px 32px rgba(2,26,53,0.35)',
            border: `2px solid ${GOLD}`,
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <p style={{ fontSize: '0.88rem', fontWeight: 700, color: GOLD, margin: 0 }}>
              ⚠️ Don't lose your work!
            </p>
            <p style={{ fontSize: '0.78rem', color: 'rgba(253,248,240,0.8)', margin: 0, lineHeight: 1.5 }}>
              Enter your email above to save your plan to the cloud.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 7, padding: '8px 14px', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'center' }}
            >
              Save my plan now
            </button>
          </div>
        )}

        {/* ── Bottom save + print reminder ── */}
        <div className="no-print" style={{ background: '#eef2fa', border: `1px solid rgba(30,42,74,0.18)`, borderRadius: 12, padding: '1.5rem 1.75rem', marginTop: '2.5rem', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: 700, color: NAVY, marginBottom: 4 }}>💾 Save your plan before you leave</p>
            <p style={{ fontSize: '0.82rem', color: '#555', margin: 0, lineHeight: 1.6 }}>
              {saveEmail
                ? `Your plan is saved to ${saveEmail}. You can return any time and pick up where you left off.`
                : 'Enter your email at the top of the page to save your answers to the cloud — access from any device, any time.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {!saveEmail && (
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                style={{ background: NAVY, color: GOLD, border: 'none', borderRadius: 7, padding: '10px 18px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                Save my plan
              </button>
            )}
            <button
              onClick={() => window.print()}
              style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 7, padding: '10px 18px', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              🖨 Save as PDF
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

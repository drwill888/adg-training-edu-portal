import { useState, useRef, useEffect } from 'react';

const NAVY = '#021A35';
const GOLD = '#C8A951';
const CREAM = '#FDF8F0';
const WHITE = '#FFFFFF';
const GRAY  = '#6b7280';

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSession(productSlug) {
  const key = `product_session_${productSlug}`;
  if (typeof window === 'undefined') return { sessionId: null };
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  const fresh = { sessionId: genId() };
  localStorage.setItem(key, JSON.stringify(fresh));
  return fresh;
}

// productSlug   — e.g. 'child-education'
// product       — the registry entry (name, tagline, dailyLimit, etc.)
// initialEmail  — pre-filled from URL after Stripe redirect
// introMessage  — opening message from the prompt module
export default function ProductChat({ productSlug, product, initialEmail = '', introMessage, childName = '' }) {
  const defaultIntro = introMessage || `I am Ezra — your coaching guide for ${product?.name || 'this book'}.\n\nWhat would you like to work through?`;

  const [email, setEmail]               = useState(initialEmail);
  const [emailInput, setEmailInput]     = useState(initialEmail);
  const [emailVerified, setEmailVerified] = useState(Boolean(initialEmail));
  const [sessionId, setSessionId]       = useState(null);
  const [messages, setMessages]         = useState([{ role: 'assistant', content: defaultIntro }]);
  const [input, setInput]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [remaining, setRemaining]       = useState(product?.dailyLimit ?? 10);
  const [blocked, setBlocked]           = useState(false);
  const [blockReason, setBlockReason]   = useState('');
  const messagesRef = useRef(null);
  const inputRef    = useRef(null);

  const dailyLimit = product?.dailyLimit ?? 10;

  useEffect(() => {
    if (!productSlug) return;
    const session = getSession(productSlug);
    setSessionId(session.sessionId);
  }, [productSlug]);

  // Pre-fill from URL ?email= after Stripe success
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params   = new URLSearchParams(window.location.search);
    const urlEmail = params.get('email');
    if (urlEmail && !emailInput) {
      const decoded = decodeURIComponent(urlEmail);
      setEmailInput(decoded);
      setEmail(decoded);
      setEmailVerified(true);
    }
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (emailVerified) setTimeout(() => inputRef.current?.focus(), 100);
  }, [emailVerified]);

  function submitEmail(e) {
    e?.preventDefault();
    if (!emailInput.trim()) return;
    setEmail(emailInput.trim().toLowerCase());
    setEmailVerified(true);
  }

  async function sendMessage(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading || !sessionId || blocked) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const res = await fetch('/api/books/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sessionId, question: q, email, productSlug, childName }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { role: 'assistant', content: data.answer }]);

      if (data.blocked) {
        setBlocked(true);
        setBlockReason(data.reason || 'blocked');
      } else if (typeof data.remaining === 'number') {
        setRemaining(data.remaining);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ── Email gate ────────────────────────────────────────────────────────────
  if (!emailVerified) {
    return (
      <div style={styles.container}>
        <div style={styles.emailGate}>
          <div style={{ fontSize: 28, color: GOLD }}>✦</div>
          <h3 style={{ fontSize: 19, fontWeight: 700, color: NAVY, margin: 0 }}>
            Enter your email to begin
          </h3>
          <p style={{ fontSize: 14, color: '#4b5563', lineHeight: 1.6, maxWidth: 340, margin: 0, textAlign: 'center' }}>
            Use the email you purchased access with. Check your inbox for the confirmation email, or enter it here.
          </p>
          <form onSubmit={submitEmail} style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 360 }}>
            <input
              type="email"
              placeholder="your@email.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.primaryBtn}>
              Start Session →
            </button>
          </form>
          <p style={{ fontSize: 13, color: GRAY, margin: 0 }}>
            Don&apos;t have access?{' '}
            <a href="#purchase" style={{ color: GOLD }}>
              Get 60-day access for ${((product?.priceUsd ?? 2000) / 100).toFixed(0)}
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Chat view ─────────────────────────────────────────────────────────────
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={styles.avatar}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: WHITE }}>Ezra</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>
              {product?.tagline || 'Your personal coach'}
            </div>
          </div>
        </div>
        <div style={styles.badge}>
          {remaining} of {dailyLimit} left today
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} style={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '82%',
              padding: '12px 16px',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? NAVY : WHITE,
              color: m.role === 'user' ? WHITE : NAVY,
              fontSize: 14,
              lineHeight: 1.6,
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: WHITE, color: GRAY, fontSize: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <span style={{ letterSpacing: 3 }}>···</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={sendMessage} style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid #e2e6ed', background: WHITE, flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            blocked && blockReason === 'daily_limit'
              ? 'Daily limit reached — come back tomorrow'
              : 'Ask your question…'
          }
          disabled={blocked || loading}
          style={{ flex: 1, border: '1px solid #e2e6ed', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', background: blocked ? '#f9fafb' : WHITE, color: NAVY }}
        />
        <button
          type="submit"
          disabled={!input.trim() || loading || blocked || !sessionId}
          style={{
            background: NAVY, color: GOLD, border: 'none', borderRadius: 8,
            padding: '10px 18px', fontWeight: 700, fontSize: 16, flexShrink: 0,
            cursor: !input.trim() || loading || blocked ? 'not-allowed' : 'pointer',
            opacity: !input.trim() || loading || blocked ? 0.5 : 1,
          }}
        >
          →
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', flexDirection: 'column',
    background: CREAM, borderRadius: 16, overflow: 'hidden',
    boxShadow: '0 8px 40px rgba(2,26,53,0.18)',
    border: `1px solid ${GOLD}`,
    height: 560, maxHeight: '80vh',
  },
  header: {
    background: NAVY, padding: '16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: GOLD, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 16, color: NAVY, fontWeight: 700, flexShrink: 0,
  },
  badge: {
    fontSize: 11, color: 'rgba(255,255,255,0.5)',
    background: 'rgba(255,255,255,0.08)', padding: '4px 10px', borderRadius: 999,
  },
  messages: {
    flex: 1, overflowY: 'auto', padding: 16,
    display: 'flex', flexDirection: 'column', gap: 12, background: CREAM,
  },
  emailGate: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '3rem 2rem', textAlign: 'center', gap: 18, background: CREAM,
  },
  input: {
    border: '1px solid #e2e6ed', borderRadius: 8, padding: '12px 14px',
    fontSize: 14, outline: 'none', color: '#021A35', background: WHITE,
    width: '100%', boxSizing: 'border-box',
  },
  primaryBtn: {
    background: GOLD, color: NAVY, border: 'none', borderRadius: 8,
    padding: '12px 0', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%',
  },
};

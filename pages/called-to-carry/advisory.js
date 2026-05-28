import { useState } from 'react';
import Head from 'next/head';

const NAVY = '#021A35';
const GOLD = '#FDD20D';

export default function AdvisoryPage() {
  const [form, setForm] = useState({ name: '', email: '', role: '', why: '' });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/called-to-carry/advisory-inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          archetype: form.role,
          message: form.why,
        }),
      });
      if (!res.ok) throw new Error('Failed');
      setSent(true);
    } catch {
      setError('Something went wrong. Please try again or email will@awakeningdestiny.global directly.');
    }
    setLoading(false);
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)', color: 'white',
    fontSize: '0.95rem', boxSizing: 'border-box',
    fontFamily: "'Outfit', sans-serif",
  };

  return (
    <>
      <Head>
        <title>Advisory — Called to Carry</title>
        <meta name="description" content="Direct apostolic advisory access with Will Meier for executive-level Kingdom leaders." />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ background: NAVY, minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>

        {/* Hero */}
        <section style={{ padding: '80px 24px 48px', textAlign: 'center', maxWidth: 680, margin: '0 auto' }}>
          <p style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif", fontSize: '1.1rem', fontStyle: 'italic', marginBottom: 16 }}>
            Direct Access
          </p>
          <h1 style={{ color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.2rem, 5vw, 3.5rem)', fontWeight: 700, lineHeight: 1.15, margin: '0 0 24px' }}>
            Advisory
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 12px' }}>
            For leaders carrying an executive-level assignment who need apostolic clarity, strategic counsel, and direct access — not a program.
          </p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem' }}>
            Limited to a small number of leaders. Inquiry only.
          </p>
        </section>

        {/* Form */}
        <section style={{ maxWidth: 540, margin: '0 auto', padding: '0 24px 80px' }}>
          {!sent ? (
            <div style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(253,210,13,0.2)', borderRadius: 16, padding: '40px 32px' }}>
              <h2 style={{ color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.5rem', fontWeight: 700, margin: '0 0 28px', textAlign: 'center' }}>
                Submit an Inquiry
              </h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Full Name *
                  </label>
                  <input
                    type="text" required value={form.name} onChange={update('name')}
                    placeholder="Your name" style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Email Address *
                  </label>
                  <input
                    type="email" required value={form.email} onChange={update('email')}
                    placeholder="your@email.com" style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Your Role / Assignment
                  </label>
                  <input
                    type="text" value={form.role} onChange={update('role')}
                    placeholder="e.g. Founder, Pastor, Executive Leader" style={inputStyle}
                  />
                </div>
                <div>
                  <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>
                    Why Are You Reaching Out
                  </label>
                  <textarea
                    value={form.why} onChange={update('why')} rows={4}
                    placeholder="What are you building or navigating? What do you need?"
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                  />
                </div>

                {error && (
                  <p style={{ color: '#FCA5A5', fontSize: '0.85rem', margin: 0 }}>{error}</p>
                )}

                <button type="submit" disabled={loading}
                  style={{ background: GOLD, color: NAVY, border: 'none', padding: '16px', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
                  {loading ? 'Sending...' : 'Submit Inquiry'}
                </button>
              </form>
            </div>
          ) : (
            <div style={{ background: 'rgba(253,210,13,0.08)', border: '1px solid rgba(253,210,13,0.3)', borderRadius: 16, padding: '48px 32px', textAlign: 'center' }}>
              <p style={{ color: GOLD, fontSize: '2rem', margin: '0 0 16px' }}>✓</p>
              <h2 style={{ color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: '0 0 12px' }}>
                Inquiry Received
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, margin: 0 }}>
                Will reviews advisory inquiries personally. You will hear back within 48 hours.
              </p>
            </div>
          )}
        </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#010f1f', borderTop: '1px solid rgba(253,210,13,0.1)', padding: '2rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.75rem', lineHeight: 1.7, maxWidth: 680, margin: '0 auto' }}>
          &copy; {new Date().getFullYear()} Awakening Destiny Global. All rights reserved.{' '}
          All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.
        </p>
      </footer>
      </div>
    </>
  );
}
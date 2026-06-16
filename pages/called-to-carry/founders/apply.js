// pages/called-to-carry/founders/apply.js
import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

const NAVY = '#021A35';
const GOLD = '#C8A951';

export default function FoundersApply() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '',
    phone: '', archetype: '', why: '',
    building: '', referral: '',
  });
  const [smsConsent, setSmsConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (router.query.archetype) setForm(f => ({ ...f, archetype: router.query.archetype }));
    if (router.query.email) setForm(f => ({ ...f, email: router.query.email }));
  }, [router.query]);

  function update(field) {
    return e => setForm(prev => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/called-to-carry/founders/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, smsConsent, emailConsent }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed');
      router.push('/called-to-carry/founders/thank-you');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }

  const inputStyle = {
    width: '100%', padding: '14px 16px', borderRadius: 8,
    border: '1px solid #CBD5E1', background: 'white',
    fontSize: '0.95rem', boxSizing: 'border-box',
    fontFamily: "'Outfit', sans-serif", color: NAVY,
  };
  const labelStyle = {
    display: 'block', fontSize: '0.82rem', fontWeight: 600,
    color: '#475569', textTransform: 'uppercase',
    letterSpacing: '0.05em', marginBottom: 6,
  };

  return (
    <>
      <Head>
        <title>Apply — Founders Cohort · Called to Carry</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      <div style={{ background: '#F8F9FA', minHeight: '100vh', fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ background: NAVY, padding: '20px 24px', textAlign: 'center' }}>
          <p style={{ color: GOLD, fontFamily: "'Cormorant Garamond', serif", fontSize: '1rem', fontStyle: 'italic', margin: 0 }}>
            Founders Cohort
          </p>
          <h1 style={{ color: 'white', fontFamily: "'Cormorant Garamond', serif", fontSize: '1.8rem', fontWeight: 700, margin: '8px 0 0' }}>
            Application
          </h1>
        </div>
        <div style={{ maxWidth: 620, margin: '0 auto', padding: '40px 24px' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: '40px 32px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: 32, marginTop: 0 }}>
              Every seat in this cohort is intentional. Will reviews each application personally and will be in touch within 48 hours. Takes 5 minutes.
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>First Name *</label>
                  <input required type="text" value={form.firstName} onChange={update('firstName')} placeholder="First" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Last Name *</label>
                  <input required type="text" value={form.lastName} onChange={update('lastName')} placeholder="Last" style={inputStyle} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Email Address *</label>
                <input required type="email" value={form.email} onChange={update('email')} placeholder="your@email.com" style={inputStyle} />
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    id="emailConsent"
                    type="checkbox"
                    checked={emailConsent}
                    onChange={e => setEmailConsent(e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer' }}
                  />
                  <label htmlFor="emailConsent" style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>
                    I agree to receive email communications from Awakening Destiny Global (ADG), including ministry updates, program announcements, and event information. You may unsubscribe at any time. View our <a href="https://awakeningdestiny.global/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#021A35' }}>Privacy Policy</a>.
                  </label>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Phone *</label>
                <input required type="tel" value={form.phone} onChange={update('phone')} placeholder="+1 (555) 000-0000" style={inputStyle} />
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <input
                    id="smsConsent"
                    type="checkbox"
                    checked={smsConsent}
                    onChange={e => setSmsConsent(e.target.checked)}
                    style={{ marginTop: 3, flexShrink: 0, cursor: 'pointer' }}
                  />
                  <label htmlFor="smsConsent" style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, cursor: 'pointer' }}>
                    By providing your phone number, you agree to receive text messages from Awakening Destiny Global (ADG), including ministry updates, event reminders, and important announcements. Message and data rates may apply. Message frequency varies. Reply STOP to unsubscribe at any time. Reply HELP for help. View our <a href="https://awakeningdestiny.global/privacy-policy/" target="_blank" rel="noopener noreferrer" style={{ color: '#021A35' }}>Privacy Policy</a>.
                  </label>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Your Called to Carry Archetype</label>
                <input type="text" value={form.archetype} onChange={update('archetype')} placeholder="e.g. The Apostolic Builder" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>What Are You Building or Leading?</label>
                <textarea value={form.building} onChange={update('building')} rows={3}
                  placeholder="Describe your ministry, business, or current assignment..."
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
              <div>
                <label style={labelStyle}>Why This Cohort, Why Now? *</label>
                <textarea required value={form.why} onChange={update('why')} rows={4}
                  placeholder="What is stirring in you right now? What weight are you carrying?"
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
              </div>
              <div>
                <label style={labelStyle}>How Did You Hear About This?</label>
                <input type="text" value={form.referral} onChange={update('referral')} placeholder="Optional" style={inputStyle} />
              </div>
              {error && (
                <p style={{ color: '#DC2626', fontSize: '0.88rem', margin: 0, padding: '10px 14px', background: '#FEE2E2', borderRadius: 8 }}>
                  {error}
                </p>
              )}
              <button type="submit" disabled={loading}
                style={{ background: NAVY, color: GOLD, border: 'none', padding: '18px', borderRadius: 8, fontSize: '1rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, marginTop: 8 }}>
                {loading ? 'Submitting...' : 'Submit Application →'}
              </button>
              <p style={{ color: '#94a3b8', fontSize: '0.78rem', textAlign: 'center', margin: 0 }}>
                Applications reviewed within 48 hours. No payment collected at this step.
              </p>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
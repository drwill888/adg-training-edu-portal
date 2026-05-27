import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { getProduct, getAllSlugs } from '@/lib/products/registry';

const ProductChat = dynamic(() => import('../../components/ProductChat'), { ssr: false });

// ── Download Gate ─────────────────────────────────────────────────────────────
// Shows a name + email form, submits to /api/books/capture-lead,
// then triggers the PDF download automatically.
function DownloadGate({ dark, label = 'Download Free' }) {
  const [open, setOpen]         = useState(false);
  const [firstName, setFirst]   = useState('');
  const [lastName, setLast]     = useState('');
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const linkRef                 = useRef(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await fetch('/api/books/capture-lead', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ firstName, lastName, email }),
      });
    } catch (_) {}

    // 1. Trigger the PDF download immediately
    const link = document.createElement('a');
    link.href = '/child-strategic-plan.pdf';
    link.download = 'Child-Strategic-Plan-Diagnostic.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 2. Redirect to the fillable HTML form after a short delay
    setTimeout(() => { window.location.href = '/books/diagnostic'; }, 1800);
  }

  const inputStyle = {
    border: `1px solid ${dark ? 'rgba(200,169,81,0.3)' : '#d1d5db'}`,
    borderRadius: 7, padding: '10px 13px', fontSize: 14,
    outline: 'none', width: '100%',
    color: dark ? '#fff' : '#021A35',
    background: dark ? 'rgba(255,255,255,0.07)' : '#fff',
  };

  if (done) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ color: GOLD, fontSize: 20 }}>✓</span>
      <span style={{ color: dark ? 'rgba(253,248,240,0.7)' : GRAY, fontSize: '0.85rem' }}>
        Your download should start automatically.{' '}
        <a ref={linkRef} href="/child-strategic-plan.pdf" download="Child-Strategic-Plan-Diagnostic.pdf"
          style={{ color: GOLD, fontWeight: 600 }}>Click here</a> if it doesn&apos;t.
      </span>
      {/* Hidden auto-trigger link */}
      <a ref={done ? linkRef : null} href="/child-strategic-plan.pdf" download="Child-Strategic-Plan-Diagnostic.pdf" style={{ display: 'none' }} aria-hidden />
    </div>
  );

  if (!open) return (
    <button onClick={() => setOpen(true)}
      style={{ background: GOLD, color: NAVY, padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
      📋 {label}
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 9, width: '100%', maxWidth: 360 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input placeholder="First name" value={firstName} onChange={e => setFirst(e.target.value)} required style={inputStyle} />
        <input placeholder="Last name"  value={lastName}  onChange={e => setLast(e.target.value)}  style={inputStyle} />
      </div>
      <input type="email" placeholder="Your email address" value={email} onChange={e => setEmail(e.target.value)} required style={inputStyle} />
      <button type="submit" disabled={loading || !email.trim()}
        style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 7, padding: '11px 0', fontWeight: 700, fontSize: '0.9rem', cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Downloading…' : 'Get the Free Template'}
      </button>
      <p style={{ fontSize: '0.72rem', color: dark ? 'rgba(253,248,240,0.35)' : '#9ca3af', margin: 0, lineHeight: 1.5 }}>
        We&apos;ll add you to Will&apos;s Ezra Edu list. No spam. Unsubscribe any time.
      </p>
    </form>
  );
}

const NAVY  = '#021A35';
const GOLD  = '#C8A951';
const CREAM = '#FDF8F0';
const WHITE = '#FFFFFF';
const GRAY  = '#6b7280';
const LIGHT = '#f3f4f6';

export async function getStaticPaths() {
  return {
    paths:    getAllSlugs().map((slug) => ({ params: { slug } })),
    fallback: false,
  };
}
export async function getStaticProps({ params }) {
  const product = getProduct(params.slug);
  if (!product) return { notFound: true };
  return { props: { product } };
}

const FAQ_ITEMS = [
  {
    q: 'What is the Child Strategic Plan Diagnostic?',
    a: 'It is a fillable PDF planning tool included free with your purchase. It walks you through the key questions every parent should ask about their child — how they learn, what lights them up, where they struggle, what their gifts might be, and what kind of environment will bring out their best. Fill it out before your first Ezra session and use it as your roadmap throughout the 60 days.',
  },
  {
    q: 'How do I use the template and Ezra together?',
    a: 'Start by downloading and filling out the Child Strategic Plan Diagnostic. Then open Ezra and share what you discovered — your child\'s age, learning style, strengths, struggles, and what you sense about their calling. The more specific you are, the more useful Ezra\'s coaching becomes. Think of the template as the intake form and Ezra as the coach who helps you build the strategy from it.',
  },
  {
    q: 'What is Ezra, and what can\'t it do?',
    a: 'Ezra is an AI coaching tool trained on the full manuscript of Will Meier\'s book. It gives you personalized, book-grounded coaching — not generic advice. It is not a licensed educator, therapist, or diagnostician. It cannot diagnose learning disabilities, ADHD, or any medical condition. When those concerns come up, Ezra will direct you to qualified professionals. But it can help you think clearly about your child alongside that process.',
  },
  {
    q: 'How many conversations do I get?',
    a: 'Up to 10 per day for 60 days — that is up to 600 total coaching exchanges. Each one is a real back-and-forth with Ezra: you ask about your specific child and situation, Ezra responds with practical, grounded coaching from the book\'s frameworks. No limits on response length — only on the number of exchanges per day.',
  },
  {
    q: 'What does the $19.99 get me?',
    a: '60 days of access to Ezra — your AI coaching companion trained on the full book. Up to 10 coaching conversations per day. The Child Strategic Plan Diagnostic template is free and separate — download it any time without purchasing. After your 60 days you can purchase another window anytime.',
  },
  {
    q: 'Can I re-download the template after purchasing?',
    a: 'Yes — every time you visit this page and enter your email, the download link is available. Download it as many times as you need, print it, use a fresh copy for another child, or fill it digitally.',
  },
  {
    q: 'Is this only for homeschool families?',
    a: 'Not at all. The book and the coaching apply to any parent — whether your child is in public school, private school, or homeschool. The question is not which system you choose. It is how clearly you see your child, and how intentionally you are building around who they actually are within whatever context you\'re in.',
  },
  {
    q: 'Is my information private?',
    a: 'Yes. Your email is used only to verify your access. Your conversations with Ezra are stored securely and are never sold or shared. The data is used only to deliver and improve the coaching experience.',
  },
];

export default function BookPage({ product }) {
  const [email, setEmail]             = useState('');
  const [firstName, setFirstName]     = useState('');
  const [lastName, setLastName]       = useState('');
  const [checkoutLoading, setCL]      = useState(false);
  const [hasPaid, setHasPaid]         = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [openFaq, setOpenFaq]         = useState(null);
  const [childPlans, setChildPlans]   = useState([]);   // [{child_name, updated_at}]
  const [activeChild, setActiveChild] = useState('');   // selected child_name
  const [sessionEmail, setSessionEmail]       = useState('');  // unified session email
  const [sessionInput, setSessionInput]       = useState('');  // email field for returning users
  const [sessionVerified, setSessionVerified] = useState(false);
  const [sessionLoading, setSessionLoading]   = useState(false);

  // Scroll to #purchase when arriving from an external link (e.g. diagnostic page)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash === '#purchase') {
      setTimeout(() => {
        document.getElementById('purchase')?.scrollIntoView({ behavior: 'smooth' });
      }, 400);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const p = new URLSearchParams(window.location.search);
    if (p.get('session_id') && p.get('email')) {
      setHasPaid(true);
      const em = decodeURIComponent(p.get('email'));
      setInitialEmail(em);
      setSessionEmail(em);
      setSessionVerified(true);
      // Scroll to the session section after a short delay
      setTimeout(() => {
        document.getElementById('my-session')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);
      // Load child plans for this email
      fetch(`/api/books/diagnostic/load?email=${encodeURIComponent(em)}&productSlug=${product.slug}`)
        .then(r => r.json())
        .then(json => {
          if (json.plans?.length) {
            setChildPlans(json.plans);
            setActiveChild(json.plans[0].child_name || '');
          }
        })
        .catch(() => {});
    }
  }, []);

  async function handleCheckout(e) {
    e?.preventDefault();
    if (!email.trim()) return;
    setCL(true);
    try {
      const res  = await fetch('/api/books/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim(), productSlug: product.slug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error(err); }
    finally { setCL(false); }
  }

  async function handleSessionEmail(e) {
    e?.preventDefault();
    const em = sessionInput.trim().toLowerCase();
    if (!em || !em.includes('@')) return;
    setSessionLoading(true);
    setSessionEmail(em);
    setSessionVerified(true);
    try {
      const res = await fetch(`/api/books/diagnostic/load?email=${encodeURIComponent(em)}&productSlug=${product.slug}`);
      const json = await res.json();
      if (json.plans?.length) {
        setChildPlans(json.plans);
        setActiveChild(json.plans[0].child_name || '');
      }
    } catch (_) {}
    finally { setSessionLoading(false); }
  }

  const rawPrice = product.priceUsd / 100;
  const price = rawPrice % 1 === 0 ? `$${rawPrice.toFixed(0)}` : `$${rawPrice.toFixed(2)}`;

  return (
    <>
      <Head>
        <title>{product.name} — Build a Real Education Strategy for Your Child</title>
        <meta name="description" content="Will Meier's book and AI coaching companion help parents see their child clearly and build a personalized education strategy — not just survive the school year." />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, 'Times New Roman', serif; background: ${NAVY}; color: ${CREAM}; }
          @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&display=swap');
        `}</style>
      </Head>

      {/* ── Already a customer? bar ───────────────────────────────────────── */}
      <div style={{ background: 'rgba(200,169,81,0.1)', borderBottom: '1px solid rgba(200,169,81,0.2)', padding: '10px 24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: '0.8rem', color: 'rgba(253,248,240,0.6)' }}>Already purchased access?</span>
        <a href="#my-session" style={{ fontSize: '0.8rem', color: GOLD, fontWeight: 600, textDecoration: 'none' }}>Open your session</a>
        <span style={{ color: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>|</span>
        <span style={{ fontSize: '0.8rem', color: 'rgba(253,248,240,0.55)' }}><a href="#my-session" style={{ color: 'rgba(253,248,240,0.55)', textDecoration: 'underline' }}>Get free template</a></span>
      </div>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ background: NAVY, padding: '6rem 2rem 5rem', textAlign: 'center' }}>
        <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.22em', fontSize: '0.72rem', marginBottom: '1.75rem', fontFamily: 'Outfit, sans-serif' }}>
          For Parents Who Know Something Is Off
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2.2rem, 5.5vw, 4rem)', fontWeight: 400, lineHeight: 1.1, color: WHITE, maxWidth: 760, margin: '0 auto 1.75rem' }}>
          What If Your Child&apos;s Education Was Built Around Who They Actually Are?
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'rgba(253,248,240,0.75)', lineHeight: 1.8, maxWidth: 600, margin: '0 auto 2.75rem' }}>
          Most education systems are designed for the average child. Yours is not average. Will Meier&apos;s book and AI coaching companion help you see your child clearly — and build a real strategy around who they actually are.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button onClick={() => document.getElementById('purchase')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: GOLD, color: NAVY, padding: '16px 36px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', letterSpacing: '0.02em' }}>
            Get {product.daysAccess}-Day Access — {price}
          </button>
          <DownloadGate dark label="Free Planning Template" />
        </div>
        <p style={{ fontSize: '0.78rem', color: 'rgba(253,248,240,0.35)' }}>One-time payment. Secure checkout via Stripe. Access begins immediately.</p>
      </section>

      {/* ── The Problem ──────────────────────────────────────────────────── */}
      <section style={{ background: '#0d2240', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
            The Real Issue
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: WHITE, lineHeight: 1.2, marginBottom: '1.5rem' }}>
            The system measures everything except what matters most.
          </h2>
          <p style={{ fontSize: '1.05rem', color: 'rgba(253,248,240,0.75)', lineHeight: 1.85, marginBottom: '2.5rem' }}>
            Grades. Standardized tests. Completion rates. Your child may be passing all of it — and you may still sense that something essential is being missed. Not because they are failing. Because they are <em>performing without flourishing</em>. Being trained without being formed. Gathering credentials without discovering who they are.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: '2.5rem' }}>
            {[
              { line: 'Graded but not formed.', sub: 'The report card looks fine. The child is quietly lost.' },
              { line: 'Trained but not equipped.', sub: 'They know how to study. They don\'t know why it matters.' },
              { line: 'Promoted but not prepared.', sub: 'Moving forward. Falling behind on the things that count.' },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(200,169,81,0.07)', border: '1px solid rgba(200,169,81,0.18)', borderRadius: 12, padding: '1.25rem', textAlign: 'left' }}>
                <p style={{ color: GOLD, fontWeight: 700, fontSize: '0.95rem', marginBottom: 8, lineHeight: 1.3 }}>{item.line}</p>
                <p style={{ color: 'rgba(253,248,240,0.55)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{item.sub}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '1.05rem', color: 'rgba(253,248,240,0.7)', lineHeight: 1.85, fontStyle: 'italic' }}>
            &ldquo;What is being lost is not being measured at all.&rdquo;
          </p>
        </div>
      </section>

      {/* ── The Book ─────────────────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1.25rem', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
            The Book
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: NAVY, lineHeight: 1.2, marginBottom: '1.5rem', textAlign: 'center' }}>
            How to Educate Your Child
          </h2>
          <p style={{ fontSize: '1.05rem', color: '#1f2937', lineHeight: 1.9, marginBottom: '1.25rem' }}>
            There is a gap between information and formation — between teaching a child facts and building who they are. Most systems were built to close the information gap. Almost none were built for the formation gap. That is what this book addresses.
          </p>
          <p style={{ fontSize: '1.05rem', color: '#1f2937', lineHeight: 1.9, marginBottom: '1.25rem' }}>
            Will and Donna Meier spent years watching children — and adults — who had been schooled but not formed. Credentialed but not called. Productive but not purposeful. The question that drove the book was simple: <em>What would it look like to build an education strategy around your specific child — their wiring, their gifts, their calling — instead of fitting them into someone else&apos;s mold?</em>
          </p>
          <p style={{ fontSize: '1.05rem', color: '#1f2937', lineHeight: 1.9, marginBottom: '2.5rem' }}>
            The answer is nine practical frameworks for parents and leaders — not theory, not criticism of schools, but a way of seeing your child clearly and building something real around what you find.
          </p>

          {/* Will & Donna bio */}
          <div style={{ background: WHITE, border: `1px solid rgba(200,169,81,0.25)`, borderRadius: 14, padding: '1.75rem', display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: NAVY, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: GOLD, fontWeight: 700, fontSize: 15 }}>W&D</span>
            </div>
            <div>
              <p style={{ fontWeight: 700, color: NAVY, fontSize: '0.95rem', marginBottom: 4 }}>Will &amp; Donna Meier</p>
              <p style={{ fontSize: '0.82rem', color: GOLD, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'Outfit, sans-serif' }}>Authors · Founders, Awakening Destiny Global</p>
              <p style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.75, margin: 0 }}>
                Will and Donna have spent more than a decade helping parents, leaders, and organizations think clearly about formation, calling, and development. Their work lives at the intersection of Kingdom purpose and practical strategy — helping people stop managing defaults and start building with intention.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Transformation ───────────────────────────────────────────────── */}
      <section style={{ background: NAVY, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
            What Changes
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: WHITE, lineHeight: 1.2, marginBottom: '3rem' }}>
            From surviving the system to building a strategy.
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20, textAlign: 'left' }}>
            {[
              {
                icon: '👁',
                title: 'See your child\'s actual self — not just their performance.',
                body: 'Learn to look past report cards and test scores to identify how your child is uniquely wired — their learning style, their gifts, and the early signals of their calling.',
              },
              {
                icon: '🗺',
                title: 'Build a strategy, not just an enrollment.',
                body: 'Move from accepting institutional defaults to designing an education environment that fits your specific child. Education is not a system you manage — it is a person you nurture.',
              },
              {
                icon: '🌱',
                title: 'Raise a child who is being formed, not just trained.',
                body: 'The frameworks in this book shift the goal from gathering credentials to building character — from performance to personhood. From doing well on tests to becoming someone with depth.',
              },
              {
                icon: '🧭',
                title: 'Make decisions from discernment, not anxiety.',
                body: 'Stop reacting to every crisis, curriculum choice, or comparison to other families. Walk through a clear diagnostic process and come out the other side with a real plan you can act on.',
              },
            ].map((item, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 14, padding: '1.75rem', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 28, flexShrink: 0 }}>{item.icon}</span>
                <div>
                  <p style={{ color: WHITE, fontWeight: 700, fontSize: '1rem', marginBottom: 10, lineHeight: 1.4 }}>{item.title}</p>
                  <p style={{ color: 'rgba(253,248,240,0.65)', fontSize: '0.88rem', lineHeight: 1.75, margin: 0 }}>{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two Tools ────────────────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: '5rem 2rem' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1.25rem', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>
            What You Get
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: NAVY, lineHeight: 1.2, marginBottom: '2.5rem', textAlign: 'center' }}>
            Two separate tools. Independent of each other.
          </h2>

          {/* ── Tool 1: FREE ── */}
          <div style={{ background: NAVY, borderRadius: 16, padding: '2rem 2.25rem', marginBottom: 16 }}>
            <div style={{ display: 'inline-block', background: '#16a34a', color: '#fff', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', padding: '5px 14px', borderRadius: 100, marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
              ✓ FREE — No Credit Card. No Purchase.
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px' }}>
                <h3 style={{ color: WHITE, fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>
                  📋 Child Strategic Plan Diagnostic
                </h3>
                <p style={{ color: 'rgba(253,248,240,0.68)', fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
                  A fillable form built to help you think clearly about your child. Works through their learning style, strengths, struggles, interests, and education environment. Fill it out once — use it every session.
                </p>
              </div>
              <ul style={{ listStyle: 'none', flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 9, margin: 0, padding: 0 }}>
                {['Map how your child actually learns', 'Identify gifts and strengths early', 'Clarify your goals as a parent', 'Build a strategy you can act on Monday', 'Reuse for every child you have'].map((t, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.84rem', color: 'rgba(253,248,240,0.75)' }}>
                    <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>✦</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: '1.5rem', maxWidth: 280 }}>
              <DownloadGate dark label="Get the Free Template" />
            </div>
          </div>

          {/* ── Separator ── */}
          <div style={{ textAlign: 'center', padding: '10px 0', color: GRAY, fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: 'Outfit, sans-serif' }}>
            — separate purchase below —
          </div>

          {/* ── Tool 2: PAID ── */}
          <div style={{ background: WHITE, border: `2px solid ${GOLD}`, borderRadius: 16, padding: '2rem 2.25rem', marginTop: 16 }}>
            <div style={{ display: 'inline-block', background: GOLD, color: NAVY, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.2em', padding: '5px 14px', borderRadius: 100, marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>
              💳 {price} One-Time Purchase — Not Included Free
            </div>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 280px' }}>
                <h3 style={{ color: NAVY, fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.3, marginBottom: 10 }}>
                  ✦ Ezra — Your AI Coaching Companion
                </h3>
                <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: 1.8, margin: 0 }}>
                  Ezra is trained on the full manuscript of Will&apos;s book. Ask him about your specific child and he gives you coaching grounded in the book&apos;s frameworks. Not generic advice. A coaching conversation built on something real.
                </p>
              </div>
              <ul style={{ listStyle: 'none', flex: '1 1 220px', display: 'flex', flexDirection: 'column', gap: 9, margin: 0, padding: 0 }}>
                {[`Up to ${product.dailyLimit} conversations per day`, `${product.daysAccess} days of access from purchase`, 'Personalized — not one-size-fits-all', "Grounded in the book's 9 frameworks", 'Available any time, any device'].map((t, i) => (
                  <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.84rem', color: '#374151' }}>
                    <span style={{ color: GOLD, flexShrink: 0, marginTop: 2 }}>✦</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <button onClick={() => document.getElementById('purchase')?.scrollIntoView({ behavior: 'smooth' })}
                style={{ display: 'inline-block', background: GOLD, color: NAVY, padding: '12px 28px', borderRadius: 8, fontWeight: 800, fontSize: '0.9rem', textDecoration: 'none', textAlign: 'center', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                💳 Purchase {price} Access
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────────────────────── */}
      <section style={{ background: '#0d2240', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 680, width: '100%', textAlign: 'center' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>Simple Process</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: WHITE, lineHeight: 1.2, marginBottom: '3rem' }}>
            How to use it
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {[
              { n: '01', title: 'Download the diagnostic template.', body: 'Free — no purchase required. Open the Child Strategic Plan Diagnostic and work through it for your child. It takes 20–30 minutes and gives you a clear picture of who they are, how they learn, and what they need.' },
              { n: '02', title: `Get ${product.daysAccess}-day coaching access for ${price}.`, body: `One-time payment. No subscription. You get immediate access to Ezra — your AI coaching companion trained on the full book. No hidden fees.` },
              { n: '03', title: 'Bring your child to Ezra.', body: 'Open Ezra, share what you learned from the diagnostic, and ask your real questions. Ask about your specific child — not a hypothetical one. Ezra asks good questions, gives practical frameworks, and helps you build a strategy you can act on.' },
            ].map((step, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'flex-start', padding: '2rem 0', borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.08)' : 'none', textAlign: 'left' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '2.8rem', color: GOLD, opacity: 0.5, lineHeight: 1, flexShrink: 0, minWidth: 52 }}>{step.n}</span>
                <div>
                  <p style={{ color: WHITE, fontWeight: 700, fontSize: '1.05rem', marginBottom: 8, lineHeight: 1.35 }}>{step.title}</p>
                  <p style={{ color: 'rgba(253,248,240,0.62)', fontSize: '0.9rem', lineHeight: 1.8, margin: 0 }}>{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What people ask Ezra ─────────────────────────────────────────── */}
      {product.exampleQuestions?.length > 0 && (
        <section style={{ background: NAVY, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>Real Questions</p>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 400, color: WHITE }}>
              What parents bring to Ezra
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, maxWidth: 900, width: '100%' }}>
            {product.exampleQuestions.map((q, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 12, padding: '1.4rem' }}>
                <span style={{ color: GOLD, fontSize: 18, display: 'block', marginBottom: 10 }}>✦</span>
                <p style={{ fontSize: '0.9rem', color: 'rgba(253,248,240,0.8)', lineHeight: 1.7, fontStyle: 'italic', margin: 0 }}>{q}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: '0.9rem', color: 'rgba(253,248,240,0.45)', textAlign: 'center' }}>Ezra asks clarifying questions first. Then gives practical, grounded coaching — not generic answers.</p>
        </section>
      )}

      {/* ── Purchase ─────────────────────────────────────────────────────── */}
      <section id="purchase" style={{ background: CREAM, padding: '5rem 2rem', display: sessionVerified ? 'none' : 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem', fontFamily: 'Outfit, sans-serif' }}>Get Started Today</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: NAVY, lineHeight: 1.2, marginBottom: '0.5rem' }}>
            {product.daysAccess} Days of Coaching
          </h2>
          <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '3.5rem', color: NAVY, fontWeight: 600, marginBottom: '0.25rem', lineHeight: 1 }}>{price}</p>
          <p style={{ fontSize: '0.85rem', color: GRAY, marginBottom: '2rem' }}>One-time payment. No subscription.</p>

          {/* What's in the box */}
          <div style={{ background: WHITE, border: `1px solid ${LIGHT}`, borderRadius: 14, padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
            {[
              { icon: '✦', text: `Up to ${product.dailyLimit} coaching conversations per day` },
              { icon: '✦', text: `${product.daysAccess} full days of access from purchase` },
              { icon: '✦', text: 'Coaching grounded in the book\'s 9 frameworks' },
              { icon: '✦', text: 'Personalized to your specific child — not generic advice' },
              { icon: '✦', text: 'Secure access — starts immediately after payment' },
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '9px 0', borderBottom: i < arr.length - 1 ? `1px solid ${LIGHT}` : 'none' }}>
                <span style={{ color: GOLD, fontSize: 14, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
                <span style={{ fontSize: '0.9rem', color: '#374151', lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>

          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.82rem', color: GRAY, textAlign: 'left', margin: '0 0 4px', fontWeight: 600 }}>
              Enter your details to proceed to secure payment:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <input
                type="text" placeholder="First name"
                value={firstName} onChange={(e) => setFirstName(e.target.value)} required
                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '14px 16px', fontSize: 15, outline: 'none', color: NAVY, background: WHITE, width: '100%' }}
              />
              <input
                type="text" placeholder="Last name"
                value={lastName} onChange={(e) => setLastName(e.target.value)} required
                style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '14px 16px', fontSize: 15, outline: 'none', color: NAVY, background: WHITE, width: '100%' }}
              />
            </div>
            <input
              type="email" placeholder="Your email address"
              value={email} onChange={(e) => setEmail(e.target.value)} required
              style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '14px 16px', fontSize: 15, outline: 'none', color: NAVY, background: WHITE, width: '100%' }}
            />
            <button type="submit" disabled={checkoutLoading || !email.trim() || !firstName.trim() || !lastName.trim()}
              style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 8, padding: '16px 0', fontWeight: 700, fontSize: 16, width: '100%', letterSpacing: '0.02em', cursor: checkoutLoading || !email.trim() ? 'not-allowed' : 'pointer', opacity: checkoutLoading || !email.trim() ? 0.7 : 1 }}>
              {checkoutLoading ? 'Redirecting to Stripe…' : `💳 Pay ${price} — Proceed to Checkout`}
            </button>
            <p style={{ fontSize: '0.78rem', color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 }}>
              You will be redirected to Stripe to complete payment securely. Access begins immediately after.
            </p>
            <p style={{ fontSize: '0.72rem', color: '#c4c8cc', textAlign: 'center', lineHeight: 1.65 }}>
              Ezra is an AI coaching tool trained on Will Meier&apos;s book. It is not a licensed educator, therapist, or diagnostician. For learning disabilities, medical concerns, or clinical questions, please consult a qualified professional.
            </p>
          </form>
        </div>
      </section>

      {/* ── My Session (paid access) ─────────────────────────────────────── */}
      <section id="my-session" style={{ background: '#0a1f3a', padding: '3.5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        {/* Header */}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', fontWeight: 400, color: WHITE, marginBottom: 8 }}>
            {sessionVerified ? (hasPaid ? 'Your session is ready.' : 'Welcome back.') : 'Already purchased? Open your session.'}
          </h3>
          <p style={{ color: 'rgba(253,248,240,0.55)', fontSize: '0.88rem' }}>
            {sessionVerified
              ? `You have ${product.dailyLimit} conversations per day. Your access runs ${product.daysAccess} days from purchase.`
              : 'Enter the email you purchased with to pick up where you left off.'}
          </p>
        </div>

        {/* Email entry — shown until session is verified */}
        {!sessionVerified && (
          <form onSubmit={handleSessionEmail} style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input
              type="email"
              required
              placeholder="your@email.com"
              value={sessionInput}
              onChange={e => setSessionInput(e.target.value)}
              style={{ flex: 1, minWidth: 200, border: '1px solid rgba(200,169,81,0.4)', borderRadius: 8, padding: '12px 14px', fontSize: '0.9rem', background: 'rgba(255,255,255,0.06)', color: WHITE, outline: 'none' }}
            />
            <button
              type="submit"
              disabled={sessionLoading}
              style={{ background: GOLD, color: NAVY, border: 'none', borderRadius: 8, padding: '12px 22px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', whiteSpace: 'nowrap', opacity: sessionLoading ? 0.7 : 1 }}
            >
              {sessionLoading ? 'Loading…' : 'Open My Session'}
            </button>
          </form>
        )}

        {/* Session content — shown after email verified */}
        {sessionVerified && (
          <>
            {/* Template download bar */}
            <div style={{ width: '100%', maxWidth: 640, background: 'rgba(200,169,81,0.09)', border: '1px solid rgba(200,169,81,0.28)', borderRadius: 12, padding: '1rem 1.4rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <span style={{ fontSize: 22 }}>📋</span>
                <div>
                  <p style={{ color: GOLD, fontWeight: 700, fontSize: '0.88rem', margin: '0 0 2px' }}>Child Strategic Plan Diagnostic</p>
                  <p style={{ color: 'rgba(253,248,240,0.5)', fontSize: '0.75rem', margin: 0 }}>Fill this out so Ezra knows your child personally</p>
                </div>
              </div>
              <a href={`/books/diagnostic?email=${encodeURIComponent(sessionEmail)}`} style={{ display: 'inline-block', background: GOLD, color: NAVY, padding: '8px 18px', borderRadius: 7, fontWeight: 700, fontSize: '0.82rem', textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Fill the Diagnostic
              </a>
            </div>

            {/* Child selector — shown when plans exist */}
            {childPlans.length > 0 && (
              <div style={{ width: '100%', maxWidth: 640, background: 'rgba(200,169,81,0.07)', border: '1px solid rgba(200,169,81,0.25)', borderRadius: 10, padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ color: GOLD, fontSize: '0.82rem', fontWeight: 700, whiteSpace: 'nowrap' }}>Coaching for:</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
                  {childPlans.map(p => (
                    <button key={p.child_name}
                      onClick={() => setActiveChild(p.child_name)}
                      style={{
                        background: activeChild === p.child_name ? GOLD : 'rgba(255,255,255,0.07)',
                        color: activeChild === p.child_name ? NAVY : 'rgba(253,248,240,0.7)',
                        border: `1px solid ${activeChild === p.child_name ? GOLD : 'rgba(200,169,81,0.25)'}`,
                        borderRadius: 20, padding: '5px 14px', fontSize: '0.82rem',
                        fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                      }}>
                      {p.child_name || 'Unnamed child'}
                    </button>
                  ))}
                  <a href={`/books/diagnostic?email=${encodeURIComponent(sessionEmail)}`} style={{ color: 'rgba(253,248,240,0.45)', fontSize: '0.78rem', textDecoration: 'underline', alignSelf: 'center', marginLeft: 4 }}>
                    + Add another child
                  </a>
                </div>
              </div>
            )}

            {/* Ezra chat */}
            <div style={{ width: '100%', maxWidth: 640 }}>
              <ProductChat
                productSlug={product.slug}
                product={product}
                initialEmail={sessionEmail}
                childName={activeChild}
              />
            </div>
          </>
        )}
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem', textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>Common Questions</p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 400, color: NAVY, marginBottom: '2.5rem', textAlign: 'center' }}>
            Everything you need to know
          </h2>
          <div style={{ borderTop: '1px solid #e5e7eb' }}>
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '1.25rem 0', gap: 16, textAlign: 'left' }}>
                  <span style={{ fontSize: '0.97rem', fontWeight: 600, color: NAVY, lineHeight: 1.45, flex: 1 }}>{item.q}</span>
                  <span style={{ color: GOLD, fontSize: '1.4rem', fontWeight: 300, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{openFaq === i ? '−' : '+'}</span>
                </button>
                {openFaq === i && (
                  <p style={{ fontSize: '0.92rem', color: '#374151', lineHeight: 1.8, paddingBottom: '1.25rem', margin: 0 }}>{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: GOLD, padding: '5rem 2rem', textAlign: 'center' }}>
        <p style={{ color: 'rgba(2,26,53,0.6)', textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1.25rem', fontFamily: 'Outfit, sans-serif' }}>The window will not stay open forever.</p>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: 400, color: NAVY, lineHeight: 1.15, maxWidth: 560, margin: '0 auto 1rem' }}>
          The investment in clarity is worth it.
        </h2>
        <p style={{ color: 'rgba(2,26,53,0.7)', marginBottom: '0.5rem', fontSize: '1rem', lineHeight: 1.7 }}>
          {product.daysAccess} days. {product.dailyLimit} conversations a day. {price}.
        </p>
        <p style={{ color: 'rgba(2,26,53,0.55)', marginBottom: '2.5rem', fontSize: '0.88rem' }}>
          One-time payment. No subscription. Access starts immediately.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => document.getElementById('purchase')?.scrollIntoView({ behavior: 'smooth' })}
            style={{ background: NAVY, color: GOLD, padding: '16px 36px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Get Access Now
          </button>
          <DownloadGate dark={false} label="Free Template" />
        </div>
      </section>
    </>
  );
}

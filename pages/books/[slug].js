import { useState, useEffect } from 'react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { getProduct, getAllSlugs } from '@/lib/products/registry';

const ProductChat = dynamic(() => import('../../components/ProductChat'), { ssr: false });

const NAVY  = '#021A35';
const GOLD  = '#C8A951';
const CREAM = '#FDF8F0';
const WHITE = '#FFFFFF';
const GRAY  = '#6b7280';

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

const FAQ = [
  {
    q: 'What is the Child Strategic Plan Diagnostic?',
    a: 'It is a fillable PDF planning tool included free with your purchase. It walks you through the key questions every parent should ask about their child — how they learn, what lights them up, where they struggle, what their gifts might be, and what kind of education environment will bring out their best. You fill it out, then use it alongside your Ezra coaching sessions to get highly specific, personalized guidance rather than generic advice.',
  },
  {
    q: 'How do I use the template and Ezra together?',
    a: 'Start by downloading and filling out the Child Strategic Plan Diagnostic. Then open Ezra and share what you discovered — your child\'s age, learning style, strengths, struggles, and what you sense about their calling. The more specific you are, the more useful Ezra\'s coaching becomes. Think of the template as the intake form and Ezra as the coach who helps you build the strategy from it.',
  },
  {
    q: 'What exactly is included in the $20 purchase?',
    a: `You get two things: (1) the Child Strategic Plan Diagnostic — a fillable PDF planning template you can download and keep forever, and (2) 60 days of access to Ezra, your AI coaching companion trained on the full manuscript of Will Meier\'s book. You can ask Ezra up to ${10} questions per day throughout your 60-day window. That\'s up to 600 personalized coaching conversations — all grounded in the book\'s frameworks.`,
  },
  {
    q: 'What is Ezra, and what can\'t it do?',
    a: 'Ezra is an AI coaching tool — trained on Will Meier\'s book "How to Educate Your Child." It is designed to help you think through your child\'s education, learning style, strengths, and formation. It is not a licensed educator, therapist, or diagnostician. It cannot diagnose learning disabilities, ADHD, anxiety, or any medical condition. If you are concerned your child may have a learning or developmental challenge, please consult a qualified professional. Ezra can still help you think through strategies and questions alongside that process.',
  },
  {
    q: 'How many conversations do I get?',
    a: 'Up to 10 conversations per day for 60 days — that is up to 600 total coaching exchanges. Each conversation is a back-and-forth with Ezra: you ask, Ezra responds with practical, book-grounded coaching. There is no limit on the length of each response, only on the number of exchanges per day.',
  },
  {
    q: 'Can I re-download the planning template after I purchase?',
    a: 'Yes. The download link is available every time you visit this page and enter your email. You can download it as many times as you need — print it, fill it digitally, or use a fresh copy for a different child.',
  },
  {
    q: 'What happens when my 60 days are up?',
    a: 'Your Ezra access expires, but the Child Strategic Plan Diagnostic is yours to keep permanently. You are always welcome to purchase another 60-day window if you want to continue coaching sessions.',
  },
  {
    q: 'Is my information private?',
    a: 'Yes. Your email is used only to verify your access and is never sold or shared. Your conversations with Ezra are stored securely and are only accessible to you and Will\'s team for the purpose of improving the product.',
  },
];

export default function BookPage({ product }) {
  const [email, setEmail]               = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hasPaid, setHasPaid]           = useState(false);
  const [initialEmail, setInitialEmail] = useState('');
  const [openFaq, setOpenFaq]           = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params    = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const urlEmail  = params.get('email');
    if (sessionId && urlEmail) {
      setHasPaid(true);
      setInitialEmail(decodeURIComponent(urlEmail));
    }
  }, []);

  async function handleCheckout(e) {
    e?.preventDefault();
    if (!email.trim()) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/books/checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), productSlug: product.slug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
    } finally {
      setCheckoutLoading(false);
    }
  }

  const price = `$${(product.priceUsd / 100).toFixed(0)}`;

  const DownloadBanner = ({ dark }) => (
    <div style={{
      width: '100%', maxWidth: 640,
      background: dark ? 'rgba(200,169,81,0.1)' : 'rgba(2,26,53,0.06)',
      border: `1px solid ${dark ? 'rgba(200,169,81,0.35)' : 'rgba(200,169,81,0.4)'}`,
      borderRadius: 12, padding: '1.1rem 1.4rem',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
        <span style={{ fontSize: 24 }}>📋</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.92rem', margin: '0 0 2px', color: dark ? GOLD : NAVY }}>
            Child Strategic Plan Diagnostic
          </p>
          <p style={{ fontSize: '0.78rem', margin: 0, color: dark ? 'rgba(253,248,240,0.6)' : GRAY }}>
            Free fillable PDF — use it alongside your coaching sessions
          </p>
        </div>
      </div>
      <a
        href="/child-strategic-plan.pdf"
        download="Child-Strategic-Plan-Diagnostic.pdf"
        style={{
          background: GOLD, color: NAVY, padding: '9px 18px', borderRadius: 8,
          fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0,
        }}
      >
        ↓ Download Free
      </a>
    </div>
  );

  return (
    <>
      <Head>
        <title>{product.name} — AI Coaching Access</title>
        <meta name="description" content={product.description} />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Georgia, 'Times New Roman', serif; background: ${NAVY}; color: ${CREAM}; }
        `}</style>
      </Head>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{ background: NAVY, padding: '5rem 2rem 4rem', textAlign: 'center', borderBottom: `1px solid rgba(200,169,81,0.2)` }}>
        <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
          For Readers of the Book
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.15, color: WHITE, maxWidth: 700, margin: '0 auto 1.5rem' }}>
          Ask Ezra — {product.name}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(253,248,240,0.8)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2rem' }}>
          {product.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'rgba(200,169,81,0.12)', border: `1px solid rgba(200,169,81,0.3)`, borderRadius: 999, padding: '6px 18px', fontSize: '0.85rem', color: GOLD }}>
            <span>⏱</span>
            <span>Limited-time — {price} for {product.daysAccess} days</span>
          </div>
          <a
            href="/child-strategic-plan.pdf"
            download="Child-Strategic-Plan-Diagnostic.pdf"
            style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'rgba(200,169,81,0.18)', border: `1px solid rgba(200,169,81,0.45)`, borderRadius: 999, padding: '6px 18px', fontSize: '0.85rem', color: GOLD, textDecoration: 'none', fontWeight: 600 }}
          >
            <span>📋</span>
            <span>Free: Download Planning Template</span>
          </a>
        </div>
        <a href="#purchase" style={{ display: 'inline-block', background: GOLD, color: NAVY, padding: '14px 36px', borderRadius: 8, fontWeight: 700, fontSize: '1rem', textDecoration: 'none', letterSpacing: '0.02em' }}>
          Get {product.daysAccess}-Day Access — {price} →
        </a>
      </section>

      {/* ── Post-payment: chat + download ────────────────────────────────── */}
      {hasPaid && (
        <section style={{ background: '#0a1f3a', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.8rem', fontWeight: 400, color: WHITE, marginBottom: 8 }}>
              Your session is ready.
            </h2>
            <p style={{ color: 'rgba(253,248,240,0.6)', fontSize: '0.9rem' }}>
              You have {product.dailyLimit} conversations per day. Your access runs {product.daysAccess} days from purchase.
            </p>
          </div>
          <DownloadBanner dark />
          <div style={{ width: '100%', maxWidth: 640 }}>
            <ProductChat productSlug={product.slug} product={product} initialEmail={initialEmail} />
          </div>
        </section>
      )}

      {/* ── Returning customers: chat + download ─────────────────────────── */}
      {!hasPaid && (
        <section style={{ background: '#0a1f3a', padding: '3rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '1.4rem', fontWeight: 400, color: WHITE, marginBottom: 8 }}>
              Already purchased access?
            </h3>
            <p style={{ color: 'rgba(253,248,240,0.6)', fontSize: '0.9rem' }}>
              Enter your email below to open your session.
            </p>
          </div>
          <div style={{ width: '100%', maxWidth: 640 }}>
            <ProductChat productSlug={product.slug} product={product} initialEmail="" />
          </div>
          <DownloadBanner dark />
        </section>
      )}

      {/* ── What's included ──────────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 600, width: '100%' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem' }}>
            Everything You Get
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: NAVY, lineHeight: 1.2, marginBottom: '1rem' }}>
            Two tools. One clear strategy.
          </h2>
          <p style={{ fontSize: '1rem', color: '#374151', lineHeight: 1.75, marginBottom: '2.5rem' }}>
            Your {price} gets you a planning template you keep forever and 60 days of AI coaching trained on the book.
          </p>

          {/* Two columns: template + Ezra */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: '2.5rem', textAlign: 'left' }}>
            {/* Template card */}
            <div style={{ background: NAVY, borderRadius: 14, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 32 }}>📋</span>
              <div>
                <p style={{ color: GOLD, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>Included Free</p>
                <h3 style={{ color: WHITE, fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>Child Strategic Plan Diagnostic</h3>
                <p style={{ color: 'rgba(253,248,240,0.7)', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 16 }}>
                  A fillable PDF designed to help you think clearly about your child — their learning style, strengths, struggles, interests, and education strategy. Fill it out before your first Ezra session and use it as your roadmap throughout.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {['Map your child\'s learning style', 'Identify gifts and strengths early', 'Clarify your education goals', 'Build a strategy you can act on', 'Reuse for each child you have'].map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.85rem', color: 'rgba(253,248,240,0.75)' }}>
                      <span style={{ color: GOLD, flexShrink: 0 }}>✦</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a
                href="/child-strategic-plan.pdf"
                download="Child-Strategic-Plan-Diagnostic.pdf"
                style={{ display: 'inline-block', background: GOLD, color: NAVY, padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}
              >
                ↓ Download Free Now
              </a>
            </div>

            {/* Ezra card */}
            <div style={{ background: WHITE, border: `1px solid rgba(200,169,81,0.3)`, borderRadius: 14, padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <span style={{ fontSize: 32 }}>✦</span>
              <div>
                <p style={{ color: GOLD, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: 6 }}>60-Day Access</p>
                <h3 style={{ color: NAVY, fontSize: '1.1rem', fontWeight: 700, marginBottom: 10, lineHeight: 1.3 }}>Ezra — Your AI Coaching Companion</h3>
                <p style={{ color: '#374151', fontSize: '0.88rem', lineHeight: 1.7, marginBottom: 16 }}>
                  Ezra is trained on the full manuscript of Will Meier&apos;s book. Ask him anything about your child&apos;s education, learning style, or development and get coaching grounded in specific frameworks — not generic advice.
                </p>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    `Up to ${product.dailyLimit} conversations per day`,
                    '60 days of access from purchase',
                    'Personalized — not one-size-fits-all',
                    'Grounded in the book\'s frameworks',
                    'Available any time, any device',
                  ].map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', fontSize: '0.85rem', color: '#374151' }}>
                      <span style={{ color: GOLD, flexShrink: 0 }}>✦</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <a href="#purchase" style={{ display: 'inline-block', background: NAVY, color: GOLD, padding: '10px 0', borderRadius: 8, fontWeight: 700, fontSize: '0.88rem', textDecoration: 'none', textAlign: 'center', marginTop: 'auto' }}>
                Get Access — {price} →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Purchase ─────────────────────────────────────────────────────── */}
      <section id="purchase" style={{ background: '#0a1f3a', padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 520, width: '100%' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem' }}>
            Limited-Time Offer
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 400, color: WHITE, lineHeight: 1.2, marginBottom: '0.75rem' }}>
            {product.daysAccess} Days of Coaching + Planning Template
          </h2>
          <p style={{ fontSize: '2rem', color: GOLD, fontWeight: 700, marginBottom: '2rem' }}>{price}</p>

          {/* Bonus callout */}
          <div style={{ background: 'rgba(200,169,81,0.1)', border: `1px solid rgba(200,169,81,0.3)`, borderRadius: 12, padding: '1.25rem 1.5rem', textAlign: 'left', marginBottom: '1.75rem', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>📋</span>
            <div>
              <p style={{ color: GOLD, fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>Includes: Child Strategic Plan Diagnostic</p>
              <p style={{ color: 'rgba(253,248,240,0.65)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>
                Download instantly. Fillable PDF planning tool — yours to keep forever, even after your coaching access expires.
              </p>
            </div>
          </div>

          {/* Checkout form */}
          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ border: '1px solid rgba(200,169,81,0.3)', borderRadius: 8, padding: '14px 16px', fontSize: 15, outline: 'none', color: CREAM, background: 'rgba(255,255,255,0.07)', width: '100%' }}
            />
            <button
              type="submit"
              disabled={checkoutLoading || !email.trim()}
              style={{
                background: GOLD, color: NAVY, border: 'none', borderRadius: 8,
                padding: '16px 0', fontWeight: 700, fontSize: 16, width: '100%', letterSpacing: '0.02em',
                cursor: checkoutLoading || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: checkoutLoading || !email.trim() ? 0.7 : 1,
              }}
            >
              {checkoutLoading ? 'Redirecting…' : `Get ${product.daysAccess}-Day Access — ${price} →`}
            </button>
            <p style={{ fontSize: '0.8rem', color: 'rgba(253,248,240,0.45)', textAlign: 'center', lineHeight: 1.5 }}>
              Secure checkout via Stripe. One-time payment. Access begins immediately.
            </p>
            <p style={{ fontSize: '0.72rem', color: 'rgba(253,248,240,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
              Ezra is an AI coaching tool trained on Will Meier&apos;s book. It is not a licensed educator, therapist, or diagnostician. For learning disabilities, medical concerns, or clinical questions, please consult a qualified professional.
            </p>
          </form>
        </div>
      </section>

      {/* ── Example questions ────────────────────────────────────────────── */}
      {product.exampleQuestions?.length > 0 && (
        <section style={{ background: NAVY, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 400, color: WHITE, marginBottom: '0.75rem' }}>
              What people ask Ezra
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, maxWidth: 860, width: '100%' }}>
            {product.exampleQuestions.map((q, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: 12, padding: '1.25rem' }}>
                <span style={{ color: GOLD, fontSize: 20, display: 'block', marginBottom: 10 }}>✦</span>
                <p style={{ fontSize: '0.9rem', color: 'rgba(253,248,240,0.8)', lineHeight: 1.65, fontStyle: 'italic' }}>{q}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section style={{ background: CREAM, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
        <div style={{ maxWidth: 680, width: '100%' }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem', textAlign: 'center' }}>
            Common Questions
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)', fontWeight: 400, color: NAVY, marginBottom: '2.5rem', textAlign: 'center' }}>
            Everything you need to know
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, borderTop: '1px solid #e5e7eb' }}>
            {FAQ.map((item, i) => (
              <div key={i} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '1.25rem 0', gap: 16, textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: '1rem', fontWeight: 600, color: NAVY, lineHeight: 1.4, flex: 1 }}>
                    {item.q}
                  </span>
                  <span style={{ color: GOLD, fontSize: '1.4rem', fontWeight: 300, flexShrink: 0, marginTop: 2, lineHeight: 1 }}>
                    {openFaq === i ? '−' : '+'}
                  </span>
                </button>
                {openFaq === i && (
                  <p style={{ fontSize: '0.93rem', color: '#374151', lineHeight: 1.75, paddingBottom: '1.25rem', margin: 0 }}>
                    {item.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer CTA ───────────────────────────────────────────────────── */}
      <section style={{ background: GOLD, padding: '4rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, color: NAVY, marginBottom: '0.75rem' }}>
          The investment in clarity is worth it.
        </h2>
        <p style={{ color: 'rgba(2,26,53,0.75)', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
          {product.daysAccess} days. {product.dailyLimit} conversations a day. {price}.
        </p>
        <p style={{ color: 'rgba(2,26,53,0.6)', marginBottom: '2rem', fontSize: '0.85rem' }}>
          Plus your free Child Strategic Plan Diagnostic — download it now, no purchase needed.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <a href="#purchase" style={{ display: 'inline-block', background: NAVY, color: GOLD, padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '0.02em' }}>
            Get Access Now →
          </a>
          <a
            href="/child-strategic-plan.pdf"
            download="Child-Strategic-Plan-Diagnostic.pdf"
            style={{ display: 'inline-block', background: 'transparent', color: NAVY, padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '0.02em', border: `2px solid ${NAVY}` }}
          >
            ↓ Free Template
          </a>
        </div>
      </section>
    </>
  );
}

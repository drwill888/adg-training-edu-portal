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

// Next.js generates /books/child-education, /books/leadership-legacy, etc.
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

export default function BookPage({ product }) {
  const [email, setEmail]               = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [hasPaid, setHasPaid]           = useState(false);
  const [initialEmail, setInitialEmail] = useState('');

  // Detect Stripe success redirect
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

      {/* Hero */}
      <section style={{ background: NAVY, padding: '5rem 2rem 4rem', textAlign: 'center', borderBottom: `1px solid rgba(200,169,81,0.2)` }}>
        <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.75rem', marginBottom: '1.5rem' }}>
          For Readers of the Book
        </p>
        <h1 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.15, color: WHITE, maxWidth: 700, margin: '0 auto 1.5rem' }}>
          Ask Ezra — {product.name}
        </h1>
        <p style={{ fontSize: '1.1rem', color: 'rgba(253,248,240,0.8)', lineHeight: 1.75, maxWidth: 560, margin: '0 auto 2.5rem' }}>
          {product.description}
        </p>
        <div style={{ display: 'inline-flex', gap: 8, alignItems: 'center', background: 'rgba(200,169,81,0.12)', border: `1px solid rgba(200,169,81,0.3)`, borderRadius: 999, padding: '6px 18px', fontSize: '0.85rem', color: GOLD }}>
          <span>⏱</span>
          <span>Limited-time offer — {price} for {product.daysAccess} days</span>
        </div>
      </section>

      {/* Chat — shown after payment */}
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
          <div style={{ width: '100%', maxWidth: 640 }}>
            <ProductChat productSlug={product.slug} product={product} initialEmail={initialEmail} />
          </div>
        </section>
      )}

      {/* Already have access — open chat */}
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
        </section>
      )}

      {/* Purchase */}
      <section id="purchase" style={{ background: CREAM, padding: '5rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
        <div style={{ textAlign: 'center', maxWidth: 600 }}>
          <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.7rem', marginBottom: '1rem' }}>
            Limited-Time Offer
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 400, color: NAVY, lineHeight: 1.2, marginBottom: '1.25rem' }}>
            {product.daysAccess} Days of Personalized Coaching — {price}
          </h2>
          <p style={{ fontSize: '1rem', color: '#374151', lineHeight: 1.75, marginBottom: '2rem' }}>
            {product.description}
          </p>

          {/* What you get */}
          <div style={{ background: WHITE, border: `1px solid rgba(200,169,81,0.3)`, borderRadius: 12, padding: '1.5rem', textAlign: 'left', marginBottom: '2rem' }}>
            {[
              `Up to ${product.dailyLimit} conversations per day for ${product.daysAccess} days`,
              'Personalized strategy — not generic advice',
              'Answers grounded in the book',
              'Ask about your specific situation and get a real plan',
              'Secure access — starts immediately after payment',
            ].map((item, i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '8px 0', borderBottom: i < arr.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <span style={{ color: GOLD, fontSize: 16, flexShrink: 0, marginTop: 1 }}>✦</span>
                <span style={{ fontSize: '0.95rem', color: '#374151', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Checkout form */}
          <form onSubmit={handleCheckout} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 420, margin: '0 auto' }}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '14px 16px', fontSize: 15, outline: 'none', color: NAVY, background: WHITE, width: '100%' }}
            />
            <button
              type="submit"
              disabled={checkoutLoading || !email.trim()}
              style={{
                background: NAVY, color: GOLD, border: 'none', borderRadius: 8,
                padding: '16px 0', fontWeight: 700, fontSize: 16, width: '100%', letterSpacing: '0.02em',
                cursor: checkoutLoading || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: checkoutLoading || !email.trim() ? 0.7 : 1,
              }}
            >
              {checkoutLoading ? 'Redirecting…' : `Get ${product.daysAccess}-Day Access — ${price} →`}
            </button>
            <p style={{ fontSize: '0.8rem', color: GRAY, textAlign: 'center', lineHeight: 1.5 }}>
              Secure checkout via Stripe. One-time payment. Access begins immediately.
            </p>
          </form>
        </div>
      </section>

      {/* Example questions */}
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

      {/* Footer CTA */}
      <section style={{ background: GOLD, padding: '3rem 2rem', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, color: NAVY, marginBottom: '0.75rem' }}>
          The investment in clarity is worth it.
        </h2>
        <p style={{ color: 'rgba(2,26,53,0.75)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
          {product.daysAccess} days. {product.dailyLimit} conversations a day. {price}.
        </p>
        <a href="#purchase" style={{ display: 'inline-block', background: NAVY, color: GOLD, padding: '14px 32px', borderRadius: 8, fontWeight: 700, fontSize: 15, textDecoration: 'none', letterSpacing: '0.02em' }}>
          Get Access Now →
        </a>
      </section>
    </>
  );
}

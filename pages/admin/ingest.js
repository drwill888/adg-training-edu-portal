import { useState } from 'react';
import Head from 'next/head';
import { getAllSlugs, getProduct } from '@/lib/products/registry';

const NAVY = '#021A35';
const GOLD = '#C8A951';
const CREAM = '#FDF8F0';

export async function getStaticProps() {
  const slugs = getAllSlugs();
  const products = slugs.map((slug) => getProduct(slug));
  return { props: { products } };
}

export default function IngestAdmin({ products }) {
  const [adminKey, setAdminKey]   = useState('');
  const [results, setResults]     = useState({});
  const [loading, setLoading]     = useState({});

  async function runIngest(productSlug) {
    if (!adminKey.trim()) {
      alert('Enter your ADMIN_SECRET key first.');
      return;
    }
    setLoading((prev) => ({ ...prev, [productSlug]: true }));
    setResults((prev) => ({ ...prev, [productSlug]: null }));

    try {
      const res = await fetch('/api/books/ingest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': adminKey.trim(),
        },
        body: JSON.stringify({ productSlug }),
      });
      const data = await res.json();
      setResults((prev) => ({ ...prev, [productSlug]: data }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [productSlug]: { error: err.message || 'Request failed' },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [productSlug]: false }));
    }
  }

  return (
    <>
      <Head>
        <title>Knowledge Base Ingest — ADG Admin</title>
        <style>{`* { box-sizing: border-box; margin: 0; padding: 0; } body { font-family: Georgia, serif; background: ${NAVY}; color: ${CREAM}; min-height: 100vh; padding: 3rem 2rem; }`}</style>
      </Head>

      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <p style={{ color: GOLD, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '0.75rem', marginBottom: '1rem' }}>
          ADG Admin
        </p>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: '1.8rem', fontWeight: 400, marginBottom: '0.5rem' }}>
          Knowledge Base Ingest
        </h1>
        <p style={{ color: 'rgba(253,248,240,0.6)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: 1.6 }}>
          Loads each book's knowledge base from the <code style={{ background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: 4 }}>knowledge/</code> folder into Supabase so Ezra can answer questions from it. Run this once when you first set up a book, and again whenever you update the manuscript.
        </p>

        {/* Admin key input */}
        <div style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid rgba(200,169,81,0.25)`, borderRadius: 10, padding: '1.25rem', marginBottom: '2rem' }}>
          <label style={{ display: 'block', fontSize: '0.8rem', color: GOLD, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
            Admin Secret Key
          </label>
          <input
            type="password"
            placeholder="Paste your ADMIN_SECRET here"
            value={adminKey}
            onChange={(e) => setAdminKey(e.target.value)}
            style={{ width: '100%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, padding: '10px 14px', fontSize: 14, color: CREAM, outline: 'none' }}
          />
          <p style={{ fontSize: '0.75rem', color: 'rgba(253,248,240,0.4)', marginTop: 8 }}>
            This is the ADMIN_SECRET value you set in Vercel environment variables.
          </p>
        </div>

        {/* Product list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {products.map((product) => {
            const result  = results[product.slug];
            const busy    = loading[product.slug];
            const success = result && !result.error;
            const failed  = result && result.error;

            return (
              <div
                key={product.slug}
                style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${success ? 'rgba(74,222,128,0.4)' : failed ? 'rgba(239,68,68,0.4)' : 'rgba(200,169,81,0.2)'}`, borderRadius: 12, padding: '1.5rem' }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{product.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(253,248,240,0.5)', fontFamily: 'monospace' }}>
                      slug: {product.slug} · {product.daysAccess} days · ${product.priceUsd / 100}
                    </div>
                  </div>
                  <button
                    onClick={() => runIngest(product.slug)}
                    disabled={busy || !adminKey.trim()}
                    style={{
                      background: busy ? 'rgba(200,169,81,0.3)' : GOLD,
                      color: NAVY,
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 20px',
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: busy || !adminKey.trim() ? 'not-allowed' : 'pointer',
                      opacity: busy || !adminKey.trim() ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {busy ? 'Ingesting…' : 'Run Ingest'}
                  </button>
                </div>

                {/* Result */}
                {result && (
                  <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 8, background: success ? 'rgba(74,222,128,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${success ? 'rgba(74,222,128,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    {success ? (
                      <p style={{ fontSize: '0.9rem', color: '#86efac' }}>
                        ✓ {result.message}
                      </p>
                    ) : (
                      <p style={{ fontSize: '0.9rem', color: '#fca5a5' }}>
                        ✗ {result.error}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <p style={{ marginTop: '3rem', fontSize: '0.75rem', color: 'rgba(253,248,240,0.3)', textAlign: 'center' }}>
          This page is not linked anywhere. Keep the URL private.
        </p>
      </div>
    </>
  );
}

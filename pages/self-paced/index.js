// pages/self-paced/index.js
// Called to Carry — Self-Paced Journey sales page
// $149 · 3 months access · 6 modules · No live calls

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import styles from '../../styles/SelfPaced.module.css';

const MODULES = [
  { number: '01', name: 'Introduction', color: '#0172BC', desc: 'Discover the framework. Understand what it means to carry an assignment — and why most leaders are carrying the wrong things.' },
  { number: '02', name: 'Calling', color: '#C8A951', desc: 'Name what you were built for. Identify your point of origin and establish your true north — the anchor that everything else builds from.' },
  { number: '03', name: 'Connection', color: '#0172BC', desc: 'Understand the relational architecture of your assignment. Who you are connected to shapes what you are able to build.' },
  { number: '04', name: 'Competency', color: '#F47722', desc: 'Audit your gifts, skills, and gaps with honesty. Build from what you actually carry — not what you think you should have.' },
  { number: '05', name: 'Capacity', color: '#EE3124', desc: 'Confront the internal limits that slow your build. Address pressure, forgiveness, rest, and sustainability at the root.' },
  { number: '06', name: 'Convergence', color: '#0172BC', desc: 'Find your sweet spot — the intersection of calling, competency, and capacity. Define what you carry and what you release.' },
];

const INCLUDED = [
  'All 6 formation modules — self-paced, on your schedule',
  'Diagnostic assessments inside each module',
  'AI-powered Blueprint generation after each module',
  'Personalized Called to Carry Blueprint document export',
  'Certificate of Completion',
  '3 months of full portal access',
];

const FAQS = [
  { q: 'How long does it take to complete?', a: 'Most leaders complete one module per week, finishing in 6 weeks. You have 3 months — go at the pace that serves your formation, not your schedule.' },
  { q: 'Is there any live interaction?', a: 'This tier is fully self-paced. No live calls, no group sessions. You have access to the AI training assistant for content questions. For live formation with Will, see the Founders Cohort.' },
  { q: "What's the difference between this and the Cohort?", a: 'The Self-Paced Journey gives you the full formation content on your own time. The Founders Cohort adds 8 weeks of live group sessions, covenant community, and direct coaching. Same content — different depth of experience.' },
  { q: 'What happens after 3 months?', a: 'Your access expires. Your Blueprint documents and Certificate remain yours. Many leaders use the 3-month window as motivation to complete the journey with focus and intention.' },
  { q: 'Do I need to take the assessment first?', a: 'The Called to Carry Assessment is free and takes 15 minutes. It gives you your archetype before you begin — which makes the portal experience significantly richer. We recommend it as your first step.' },
];

export default function SelfPacedPage() {
  const [openFaq, setOpenFaq] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/self-paced/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned', data);
        setLoading(false);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Self-Paced Journey — Called to Carry</title>
        <meta name="description" content="Six modules. Three months. Discover what you were called to carry — on your schedule, at your pace." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.page}>
        {/* ── NAV ── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLogo}>Called to Carry</Link>
          <div className={styles.navLinks}>
            <Link href="/called-to-carry/assessment" className={styles.navLink}>Free Assessment</Link>
            <Link href="/called-to-carry/founders" className={styles.navLink}>Cohort</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroGrain} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={styles.heroPretitle}>Called to Carry · Self-Paced Journey</p>
            <h1 className={styles.heroHeadline}>
              Go Deep.<br />
              <em>On Your Schedule.</em>
            </h1>
            <p className={styles.heroSub}>
              Six modules of Kingdom leadership formation — designed to help you name your calling, audit your capacity, and converge on what you were actually built to carry. No live calls. No deadlines. Just you and the work.
            </p>
            <div className={styles.heroCtas}>
              <button className={styles.btnPrimary} onClick={handleCheckout} disabled={loading}>
                {loading ? 'Redirecting...' : 'Start the Journey — $149'}
              </button>
              <a href="#modules" className={styles.btnGhost}>See the Modules</a>
            </div>
            <p className={styles.heroNote}>
              Haven't taken the assessment yet?{' '}
              <Link href="/called-to-carry/assessment" className={styles.inlineLink}>
                Start there — it's free →
              </Link>
            </p>
          </div>
        </section>

        {/* ── FOR WHOM ── */}
        <section className={styles.forWhom}>
          <div className={styles.container}>
            <div className={styles.forGrid}>
              <div className={styles.forLeft}>
                <p className={styles.eyebrow}>This Is For You</p>
                <h2 className={styles.sectionHeading}>
                  You know something<br />is stirring.<br />
                  <em>You just need language.</em>
                </h2>
              </div>
              <div className={styles.forRight}>
                <ul className={styles.forList}>
                  {[
                    "You sense a calling but can't articulate it clearly",
                    "You're building — but something feels misaligned",
                    "You need formation on your own time, not a group schedule",
                    "You want the content before committing to a live cohort",
                    "You're in a season of discernment and need structured clarity",
                  ].map((item, i) => (
                    <li key={i} className={styles.forItem}>
                      <span className={styles.forMark}>✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── MODULES ── */}
        <section className={styles.modules} id="modules">
          <div className={styles.container}>
            <p className={styles.eyebrow}>The Formation Path</p>
            <h2 className={styles.sectionHeading}>Six modules. One journey.</h2>
            <div className={styles.modulesGrid}>
              {MODULES.map((mod) => (
                <div key={mod.number} className={styles.moduleCard}>
                  <div className={styles.moduleAccent} style={{ background: mod.color }} />
                  <span className={styles.moduleNumber}>{mod.number}</span>
                  <h3 className={styles.moduleName}>{mod.name}</h3>
                  <p className={styles.moduleDesc}>{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUOTE ── */}
        <section className={styles.quoteBlock}>
          <div className={styles.container}>
            <blockquote className={styles.quote}>
              "Before I formed you in the womb I knew you, before you were born I set you apart."
              <cite>Jeremiah 1:5</cite>
            </blockquote>
          </div>
        </section>

        {/* ── INCLUDED ── */}
        <section className={styles.included}>
          <div className={styles.container}>
            <div className={styles.includedGrid}>
              <div className={styles.includedLeft}>
                <p className={styles.eyebrow}>What You Receive</p>
                <h2 className={styles.sectionHeading}>
                  Everything you need.<br />Nothing you don't.
                </h2>
                <p className={styles.includedIntro}>
                  The Self-Paced Journey is intentionally lean. No fluff, no filler — just the formation content, the diagnostics, and the tools to build from what you discover.
                </p>
              </div>
              <div className={styles.includedRight}>
                <ul className={styles.includedList}>
                  {INCLUDED.map((item, i) => (
                    <li key={i} className={styles.includedItem}>
                      <span className={styles.includedMark}>✦</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className={styles.pricing}>
          <div className={styles.container}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingGrain} aria-hidden="true" />
              <div className={styles.pricingInner}>
                <div className={styles.pricingLeft}>
                  <p className={styles.eyebrowLight}>Self-Paced Journey</p>
                  <h2 className={styles.pricingHeadline}>
                    One investment.<br />Three months of formation.
                  </h2>
                  <p className={styles.pricingCaption}>
                    Six modules. Full portal access. Blueprint export. Certificate of Completion. Everything included — no upsells, no hidden costs.
                  </p>
                  <p className={styles.pricingDisclaimer}>
                    Want live formation with Will?{' '}
                    <Link href="/called-to-carry/founders" className={styles.pricingLink}>
                      See the Founders Cohort →
                    </Link>
                  </p>
                </div>
                <div className={styles.pricingRight}>
                  <div className={styles.pricingAmount}>
                    <span className={styles.pricingCurrency}>$</span>
                    <span className={styles.pricingNumber}>149</span>
                  </div>
                  <p className={styles.pricingPer}>one-time · 3 months access</p>
                  <button className={styles.btnPrimaryLarge} onClick={handleCheckout} disabled={loading}>
                    {loading ? 'Redirecting...' : 'Start the Journey'}
                  </button>
                  <p className={styles.pricingSecure}>Secure checkout via Stripe</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={styles.faq}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Questions</p>
            <h2 className={styles.sectionHeading}>Before you begin.</h2>
            <div className={styles.faqList}>
              {FAQS.map((item, i) => (
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                  <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
                    <span>{item.q}</span>
                    <span className={styles.faqCaret}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  <div className={styles.faqAnswer}><p>{item.a}</p></div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── FINAL CTA ── */}
        <section className={styles.finalCta}>
          <div className={styles.finalGrain} aria-hidden="true" />
          <div className={styles.container}>
            <h2 className={styles.finalHeadline}>
              The clarity you need<br />
              <em>is already inside the journey.</em>
            </h2>
            <p className={styles.finalSub}>$149. Three months. Six modules. Start today.</p>
            <button className={styles.btnPrimaryLarge} onClick={handleCheckout} disabled={loading}>
              {loading ? 'Redirecting...' : 'Start the Journey — $149'}
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <p>© {new Date().getFullYear()} Awakening Destiny Global · All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.</p>
            <div className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <Link href="/called-to-carry/assessment">Assessment</Link>
              <Link href="/called-to-carry/founders">Cohort</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
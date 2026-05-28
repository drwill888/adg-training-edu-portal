// pages/called-to-carry/index.js
// Called to Carry — landing/sales page
// Three tiers: $149 Self-Paced / $497 21-Day Sprint / $997 Founders Cohort

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import s from '../../styles/called-to-carry-landing.module.css';

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="9" fill="#C8A951" fillOpacity="0.15" />
      <path d="M5 9l3 3 5-5" stroke="#C8A951" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="8" fill="#C8A951" fillOpacity="0.1" />
      <path d="M5 5l6 6M11 5l-6 6" stroke="#C8A951" strokeOpacity="0.7" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ open }) {
  return (
    <svg className={s.faqIcon} width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true"
      style={{ transform: open ? 'rotate(45deg)' : 'none' }}>
      <path d="M10 4v12M4 10h12" stroke="#C8A951" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

const FRAMEWORK_CARDS = [
  { title: 'Calling', body: 'Understand what you are actually carrying — the weight, the assignment, the season.' },
  { title: 'Connection', body: 'Build the relational authority that multiplies your reach and holds your community together.' },
  { title: 'Competency', body: 'Refine the capacity that makes your grace trustworthy and your leadership credible.' },
  { title: 'Capacity', body: 'Build the internal structure to hold what God has entrusted to you without collapsing under it.' },
  { title: 'Convergence', body: 'Move from preparation to deployment — the moment everything aligns for impact.' },
];

const OUTCOMES = [
  'Name what you are carrying with language that actually fits',
  'Identify the internal structures that are limiting your capacity',
  'Stop cycling through the same frustrations with different contexts',
  'Build a personal development framework you can maintain',
  'Lead with more clarity and less internal noise',
  'Know your next step — and have the conviction to take it',
];

const FOR_ITEMS = [
  'Leaders who feel the weight of what they carry but lack language for it',
  'Those in transition between seasons and needing to recalibrate',
  'People who are spiritually awake but practically stuck',
  'Leaders who want structured formation, not just inspiration',
  'Those ready to invest seriously in their own development',
];

const NOT_FOR_ITEMS = [
  'People looking for quick fixes or motivation without transformation',
  'Those not willing to do honest inner work',
  'Leaders who want someone to solve their problems for them',
  'People who are not in an active leadership assignment',
];

const FAQ_ITEMS = [
  { q: 'Which path is right for me?', a: 'If you need to start now and work at your own pace, choose Self-Paced. If you are at a significant threshold and want direct access to Will in an intensive 21-day formation window, choose the Sprint. If you want a covenant community of serious leaders over 8 weeks, the Founders Cohort is for you.' },
  { q: 'What is the difference between the Sprint and the Cohort?', a: 'The 21-Day Sprint is intensive, personal, and fast — 21 days of direct access to Will designed for leaders at a threshold moment. The Founders Cohort is an 8-week covenant community experience with live sessions, group processing, and deep peer relationships.' },
  { q: 'Do I need to take the assessment first?', a: 'Yes. The 10-Q Assessment is the starting point for all three paths. It takes less than 5 minutes and gives you and Will a shared vocabulary before the journey begins.' },
  { q: 'Is there a payment plan?', a: 'Yes. A two-payment option is available at checkout for the Sprint and Founders Cohort. Full details are on the application page.' },
  { q: 'What is the time commitment?', a: 'Self-Paced is fully flexible — go at your own rhythm. The 21-Day Sprint is intensive by design. The Founders Cohort requires approximately 3–4 hours per week across 8 weeks.' },
  { q: 'What if I cannot attend a live Cohort session?', a: 'All Cohort sessions are recorded and available within 24 hours. Live attendance significantly increases the value, but you will not lose access to the material.' },
];

export default function CalledToCarryLanding() {
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function handleSelfPacedCheckout() {
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/self-paced/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setCheckoutLoading(false);
    }
  }

  return (
    <div className={s.page}>
      <Head>
        <title>Called to Carry — Awakening Destiny Global</title>
        <meta name="description" content="Gain Clarity for Commissioning. Three paths to walk out your assignment — Self-Paced, 21-Day Sprint, or Founders Cohort." />
        <meta property="og:title" content="Called to Carry — Gain Clarity for Commissioning" />
        <meta property="og:description" content="Three paths. One destination. Commissioning." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {/* ── Nav ── */}
      <nav className={s.nav}>
        <div className={s.navInner}>
          <span className={s.navLogo}>Awakening Destiny Global</span>
          <Link href="/called-to-carry/assessment" className={s.navCta}>Take the Free Assessment</Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={s.hero}>
        <div className={s.heroInner}>
          <p className={s.heroEyebrow}>Called to Carry · Gain Clarity for Commissioning</p>
          <h1 className={s.heroHeadline}>
            You are carrying something<br />
            <em>larger than your current language for it.</em>
          </h1>
          <p className={s.heroSub}>
            A formation journey for leaders who sense their assignment is expanding — and need the clarity, capacity, and framework to carry it well.
          </p>
          <div className={s.heroCtas}>
            <Link href="/called-to-carry/assessment" className={s.ctaPrimary}>
              Take the Free Assessment <ArrowIcon />
            </Link>
            <a href="#pricing" className={s.ctaSecondary}>
              View the Three Paths
            </a>
          </div>
          <p className={s.heroScarcity}>
            <span className={s.scarcityDot} />
            Three tiers. One destination. Commissioning.
          </p>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className={s.problem}>
        <div className={s.sectionInner}>
          <p className={s.sectionLabel}>The Problem</p>
          <h2 className={s.sectionHeadline}>The weight is real. The language is missing.</h2>
          <div className={s.problemGrid}>
            <div className={s.problemCard}><p>You know you are carrying something significant — a vision, an assignment, a weight that others around you do not seem to feel.</p></div>
            <div className={s.problemCard}><p>But the internal experience of that is often confusion, frustration, or quiet exhaustion — because you do not yet have the language, the structure, or the community to carry it well.</p></div>
            <div className={s.problemCard}><p>Called to Carry exists to give you that language — and to build the internal architecture to match the weight of what you are carrying.</p></div>
          </div>
        </div>
      </section>

      {/* ── Framework ── */}
      <section className={s.framework}>
        <div className={s.sectionInner}>
          <p className={s.sectionLabel}>The Framework</p>
          <h2 className={s.sectionHeadline}>The 5C Leadership Blueprint</h2>
          <p className={s.sectionSub}>Five dimensions that form the complete architecture of your calling. Every module maps to one dimension. Together they take you from identity to commissioning.</p>
          <div className={s.frameworkGrid}>
            {FRAMEWORK_CARDS.map((card) => (
              <div key={card.title} className={s.frameworkCard}>
                <h3 className={s.frameworkTitle}>{card.title}</h3>
                <p className={s.frameworkBody}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Outcomes ── */}
      <section className={s.outcomes}>
        <div className={s.sectionInner}>
          <p className={s.sectionLabel}>Outcomes</p>
          <h2 className={s.sectionHeadline}>What you will walk away with</h2>
          <ul className={s.outcomesList}>
            {OUTCOMES.map((outcome) => (
              <li key={outcome} className={s.outcomesItem}>
                <CheckIcon />
                <span>{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ── Author ── */}
      <section className={s.author}>
        <div className={s.sectionInner}>
          <div className={s.authorGrid}>
            <div className={s.authorPhoto}>
             <img src="/images/will-meier.jpg" alt="Will Meier" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', borderRadius: '8px' }} />
            </div>
            <div className={s.authorContent}>
              <p className={s.sectionLabel}>Your Guide</p>
              <h2 className={s.authorName}>Will Meier</h2>
              <p className={s.authorTitle}>Founder, Awakening Destiny Global</p>
              <p className={s.authorBio}>Will has spent two decades working with leaders who carry significant assignments — helping them name what they are carrying, build the internal architecture to hold it, and release it into the world with clarity and conviction.</p>
              <p className={s.authorBio}>Called to Carry is the distillation of everything he has learned about what it takes to carry an assignment well — and to build organisations, movements, and legacies that outlast any single season.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Three Paths Pricing ── */}
      <section className={s.pricing} id="pricing">
        <div className={s.sectionInner}>
          <p className={s.sectionLabel}>Investment</p>
          <h2 className={s.sectionHeadline}>Three Paths. One Destination.</h2>
          <p className={s.sectionSub}>Every path walks the same 5C Leadership Blueprint. The difference is pace, access, and community.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>

            {/* Self-Paced $149 */}
            <div className={s.pricingCard} style={{ display: 'flex', flexDirection: 'column' }}>
              <p className={s.sectionLabel} style={{ marginBottom: '0.5rem' }}>Self-Paced</p>
              <div className={s.pricingAmount}>
                <span className={s.pricingCurrency}>$</span>
                <span className={s.pricingNumber}>149</span>
              </div>
              <p className={s.pricingNote} style={{ marginBottom: '1.5rem' }}>Open enrollment. Begin immediately.</p>
              <ul className={s.pricingList} style={{ flexGrow: 1 }}>
                {[
                  'All seven formation modules',
                  'Text + audio teaching',
                  'Personalised 5C Blueprint diagnostic',
                  'Pre + Post 25-Q assessment',
                  'Transformation Report',
                  'Certificate of Commissioning',
                  '3 months portal access',
                ].map((item) => (
                  <li key={item} className={s.pricingListItem}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleSelfPacedCheckout}
                disabled={checkoutLoading}
                className={s.ctaPrimary}
                style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem', width: '100%', cursor: 'pointer', border: 'none' }}
              >
                {checkoutLoading ? 'Redirecting…' : 'Start the Journey →'}
              </button>
              <p className={s.pricingFootnote}>No application required</p>
            </div>

            {/* 21-Day Sprint $497 */}
            <div className={s.pricingCard} style={{ display: 'flex', flexDirection: 'column' }}>
              <p className={s.sectionLabel} style={{ marginBottom: '0.5rem' }}>21-Day Sprint</p>
              <div className={s.pricingAmount}>
                <span className={s.pricingCurrency}>$</span>
                <span className={s.pricingNumber}>497</span>
              </div>
              <p className={s.pricingNote} style={{ marginBottom: '1.5rem' }}>Intensive. Personal. 21 days live with Will.</p>
              <ul className={s.pricingList} style={{ flexGrow: 1 }}>
                {[
                  'Everything in Self-Paced',
                  '21 days of direct access to Will',
                  'Personal apostolic counsel',
                  'Accelerated formation rhythm',
                  'Designed for leaders at a threshold',
                ].map((item) => (
                  <li key={item} className={s.pricingListItem}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/called-to-carry/sprint/apply" className={s.ctaPrimary} style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem' }}>
                Apply for the Sprint →
              </Link>
              <p className={s.pricingFootnote}>Application required · Limited capacity</p>
            </div>

            {/* Founders Cohort $997 */}
            <div className={s.pricingCard} style={{ display: 'flex', flexDirection: 'column', background: 'rgba(200,169,81,0.08)', border: '1px solid rgba(200,169,81,0.5)' }}>
              <div className={s.pricingBadge} style={{ marginBottom: '0.75rem' }}>Most Transformative</div>
              <p className={s.sectionLabel} style={{ marginBottom: '0.5rem' }}>Founders Cohort</p>
              <div className={s.pricingAmount}>
                <span className={s.pricingCurrency}>$</span>
                <span className={s.pricingNumber}>997</span>
              </div>
              <p className={s.pricingNote} style={{ marginBottom: '1.5rem' }}>8-week covenant community. Will reviews personally.</p>
              <ul className={s.pricingList} style={{ flexGrow: 1 }}>
                {[
                  'Everything in Self-Paced',
                  'Live Zoom cohort sessions with Will',
                  'Group processing and community',
                  '8-week guided formation rhythm',
                  'Direct interaction with Will',
                  'Covenant community of serious leaders',
                ].map((item) => (
                  <li key={item} className={s.pricingListItem}>
                    <CheckIcon />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/called-to-carry/founders/apply" className={s.ctaPrimary} style={{ display: 'block', textAlign: 'center', marginTop: '1.5rem' }}>
                Apply for the Cohort →
              </Link>
              <p className={s.pricingFootnote}>Application required · Will reviews personally</p>
            </div>

          </div>
        </div>
      </section>

      {/* ── Guarantee ── */}
      <section className={s.guarantee}>
        <div className={s.sectionInner}>
          <div className={s.guaranteeCard}>
            <h2 className={s.guaranteeTitle}>The Clarity Guarantee</h2>
            <p className={s.guaranteeBody}>If after completing the first two modules you do not feel you have gained meaningful clarity on what you are carrying and your next step, we will refund your investment in full — no questions asked.</p>
            <p className={s.guaranteeBody}>We are confident in the value of this work. We want you to be too.</p>
          </div>
        </div>
      </section>

      {/* ── For / Not For ── */}
      <section className={s.forNotFor}>
        <div className={s.sectionInner}>
          <div className={s.forNotForGrid}>
            <div className={s.forCol}>
              <h3 className={s.forTitle}>This is for you if…</h3>
              <ul className={s.forList}>
                {FOR_ITEMS.map((item) => (
                  <li key={item} className={s.forItem}><CheckIcon /><span>{item}</span></li>
                ))}
              </ul>
            </div>
            <div className={s.notForCol}>
              <h3 className={s.notForTitle}>This is not for you if…</h3>
              <ul className={s.notForList}>
                {NOT_FOR_ITEMS.map((item) => (
                  <li key={item} className={s.notForItem}><CrossIcon /><span>{item}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className={s.finalCta}>
        <div className={s.sectionInner}>
          <h2 className={s.finalCtaHeadline}>
            You were made to carry this.<br />
            <em>It is time to do it well.</em>
          </h2>
          <div className={s.heroCtas}>
            <Link href="/called-to-carry/assessment" className={s.ctaPrimary}>
              Take the Free Assessment <ArrowIcon />
            </Link>
            <a href="#pricing" className={s.ctaSecondary}>
              View the Three Paths
            </a>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className={s.faq}>
        <div className={s.sectionInner}>
          <p className={s.sectionLabel}>Questions</p>
          <h2 className={s.sectionHeadline}>Frequently asked</h2>
          <div className={s.faqList}>
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className={s.faqItem}>
                <summary className={s.faqQuestion}>
                  <span>{item.q}</span>
                  <PlusIcon />
                </summary>
                <p className={s.faqAnswer}>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={s.footer}>
        <div className={s.footerInner}>
          <p className={s.footerLogo}>Awakening Destiny Global</p>
          <nav className={s.footerNav}>
            <Link href="/called-to-carry/assessment">Take the Assessment</Link>
            <Link href="/called-to-carry/sprint/apply">Apply — 21-Day Sprint</Link>
            <Link href="/called-to-carry/founders/apply">Apply — Founders Cohort</Link>
            <a href="mailto:will@awakeningdestiny.global">Contact</a>
          </nav>
          <p className={s.footerLegal}>&copy; {new Date().getFullYear()} Awakening Destiny Global. All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.</p>
        </div>
      </footer>
    </div>
  );
}
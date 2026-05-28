// pages/blueprint/index.js
// Called to Carry Blueprint — $997 · 21-day intensive with Will
// Application-gated (same flow as cohort)

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import styles from '../../styles/Blueprint.module.css';

const JOURNEY = [
  {
    week: 'Week 1',
    days: 'Days 1–7',
    title: 'Diagnose',
    color: '#C8A951',
    items: [
      'Introduction + Calling modules',
      'Burden Audit exercise — name what you carry',
      'Live Group Call #1 — prophetic insight + alignment',
    ],
  },
  {
    week: 'Week 2',
    days: 'Days 8–14',
    title: 'Discern',
    color: '#0172BC',
    items: [
      'Connection + Competency + Capacity modules',
      'Private 30-min clarity session with Will',
      'Deep audit of gifts, gaps, and internal limits',
    ],
  },
  {
    week: 'Week 3',
    days: 'Days 15–21',
    title: 'Align',
    color: '#F47722',
    items: [
      'Convergence + Commissioning modules',
      'Live Group Call #2 — integration + sending',
      'Write your Called to Carry Blueprint — your 90-day aligned plan',
    ],
  },
];

const INCLUDED = [
  {
    icon: '✦',
    title: 'All 7 Formation Modules',
    desc: 'Introduction through Commissioning — the complete Called to Carry journey, structured over 21 days.',
  },
  {
    icon: '✦',
    title: '3 Live Group Calls',
    desc: '1.5 hours each. Prophetic insight, strategic coaching, and accountability woven through every session.',
  },
  {
    icon: '✦',
    title: 'Private 30-Min Clarity Session',
    desc: 'One-on-one with Will in Week 2. Spirit-led, strategy-grounded — the prophetic-strategic core of the offer.',
  },
  {
    icon: '✦',
    title: 'Your Called to Carry Blueprint',
    desc: 'A personalized, branded document — your 90-day aligned leadership plan in writing. Built to lead from.',
  },
  {
    icon: '✦',
    title: 'Certificate of Completion',
    desc: 'Commissioned and credentialed. A tangible marker of the formation you completed.',
  },
  {
    icon: '✦',
    title: 'Full Portal Access',
    desc: 'Lifetime access to all 7 modules, diagnostics, and AI training assistant for ongoing reference.',
  },
];

const FAQS = [
  {
    q: "What makes this different from the $497 Cohort?",
    a: "The Blueprint is a 21-day intensive — compressed, focused, and built around your direct access to Will. Three live group calls, a private clarity session, all 7 modules including Commissioning, and a written 90-day plan you walk out with. The Cohort is 8 weeks of group formation. The Blueprint is transformation with Will in the room.",
  },
  {
    q: "How does the application work?",
    a: "Submit your application and Will reviews it personally. If it's a fit, you'll receive a confirmation with payment instructions and your cohort start date. Seats are capped at 10 to protect the depth of the experience.",
  },
  {
    q: "When does the next Blueprint cohort begin?",
    a: "Blueprint cohorts run quarterly. Once your application is confirmed, you'll receive your start date and onboarding details within 3-5 business days.",
  },
  {
    q: "Is the private session guaranteed or optional?",
    a: "Every confirmed Blueprint participant receives one private 30-minute session with Will in Week 2. It is included — not optional.",
  },
  {
    q: "What if I've already completed the Self-Paced Journey?",
    a: "Even better. Your portal progress carries over and your previous Blueprint documents become the foundation of your Week 1 work. You'll go deeper faster.",
  },
];

export default function BlueprintPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <Head>
        <title>Called to Carry Blueprint — 21-Day Intensive</title>
        <meta
          name="description"
          content="21 days. All 7 modules. Three live calls. One private session with Will. Walk out with your Called to Carry Blueprint — a written 90-day plan built to lead from."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={styles.page}>
        {/* ── NAV ── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLogo}>Called to Carry</Link>
          <div className={styles.navLinks}>
            <Link href="/assessment" className={styles.navLink}>Assessment</Link>
            <Link href="/self-paced" className={styles.navLink}>Self-Paced</Link>
            <Link href="/cohort" className={styles.navLink}>Cohort</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroGrain} aria-hidden="true" />
          <div className={styles.heroInner}>
            <p className={styles.heroPretitle}>Called to Carry Blueprint · Limited to 10 Seats</p>
            <h1 className={styles.heroHeadline}>
              21 Days.<br />
              <em>Every Module.</em><br />
              Will in the Room.
            </h1>
            <p className={styles.heroSub}>
              The most intensive Called to Carry experience available. All 7 modules,
              three live group calls, and a private clarity session with Will —
              compressed into 21 days of focused Kingdom formation.
            </p>
            <div className={styles.heroCtas}>
              <Link href="/blueprint/apply" className={styles.btnPrimary}>
                Apply for the Blueprint
              </Link>
              <a href="#journey" className={styles.btnGhost}>
                See the Journey
              </a>
            </div>
            <p className={styles.heroNote}>
              Looking for self-paced?{' '}
              <Link href="/self-paced" className={styles.inlineLink}>
                Start there for $67 →
              </Link>
            </p>
          </div>
        </section>

        {/* ── TENSION ── */}
        <section className={styles.tension}>
          <div className={styles.container}>
            <div className={styles.tensionGrid}>
              <div className={styles.tensionLeft}>
                <h2 className={styles.sectionHeading}>
                  You don't need more content.<br />
                  <em>You need formation.</em>
                </h2>
              </div>
              <div className={styles.tensionRight}>
                <p>
                  Most leaders have consumed enough teaching to last a lifetime.
                  What they lack is the structured space to take what they carry
                  and build something coherent from it.
                </p>
                <p>
                  The Blueprint is not a course. It is a formation experience —
                  21 days of guided, prophetic, strategic work that ends with
                  a written plan you can actually lead from.
                </p>
                <p>
                  Ten seats. One cohort. Will in every session.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── JOURNEY ── */}
        <section className={styles.journey} id="journey">
          <div className={styles.container}>
            <p className={styles.eyebrow}>The 21-Day Structure</p>
            <h2 className={styles.sectionHeading}>
              Three weeks.<br />Three movements.
            </h2>
            <div className={styles.journeyGrid}>
              {JOURNEY.map((phase, i) => (
                <div key={i} className={styles.journeyCard}>
                  <div
                    className={styles.journeyAccent}
                    style={{ background: phase.color }}
                  />
                  <div className={styles.journeyHeader}>
                    <span className={styles.journeyWeek}>{phase.week}</span>
                    <span className={styles.journeyDays}>{phase.days}</span>
                  </div>
                  <h3 className={styles.journeyTitle}>{phase.title}</h3>
                  <ul className={styles.journeyItems}>
                    {phase.items.map((item, j) => (
                      <li key={j} className={styles.journeyItem}>
                        <span className={styles.journeyMark}>→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── QUOTE ── */}
        <section className={styles.quoteBlock}>
          <div className={styles.container}>
            <blockquote className={styles.quote}>
              "The steps of a good man are ordered by the Lord —
              and he delights in his way."
              <cite>Psalm 37:23</cite>
            </blockquote>
          </div>
        </section>

        {/* ── INCLUDED ── */}
        <section className={styles.included}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>What You Receive</p>
            <h2 className={styles.sectionHeading}>
              Everything required<br />for real transformation.
            </h2>
            <div className={styles.includedGrid}>
              {INCLUDED.map((item, i) => (
                <div key={i} className={styles.includedCard}>
                  <span className={styles.includedIcon}>{item.icon}</span>
                  <h3 className={styles.includedTitle}>{item.title}</h3>
                  <p className={styles.includedDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className={styles.pricing} id="pricing">
          <div className={styles.container}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingGrain} aria-hidden="true" />
              <p className={styles.eyebrowLight}>Blueprint Investment</p>
              <h2 className={styles.pricingHeadline}>
                21 Days. One Decision.<br />
                A Plan You Can Lead From.
              </h2>
              <div className={styles.pricingAmount}>
                <span className={styles.pricingCurrency}>$</span>
                <span className={styles.pricingNumber}>997</span>
                <span className={styles.pricingPer}>/ per person</span>
              </div>
              <p className={styles.pricingCaption}>
                Limited to 10 participants per cohort. Payment collected at confirmation.
                Includes all 7 modules, 3 live group calls, private session with Will,
                Blueprint export, Certificate, and lifetime portal access.
              </p>
              <Link href="/blueprint/apply" className={styles.btnPrimaryLarge}>
                Apply Now — Secure Your Seat
              </Link>
              <p className={styles.pricingDisclaimer}>
                Application required. Will reviews every application personally.
              </p>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className={styles.faq}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>Common Questions</p>
            <h2 className={styles.sectionHeading}>Before you apply.</h2>
            <div className={styles.faqList}>
              {FAQS.map((item, i) => (
                <div
                  key={i}
                  className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}
                >
                  <button
                    className={styles.faqQuestion}
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    aria-expanded={openFaq === i}
                  >
                    <span>{item.q}</span>
                    <span className={styles.faqCaret}>{openFaq === i ? '−' : '+'}</span>
                  </button>
                  <div className={styles.faqAnswer}>
                    <p>{item.a}</p>
                  </div>
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
              Ten seats.<br />
              <em>One could be yours.</em>
            </h2>
            <p className={styles.finalSub}>
              The Blueprint runs quarterly. Applications are reviewed personally.
              If this is your season — apply now.
            </p>
            <Link href="/blueprint/apply" className={styles.btnPrimaryLarge}>
              Apply for the Blueprint
            </Link>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <p>© {new Date().getFullYear()} Awakening Destiny Global · All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.</p>
            <div className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <Link href="/assessment">Assessment</Link>
              <Link href="/self-paced">Self-Paced</Link>
              <Link href="/cohort">Cohort</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

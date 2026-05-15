// pages/called-to-carry/founders.js
// Founders Cohort marketing landing page — $997, 8 weeks, application-required.
// Migrated from pages/cohort/index.js with corrected paths.

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import styles from '../../styles/Cohort.module.css';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const INCLUDED_ITEMS = [
  {
    icon: '✦',
    title: 'Live Cohort Sessions',
    desc: '8 live group calls over 8 weeks — deep formation, not surface-level content.',
  },
  {
    icon: '✦',
    title: 'Called to Carry Assessment Results Review',
    desc: 'A personalized debrief of your archetype results with prophetic insight into your assignment.',
  },
  {
    icon: '✦',
    title: 'The 5C Leadership Blueprint Access',
    desc: 'Full portal access to all five modules — Calling, Connection, Competency, Capacity, Convergence.',
  },
  {
    icon: '✦',
    title: 'Covenant Community Access',
    desc: 'Private community of vetted Kingdom leaders building alongside you.',
  },
  {
    icon: '✦',
    title: 'Prophetic Business Coaching',
    desc: 'Spirit-led, strategy-grounded coaching woven into each session. Not theory — activation.',
  },
  {
    icon: '✦',
    title: 'Blueprint Export & Certificate',
    desc: 'A personalized Kingdom Leadership Blueprint document — your formation in writing.',
  },
];

const FOR_WHOM = [
  "Entrepreneurs who know they're called but feel scattered in their assignment",
  'Leaders building Kingdom enterprise with integrity and long-term vision',
  "Prophetic voices ready to connect their gift to sustainable structure",
  'Pastors and ministry leaders transitioning into marketplace influence',
  'Emerging leaders who have the anointing and need the formation',
];

const FAQS = [
  {
    q: 'When does the cohort begin?',
    a: "The next cohort opens enrollment quarterly. Once you apply and are confirmed, you'll receive your start date and onboarding materials.",
  },
  {
    q: 'Is this only for experienced leaders?',
    a: 'No. This is for any Kingdom leader at any stage who senses a burden they were built to carry. Emerging and executive leaders both find formation here.',
  },
  {
    q: "What's the time commitment?",
    a: 'Plan for 2–3 hours per week — one live session and independent portal work. The depth is real; the pace is sustainable.',
  },
  {
    q: "What if I've already completed the Called to Carry Assessment?",
    a: 'Even better. Your assessment results become the foundation of your personalized debrief in week one.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Because cohort seats are limited and confirmed in advance, all purchases are final. We encourage you to complete the assessment and read this page carefully before applying.',
  },
];

export default function FoundersPage({ cohortOpen }) {
  const [openFaq, setOpenFaq] = useState(null);

  // Waitlist state
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistFirstName, setWaitlistFirstName] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle'); // idle | loading | success | error
  const [waitlistError, setWaitlistError] = useState('');

  const handleWaitlist = async (e) => {
    e.preventDefault();
    setWaitlistStatus('loading');
    setWaitlistError('');

    try {
      const { error } = await supabase.from('cohort_waitlist').upsert(
        { email: waitlistEmail, first_name: waitlistFirstName || null },
        { onConflict: 'email' }
      );
      if (error) throw new Error(error.message);
      setWaitlistStatus('success');
    } catch (err) {
      setWaitlistStatus('error');
      setWaitlistError(err.message);
    }
  };

  return (
    <>
      <Head>
        <title>Founders Cohort — Called to Carry</title>
        <meta
          name="description"
          content="8 weeks of live formation, prophetic business coaching, and Kingdom leadership development for leaders built to carry more."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className={styles.page}>
        {/* ── NAV ── */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.navLogo}>
            <span className={styles.navLogoText}>Called to Carry</span>
          </Link>
          <Link href="/called-to-carry/assessment" className={styles.navLink}>
            Take the Assessment
          </Link>
        </nav>

        {/* ── HERO ── */}
        <section className={styles.hero}>
          <div className={styles.heroGrain} aria-hidden="true" />
          <div className={styles.heroInner}>
            {!cohortOpen && (
              <div className={styles.closedBadge}>
                ✦ Cohort Currently Full — Join the Waitlist Below
              </div>
            )}
            <p className={styles.heroPretitle}>
              Founders Cohort · {cohortOpen ? 'Limited Enrollment' : 'Next Cohort Coming Soon'}
            </p>
            <h1 className={styles.heroHeadline}>
              You Were Not Built to<br />
              <em>Carry This Alone.</em>
            </h1>
            <p className={styles.heroSub}>
              Eight weeks of live formation, prophetic insight, and strategic coaching
              for Kingdom leaders who know their assignment — and are ready to build it.
            </p>
            {cohortOpen ? (
              <div className={styles.heroCtas}>
                <Link href="/called-to-carry/founders/apply" className={styles.btnPrimary}>
                  Apply for the Cohort
                </Link>
                <a href="#what-is-this" className={styles.btnGhost}>
                  Learn More
                </a>
              </div>
            ) : (
              <div className={styles.heroCtas}>
                <a href="#waitlist" className={styles.btnPrimary}>
                  Join the Waitlist
                </a>
                <Link href="/self-paced" className={styles.btnGhost}>
                  Start Self-Paced — $97
                </Link>
              </div>
            )}
            <p className={styles.heroNote}>
              Not sure if you're ready?{' '}
              <Link href="/called-to-carry/assessment" className={styles.inlineLink}>
                Take the Called to Carry Assessment first →
              </Link>
            </p>
          </div>
          <div className={styles.heroScroll} aria-hidden="true">
            <span />
          </div>
        </section>

        {/* ── TENSION STATEMENT ── */}
        <section className={styles.tension} id="what-is-this">
          <div className={styles.container}>
            <div className={styles.tensionGrid}>
              <div className={styles.tensionLeft}>
                <h2 className={styles.sectionHeading}>
                  The burden is real.<br />
                  The isolation is optional.
                </h2>
              </div>
              <div className={styles.tensionRight}>
                <p>
                  There's a weight you carry. You feel it when you pray. You sense it when you
                  plan. It shows up in your business, your vision, your sleepless nights.
                </p>
                <p>
                  That weight is not a problem to fix — it's an assignment to steward.
                </p>
                <p>
                  The Founders Cohort is built for Kingdom leaders who are ready to stop
                  managing their calling in isolation and start building it with clarity, covenant
                  community, and the kind of formation that actually changes you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── WHO IT'S FOR ── */}
        <section className={styles.forWhom}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>This Is For You If</p>
            <h2 className={styles.sectionHeading}>You recognize yourself in this.</h2>
            <ul className={styles.forList}>
              {FOR_WHOM.map((item, i) => (
                <li key={i} className={styles.forItem}>
                  <span className={styles.forMark}>✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── DIVIDER QUOTE ── */}
        <section className={styles.quoteBlock}>
          <div className={styles.container}>
            <blockquote className={styles.quote}>
              "The steps of a good man are ordered by the Lord —
              and he delights in his way."
              <cite>Psalm 37:23</cite>
            </blockquote>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED ── */}
        <section className={styles.included}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>What You Receive</p>
            <h2 className={styles.sectionHeading}>
              Formation built for<br />Kingdom leaders.
            </h2>
            <div className={styles.includedGrid}>
              {INCLUDED_ITEMS.map((item, i) => (
                <div key={i} className={styles.includedCard}>
                  <span className={styles.includedIcon}>{item.icon}</span>
                  <h3 className={styles.includedTitle}>{item.title}</h3>
                  <p className={styles.includedDesc}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING / WAITLIST ── */}
        <section className={styles.pricing} id={cohortOpen ? 'pricing' : 'waitlist'}>
          <div className={styles.container}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingGrain} aria-hidden="true" />

              {cohortOpen ? (
                <>
                  <p className={styles.eyebrowLight}>Founders Cohort Investment</p>
                  <h2 className={styles.pricingHeadline}>
                    One Decision.<br />Eight Weeks of Transformation.
                  </h2>
                  <div className={styles.pricingAmount}>
                    <span className={styles.pricingCurrency}>$</span>
                    <span className={styles.pricingNumber}>497</span>
                    <span className={styles.pricingPer}>/ cohort</span>
                  </div>
                  <p className={styles.pricingCaption}>
                    One-time investment. Full 8-week cohort. All inclusions listed above.
                    Limited seats per cohort to protect depth of community.
                  </p>
                  <div className={styles.pricingActions}>
                    <Link href="/called-to-carry/founders/apply" className={styles.btnPrimaryLarge}>
                      Apply Now — Secure Your Seat
                    </Link>
                  </div>
                  <p className={styles.pricingDisclaimer}>
                    Seats are confirmed upon application review. Payment is collected at confirmation.
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.eyebrowLight}>Founders Cohort</p>
                  <h2 className={styles.pricingHeadline}>
                    This Cohort Is Full.<br />The Next One Is Coming.
                  </h2>
                  <p className={styles.pricingCaption}>
                    Join the waitlist and be the first to know when enrollment opens.
                    Waitlist members get early access and first right of refusal on seats.
                  </p>

                  {waitlistStatus === 'success' ? (
                    <div className={styles.waitlistSuccess}>
                      <p>✦ You're on the list. We'll be in touch when the next cohort opens.</p>
                      <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                        In the meantime —{' '}
                        <Link href="/self-paced" className={styles.pricingLink}>
                          start the Self-Paced Journey for $97 →
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlist} className={styles.waitlistForm}>
                      <input
                        type="text"
                        placeholder="First name"
                        value={waitlistFirstName}
                        onChange={e => setWaitlistFirstName(e.target.value)}
                        className={styles.waitlistInput}
                      />
                      <input
                        type="email"
                        required
                        placeholder="Your email address"
                        value={waitlistEmail}
                        onChange={e => setWaitlistEmail(e.target.value)}
                        className={styles.waitlistInput}
                      />
                      {waitlistError && (
                        <p className={styles.waitlistError}>{waitlistError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={waitlistStatus === 'loading'}
                        className={styles.btnPrimaryLarge}
                      >
                        {waitlistStatus === 'loading' ? 'Joining...' : 'Join the Waitlist'}
                      </button>
                    </form>
                  )}

                  <p className={styles.pricingDisclaimer}>
                    Want formation now?{' '}
                    <Link href="/self-paced" className={styles.pricingLink}>
                      Start the Self-Paced Journey for $97 →
                    </Link>
                  </p>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ── LEADER BIO ── */}
        <section className={styles.leader}>
          <div className={styles.container}>
            <div className={styles.leaderGrid}>
              <div className={styles.leaderImg}>
                <div className={styles.leaderImgPlaceholder} aria-label="Leader photo">
                  <span>ADG</span>
                </div>
              </div>
              <div className={styles.leaderContent}>
                <p className={styles.eyebrow}>Your Guide</p>
                <h2 className={styles.leaderName}>Will —<br />Prophet, Coach, Kingdom Builder</h2>
                <p>
                  Will serves as the founder of Awakening Destiny Global and leads from an
                  apostolic-prophetic assignment with a demonstrated track record in ministry,
                  business consulting, and Kingdom leadership formation.
                </p>
                <p>
                  His approach is not motivational — it's covenantal. He brings together
                  systematic strategy, Spirit-led insight, and decades of real-world experience
                  equipping leaders to discover, develop, and deploy their God-given assignment.
                </p>
                <p>
                  The Founders Cohort is an extension of that assignment. Every session
                  carries the weight of a ministry built to restore, unify, and release.
                </p>
              </div>
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
            {cohortOpen ? (
              <>
                <h2 className={styles.finalHeadline}>
                  The burden you carry<br />
                  <em>was given to you on purpose.</em>
                </h2>
                <p className={styles.finalSub}>
                  Don't let another season pass in isolation. The cohort is designed for
                  leaders who are ready — not perfect, not finished, but willing.
                </p>
                <Link href="/called-to-carry/founders/apply" className={styles.btnPrimaryLarge}>
                  Apply for the Founders Cohort
                </Link>
              </>
            ) : (
              <>
                <h2 className={styles.finalHeadline}>
                  Formation doesn't wait<br />
                  <em>for the next cohort.</em>
                </h2>
                <p className={styles.finalSub}>
                  The Self-Paced Journey is available now. Six modules, three months,
                  your schedule. Start building clarity today.
                </p>
                <Link href="/self-paced" className={styles.btnPrimaryLarge}>
                  Start the Self-Paced Journey — $97
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <p>© {new Date().getFullYear()} Awakening Destiny Global · All Rights Reserved</p>
            <div className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <Link href="/called-to-carry/assessment">Assessment</Link>
              <Link href="/called-to-carry/founders/apply">Apply</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

// ── SERVER SIDE PROPS — reads COHORT_OPEN env var ──────────────────────────
export async function getServerSideProps() {
  const cohortOpen = process.env.COHORT_OPEN !== 'false';
  return { props: { cohortOpen } };
}
// pages/called-to-carry/sprint.js
// 21-Day Sprint marketing landing page — $497, application-only, direct with Will.

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
    title: '21 Days of Direct Access to Will',
    desc: 'Daily rhythm, direct input, and personal apostolic counsel — not recorded sessions, not a group call. You, Will, and your assignment.',
  },
  {
    icon: '✦',
    title: 'Called to Carry Archetype Integration',
    desc: 'Your archetype results applied directly to your current decisions, relationships, and next steps.',
  },
  {
    icon: '✦',
    title: 'The 5C Leadership Blueprint Access',
    desc: 'Full portal access to all five modules — Calling, Connection, Competency, Capacity, Convergence.',
  },
  {
    icon: '✦',
    title: 'Accelerated Formation Rhythm',
    desc: '21 days designed to move you through a threshold — not someday, not next quarter. Now.',
  },
  {
    icon: '✦',
    title: 'Prophetic Strategic Counsel',
    desc: 'Spirit-led, strategy-grounded input on your specific assignment. Every session is built around you.',
  },
  {
    icon: '✦',
    title: 'Blueprint Export & Certificate',
    desc: 'A personalized Kingdom Leadership Blueprint — your formation, your assignment, in writing.',
  },
];

const FOR_WHOM = [
  'You are at a threshold and you know it — this is not the season for a group experience',
  'You need direct apostolic input on a specific decision, transition, or assignment',
  'You have been building alone and it is costing you more than you can afford to pay',
  'You carry weight that requires more than content — it requires counsel',
  'You are a leader who is ready to move and needs someone who can see what you carry',
];

const FAQS = [
  {
    q: 'What does 21 days of direct access look like?',
    a: 'You and Will work together over 21 days through a combination of live sessions, direct communication, and structured formation work. The rhythm is built around your assignment, your pace, and what you are carrying.',
  },
  {
    q: 'How is this different from the Founders Cohort?',
    a: 'The Founders Cohort is a group experience — covenant community, shared formation, 8 weeks. The Sprint is one-on-one. Direct access to Will, accelerated rhythm, and counsel built around your specific assignment.',
  },
  {
    q: 'Is this only for experienced leaders?',
    a: 'No. It is for leaders who are at a threshold — regardless of stage. What matters is that you are ready to move.',
  },
  {
    q: 'What is the application process?',
    a: 'You submit an application and Will reviews it personally. If it is the right fit and the right season, you will receive a payment link to complete your enrollment.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Because this is a limited, high-touch engagement, all purchases are final. We encourage you to read this page carefully and complete the Called to Carry Assessment before applying.',
  },
];

export default function SprintPage({ sprintOpen }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistFirstName, setWaitlistFirstName] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState('idle');
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
        <title>21-Day Sprint — Called to Carry</title>
        <meta name="description" content="21 days of direct access to Will. Apostolic counsel, accelerated formation, and strategic coaching built around your specific assignment." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
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
            {!sprintOpen && (
              <div className={styles.closedBadge}>
                ✦ Sprint Currently Full — Join the Waitlist Below
              </div>
            )}
            <p className={styles.heroPretitle}>
              21-Day Sprint · {sprintOpen ? 'Application Required' : 'Next Sprint Coming Soon'}
            </p>
            <h1 className={styles.heroHeadline}>
              Some Assignments<br />
              <em>Require Direct Counsel.</em>
            </h1>
            <p className={styles.heroSub}>
              21 days of direct access to Will — apostolic counsel, accelerated formation, and strategic coaching built around your specific assignment. Not a group. Not a course. You and Will.
            </p>
            {sprintOpen ? (
              <div className={styles.heroCtas}>
                <Link href="/called-to-carry/sprint/apply" className={styles.btnPrimary}>
                  Apply for the Sprint
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
                <Link href="/called-to-carry/founders" className={styles.btnGhost}>
                  See the Founders Cohort
                </Link>
              </div>
            )}
            <p className={styles.heroNote}>
              Not sure which path is right?{' '}
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
                  Some weights<br />
                  require a witness.
                </h2>
              </div>
              <div className={styles.tensionRight}>
                <p>
                  There are seasons when content is not enough. When a group experience, however good, does not reach what you are actually carrying.
                </p>
                <p>
                  The 21-Day Sprint is built for those moments. Direct access. Personal counsel. A formation rhythm that moves with your assignment, not around it.
                </p>
                <p>
                  This is not coaching in the conventional sense. It is apostolic accompaniment — 21 days of walking alongside someone who can see what you carry and help you carry it with greater precision, courage, and clarity.
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
              "Iron sharpens iron, and one man sharpens another."
              <cite>Proverbs 27:17</cite>
            </blockquote>
          </div>
        </section>

        {/* ── WHAT'S INCLUDED ── */}
        <section className={styles.included}>
          <div className={styles.container}>
            <p className={styles.eyebrow}>What You Receive</p>
            <h2 className={styles.sectionHeading}>
              21 days built<br />around your assignment.
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
        <section className={styles.pricing} id={sprintOpen ? 'pricing' : 'waitlist'}>
          <div className={styles.container}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingGrain} aria-hidden="true" />

              {sprintOpen ? (
                <>
                  <p className={styles.eyebrowLight}>21-Day Sprint Investment</p>
                  <h2 className={styles.pricingHeadline}>
                    21 Days.<br />One Assignment. Direct Access.
                  </h2>
                  <div className={styles.pricingAmount}>
                    <span className={styles.pricingCurrency}>$</span>
                    <span className={styles.pricingNumber}>997</span>
                    <span className={styles.pricingPer}>/ sprint</span>
                  </div>
                  <p className={styles.pricingCaption}>
                    Application required. Will reviews personally. Payment collected at confirmation. Limited capacity per sprint.
                  </p>
                  <div className={styles.pricingActions}>
                    <Link href="/called-to-carry/sprint/apply" className={styles.btnPrimaryLarge}>
                      Apply Now
                    </Link>
                  </div>
                  <p className={styles.pricingDisclaimer}>
                    Applications reviewed within 48 hours. This is not open enrollment — Will confirms each seat personally.
                  </p>
                </>
              ) : (
                <>
                  <p className={styles.eyebrowLight}>21-Day Sprint</p>
                  <h2 className={styles.pricingHeadline}>
                    This Sprint Is Full.<br />The Next One Is Coming.
                  </h2>
                  <p className={styles.pricingCaption}>
                    Join the waitlist and be first to know when the next Sprint opens.
                  </p>
                  {waitlistStatus === 'success' ? (
                    <div className={styles.waitlistSuccess}>
                      <p>✦ You are on the list. We will be in touch when the next Sprint opens.</p>
                      <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                        In the meantime —{' '}
                        <Link href="/called-to-carry/founders" className={styles.pricingLink}>
                          explore the Founders Cohort →
                        </Link>
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleWaitlist} className={styles.waitlistForm}>
                      <input type="text" placeholder="First name" value={waitlistFirstName}
                        onChange={e => setWaitlistFirstName(e.target.value)} className={styles.waitlistInput} />
                      <input type="email" required placeholder="Your email address" value={waitlistEmail}
                        onChange={e => setWaitlistEmail(e.target.value)} className={styles.waitlistInput} />
                      {waitlistError && <p className={styles.waitlistError}>{waitlistError}</p>}
                      <button type="submit" disabled={waitlistStatus === 'loading'} className={styles.btnPrimaryLarge}>
                        {waitlistStatus === 'loading' ? 'Joining...' : 'Join the Waitlist'}
                      </button>
                    </form>
                  )}
                  <p className={styles.pricingDisclaimer}>
                    Want formation now?{' '}
                    <Link href="/called-to-carry/founders" className={styles.pricingLink}>
                      See the Founders Cohort →
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
                  Will serves as the founder of Awakening Destiny Global and leads from an apostolic-prophetic assignment with a demonstrated track record in ministry, business consulting, and Kingdom leadership formation.
                </p>
                <p>
                  His approach is not motivational — it is covenantal. He brings together systematic strategy, Spirit-led insight, and decades of real-world experience equipping leaders to discover, develop, and deploy their God-given assignment.
                </p>
                <p>
                  The 21-Day Sprint gives you direct access to that assignment working on yours.
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
                <div key={i} className={`${styles.faqItem} ${openFaq === i ? styles.faqOpen : ''}`}>
                  <button className={styles.faqQuestion} onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i}>
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
            {sprintOpen ? (
              <>
                <h2 className={styles.finalHeadline}>
                  The threshold you are standing at<br />
                  <em>is not a coincidence.</em>
                </h2>
                <p className={styles.finalSub}>
                  You did not find this page by accident. Apply. Will will review it personally. If this is the right season, you will hear back within 48 hours.
                </p>
                <Link href="/called-to-carry/sprint/apply" className={styles.btnPrimaryLarge}>
                  Apply for the 21-Day Sprint
                </Link>
              </>
            ) : (
              <>
                <h2 className={styles.finalHeadline}>
                  Formation does not wait<br />
                  <em>for the right moment.</em>
                </h2>
                <p className={styles.finalSub}>
                  Join the waitlist or explore the Founders Cohort — an 8-week group formation experience for Kingdom leaders.
                </p>
                <Link href="/called-to-carry/founders" className={styles.btnPrimaryLarge}>
                  Explore the Founders Cohort
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className={styles.footer}>
          <div className={styles.container}>
            <p>© {new Date().getFullYear()} Awakening Destiny Global · All Rights Reserved</p>
            <p style={{ fontSize: '0.72rem', opacity: 0.6, marginTop: 6, lineHeight: 1.6 }}>All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.</p>
            <div className={styles.footerLinks}>
              <Link href="/">Home</Link>
              <Link href="/called-to-carry/assessment">Assessment</Link>
              <Link href="/called-to-carry/sprint/apply">Apply</Link>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}

export async function getServerSideProps() {
  const sprintOpen = process.env.SPRINT_OPEN !== 'false';
  return { props: { sprintOpen } };
}
// pages/assessment.js
import { useState, useEffect } from 'react';
import Head from 'next/head';
import { supabase } from '../lib/supabase';
import { colors as t, fonts } from '../styles/tokens';
import { useRouter } from 'next/router';

// ════════════════════════════════════════
// BRAND COLORS (mapped from shared tokens)
// ════════════════════════════════════════
const colors = {
  navy: t.navy,
  navyLight: t.navyLight,
  gold: t.gold,
  goldDim: t.goldDim,
  goldLine: t.goldLine,
  blue: t.royalBlue,
  orange: t.orange,
  red: t.red,
  cream: t.cream,
  gray: t.creamTranslucent,
  green: '#4ade80',
};

// ════════════════════════════════════════
// 25 QUESTIONS — 5 DIMENSIONS
// ════════════════════════════════════════
const DIMENSIONS = [
  {
    id: 'calling',
    name: 'Calling',
    sub: 'Identity & Assignment',
    num: '01',
    color: colors.gold,
    questions: [
      'I have a clear understanding of my purpose and Kingdom assignment.',
      'I can articulate what I am called to build, lead, or influence in this season.',
      'I operate with genuine confidence in my identity as a leader — not performance, but settled assurance.',
      'I am not easily pulled by opportunities, voices, or pressure that fall outside my assignment.',
      'My daily decisions consistently align with a clear and defined sense of purpose.',
    ],
  },
  {
    id: 'connection',
    name: 'Connection',
    sub: 'Relationships & Identity Security',
    num: '02',
    color: colors.blue,
    questions: [
      'I am connected to the right people for my current season — relationally and strategically.',
      'I invest intentionally in meaningful, covenant relationships rather than surface-level networks.',
      'I am accountable to trusted voices who sharpen, challenge, and guide my leadership with authority.',
      'My sense of identity as a leader does not depend on the validation, approval, or recognition of others.',
      'I can remain relationally present with others without feeling threatened, competitive, or insecure in my own assignment.',
    ],
  },
  {
    id: 'competency',
    name: 'Competency',
    sub: 'Skill & Execution',
    num: '03',
    color: colors.orange,
    questions: [
      'I have the skills and knowledge required to execute my current responsibilities with excellence.',
      'I am consistently growing — actively developing the competencies my assignment demands.',
      'I handle challenges, pressure, and complex decisions with wisdom and strategic effectiveness.',
      'I follow through. I finish what I start and execute at a level that reflects the weight of my calling.',
      'Others who I lead and observe my work recognize and affirm my competence in my field.',
    ],
  },
  {
    id: 'capacity',
    name: 'Capacity',
    sub: 'Strength & Sustainability',
    num: '04',
    color: '#00AEEF',
    questions: [
      'I can navigate pressure and high-demand seasons without becoming overwhelmed or shutting down.',
      'I have genuine margin in my life — adequate time, energy, and focus to respond to what God is doing.',
      'I recover from setbacks, disappointment, and criticism without prolonged shutdown or loss of momentum.',
      'I am not operating in burnout, chronic fatigue, or depletion masked as productivity.',
      'I have the internal and structural capacity to sustain growth — not just sprint through a season, but build over time.',
    ],
  },
  {
    id: 'convergence',
    name: 'Convergence',
    sub: 'Alignment & Flow',
    num: '05',
    color: colors.red,
    questions: [
      'My life and leadership feel integrated — my calling, relationships, skills, and season are aligned.',
      'I am seeing tangible, sustainable fruit from my efforts — not just activity, but measurable Kingdom impact.',
      'Opportunities are aligning with my calling — the right doors, the right people, the right timing.',
      'I am experiencing forward momentum — not striving or forcing, but moving with God\'s current.',
      'I am stepping into greater levels of influence — my leadership is expanding beyond where it was 12 months ago.',
    ],
  },
];

// ════════════════════════════════════════
// SCORING HELPERS
// ════════════════════════════════════════
function getDimStatus(score) {
  if (score >= 20) return { label: 'Strong', color: '#4ade80' };
  if (score >= 14) return { label: 'Developing', color: colors.gold };
  return { label: 'Misaligned', color: colors.orange };
}

function getOverallStatus(total) {
  if (total >= 100) return 'Blueprint Ready — Deploy Now';
  if (total >= 70) return 'Blueprint Positioned — Build the Gaps';
  return 'Blueprint Essential — This Is Your Foundation';
}

function getNextStep(gapId) {
  const steps = {
    calling: 'Your first work is clarity — not strategy. Before you can build with authority, you need to know precisely what you were built to build. The Calling module will give you the language, the framework, and the prophetic anchoring to name your assignment with confidence.',
    connection: 'The relational architecture around your leadership needs attention. Whether you\'re isolated at the top, carrying misaligned relationships, or leading from a place of approval-seeking — the Connection module will help you build the covenant community your assignment demands.',
    competency: 'Your gift is real, but your execution needs sharpening. The Competency module will help you align your skills directly to your assignment — closing the gap between your anointing and the excellence required to sustain it.',
    capacity: 'You may be running on empty while calling it faithfulness. The Capacity module confronts the rhythms, margins, and structural realities that either hold your next level or hand it off to someone who prepared better.',
    convergence: 'You\'re close — but not yet fully aligned. The Convergence module helps you identify where momentum is leaking and how to move from scattered activity into focused, integrated Kingdom impact.',
  };
  return steps[gapId] || '';
}

// ════════════════════════════════════════
// MOBILE HOOK
// ════════════════════════════════════════
function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export default function Assessment() {
  const isMobile = useIsMobile();
  const router = useRouter();
  
useEffect(() => {
  async function checkAccess() {
    // Step 1 — check for Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      router.push('/called-to-carry/assessment');
      return;
    }

    // Step 2 — check for completed payment using email
    const email = session.user.email;
    const { data: payment, error } = await supabase
      .from('payments')
      .select('id')
      .eq('email', email)
      .eq('status', 'completed')
      .limit(1)
      .single();

    if (error || !payment) {
      // Logged in but no completed payment — send to qualifier
      router.push('/called-to-carry/assessment');
      return;
    }

    // Step 3 — paid user confirmed, allow access
  }
  checkAccess();
}, []);

  const [screen, setScreen] = useState('intro'); // intro | assessment | gate | results
  const [answers, setAnswers] = useState({});
  const [userData, setUserData] = useState({ firstName: '', lastName: '', email: '' });
  const [results, setResults] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [gateError, setGateError] = useState('');
  const [resultSaved, setResultSaved] = useState(false);

  // ─── EMAIL CONSENT (CHANGE 1 of 3) ───
  const [emailConsent, setEmailConsent] = useState(false);

  const totalQuestions = 25;
  const answeredCount = Object.keys(answers).length;
  const progressPct = Math.round((answeredCount / totalQuestions) * 100);
  const allAnswered = answeredCount === totalQuestions;

  // ─── SCROLL TO TOP ON SCREEN CHANGE ───
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [screen]);

  // ─── HANDLE RATING ───
  function selectRating(key, val) {
  setAnswers(prev => ({ ...prev, [key]: val }));
  }

  // ─── CALCULATE SCORES ───
  function calculateScores() {
    const scores = {};
    DIMENSIONS.forEach(dim => {
      let total = 0;
      dim.questions.forEach((_, qi) => {
        total += answers[`${dim.id}-${qi}`] === 'N/A' ? 0 : (answers[`${dim.id}-${qi}`] || 0);
      });
      scores[dim.id] = total;
    });
    return scores;
  }

  // ─── REVEAL RESULTS ───
  async function revealResults() {
    const { firstName, email } = userData;
    if (!firstName.trim() || !email.trim()) {
      setGateError('Please enter your first name and email to continue.');
      return;
    }
    if (!email.includes('@')) {
      setGateError('Please enter a valid email address.');
      return;
    }
    setGateError('');
    setSending(true);

    const scores = calculateScores();
    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    let strongest = null, gap = null;
    let highScore = -1, lowScore = 999;
    DIMENSIONS.forEach(dim => {
      if (scores[dim.id] > highScore) { highScore = scores[dim.id]; strongest = dim; }
      if (scores[dim.id] < lowScore) { lowScore = scores[dim.id]; gap = dim; }
    });

    setResults({ scores, totalScore, strongest, gap });

    // ─── SAVE TO DATABASE (CHANGE 2 of 3) ───
    // email_consent and consent_timestamp record the user's agreement
    // at the intro screen for GDPR audit trail purposes.
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await supabase.from('assessments').insert({
          user_id: session.user.id,
          answers: answers,
          dimension_scores: scores,
          total_score: totalScore,
          max_possible: 125,
          email_consent: true,
          consent_timestamp: new Date().toISOString(),
        });
        setResultSaved(true);
      }
    } catch (err) {
      console.error('Failed to save assessment:', err);
      // Non-fatal — user still sees results
    }

    // ─── SEND EMAIL VIA API ENDPOINT ───
    try {
      await fetch('/api/send-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          scores,
          totalScore,
          strongest: { id: strongest.id, name: strongest.name, sub: strongest.sub },
          gap: { id: gap.id, name: gap.name, sub: gap.sub },
        }),
      });
      setEmailSent(true);
    } catch (err) {
      console.error('Email send failed:', err);
      // Results still display even if email fails
    }

    setSending(false);
    setScreen('results');
  }

  // ════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════
  return (
    <>
      <Head>
        <title>Leadership Diagnostic | 5C Leadership Blueprint</title>
        <meta name="description" content="Take the 25-question diagnostic assessment to identify your leadership strengths and growth edges across all five dimensions." />
        <meta property="og:title" content="Leadership Diagnostic | 5C Leadership Blueprint" />
        <meta property="og:description" content="Take the 25-question diagnostic assessment to identify your leadership strengths and growth edges across all five dimensions." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://5cblueprint.awakeningdestiny.global/assessment" />
        <meta property="og:site_name" content="5C Leadership Blueprint" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Leadership Diagnostic | 5C Leadership Blueprint" />
        <meta name="twitter:description" content="Take the 25-question diagnostic assessment to identify your leadership strengths and growth edges across all five dimensions." />
      </Head>

      <div style={{ minHeight: '100vh', background: colors.navy, color: colors.cream, fontFamily: fonts.body, overflowX: 'hidden' }}>

        {/* ─── NAV ─── */}
        <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(2,26,53,0.95)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${colors.goldLine}` }}>
          <a href="/" style={{ fontFamily: fonts.heading, fontSize: '1.1rem', fontWeight: 600, color: colors.cream, textDecoration: 'none' }}>
            5C <span style={{ color: colors.gold }}>Blueprint</span>
          </a>
          <a href="/" style={{ fontSize: '0.78rem', color: colors.gray, textDecoration: 'none', letterSpacing: '0.08em' }}>← Back to Site</a>
        </nav>

        {/* ─── MAIN CONTENT ─── */}
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '7rem 2rem 4rem' }}>

          {/* ══════════════════════════════
              SCREEN: INTRO
          ══════════════════════════════ */}
          {screen === 'intro' && (
            <div>
              <div style={badgeStyle}>5C Leadership Assessment</div>
              <h1 style={{ fontFamily: fonts.heading, fontSize: 'clamp(2.4rem, 6vw, 4rem)', fontWeight: 700, lineHeight: 1.05, marginBottom: '1.25rem' }}>
                Discover Where You Stand<br />
                <em style={{ color: colors.gold }}>and Where You&apos;re Built to Go</em>
              </h1>
              <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: colors.gray, marginBottom: '2rem', maxWidth: 580 }}>
                This assessment measures your current alignment across the five dimensions of Kingdom leadership. Be honest — not with who you aspire to be, but with who you are right now. The result is a personalized profile that reveals your strongest dimension, your greatest gap, and your most strategic next step.
              </p>

              {/* Meta */}
              <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                {['25 Questions', '5 Dimensions', '8–10 Minutes', 'Personalized Results'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: colors.gray }}>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: colors.gold, flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>

              {/* Dimensions Preview */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
                {DIMENSIONS.map(dim => (
                  <div key={dim.id} style={{ padding: '0.75rem 0.5rem', textAlign: 'center', background: colors.goldDim, border: `1px solid ${colors.goldLine}` }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: '1.4rem', fontWeight: 700, color: colors.cream, marginBottom: '0.25rem' }}>{dim.num}</div>
                    <div style={{ fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: colors.gold, fontWeight: 600 }}>{dim.name}</div>
                  </div>
                ))}
              </div>

              {/* Scale Guide */}
              <div style={{ padding: '1.25rem 1.5rem', border: `1px solid rgba(253,210,13,0.2)`, marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '0.82rem', color: colors.gray, marginBottom: '0.75rem', letterSpacing: '0.05em' }}>Rate each statement on a scale of 1 to 5:</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {[['1','Strongly Disagree'],['2','Disagree'],['3','Neutral'],['4','Agree'],['5','Strongly Agree']].map(([num, label]) => (
                    <div key={num} style={{ textAlign: 'center', fontSize: '0.75rem', color: colors.cream }}>
                      <span style={{ display: 'block', fontFamily: fonts.heading, fontSize: '1.4rem', fontWeight: 700, color: colors.gold }}>{num}</span>
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              {/* ─── EMAIL CONSENT (CHANGE 3 of 3) ─── */}
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                padding: '1.25rem',
                background: 'rgba(253,210,13,0.04)',
                border: '1px solid rgba(253,210,13,0.2)',
              }}>
                <input
                  id="emailConsent"
                  type="checkbox"
                  checked={emailConsent}
                  onChange={e => setEmailConsent(e.target.checked)}
                  style={{
                    marginTop: '3px',
                    accentColor: '#FDD20D',
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                />
                <label htmlFor="emailConsent" style={{
                  fontSize: '0.82rem',
                  lineHeight: 1.6,
                  color: 'rgba(253,248,240,0.65)',
                  cursor: 'pointer',
                }}>
                  By taking this assessment, I agree to receive emails from Awakening Destiny Global — including insights, training updates, and resources to support my Kingdom assignment. You may unsubscribe at any time.
                </label>
              </div>

              <button
                onClick={() => setScreen('assessment')}
                disabled={!emailConsent}
                style={{
                  ...btnPrimary,
                  opacity: emailConsent ? 1 : 0.45,
                  cursor: emailConsent ? 'pointer' : 'not-allowed',
                }}
              >
                Begin Assessment
              </button>
            </div>
          )}

          {/* ══════════════════════════════
              SCREEN: ASSESSMENT
          ══════════════════════════════ */}
          {screen === 'assessment' && (
            <div>
              {/* Progress Bar */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                  <span style={{ fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.gray }}>Assessment Progress</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: colors.gold }}>{progressPct}%</span>
                </div>
                <div style={{ height: 3, background: 'rgba(253,210,13,0.15)', width: '100%' }}>
                  <div style={{ height: '100%', background: colors.gold, width: `${progressPct}%`, transition: 'width 300ms ease' }} />
                </div>
              </div>

              {/* Questions */}
              {DIMENSIONS.map((dim, di) => (
                <div key={dim.id} style={{ marginBottom: '3rem' }}>
                  {/* Dimension Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: `1px solid ${colors.goldLine}` }}>
                    <div style={{ fontFamily: fonts.heading, fontSize: '3rem', fontWeight: 700, color: colors.gold, lineHeight: 1, opacity: 0.8 }}>{dim.num}</div>
                    <div>
                      <div style={{ fontFamily: fonts.heading, fontSize: '1.8rem', fontWeight: 600, color: colors.cream, lineHeight: 1 }}>{dim.name}</div>
                      <div style={{ fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: colors.gold, fontWeight: 600, marginTop: '0.2rem' }}>{dim.sub}</div>
                    </div>
                  </div>

                  {/* Question Cards */}
                  {dim.questions.map((q, qi) => {
                    const key = `${dim.id}-${qi}`;
                    const qNum = di * 5 + qi + 1;
                    const selected = answers[key];
                    return (
                      <div key={key} style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'rgba(253,210,13,0.04)', border: `1px solid ${selected ? 'rgba(253,210,13,0.3)' : 'rgba(253,210,13,0.12)'}`, transition: 'border-color 300ms ease' }}>
                        <span style={{ fontSize: '0.68rem', color: colors.gold, letterSpacing: '0.15em', textTransform: 'uppercase', fontWeight: 700, display: 'block', marginBottom: '0.5rem' }}>
                          Question {qNum} of 25
                        </span>
                        <div style={{ fontSize: '1rem', lineHeight: 1.7, color: colors.cream, marginBottom: '1.25rem' }}>{q}</div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {[1,2,3,4,5,'N/A'].map(n => (
                            <button
                              key={n}
                              onClick={() => selectRating(key, n)}
                              style={{
                                flex: 1, padding: isMobile ? '10px 14px' : '10px 12px', textAlign: 'center',
                                minWidth: 44, minHeight: 44,
                                background: selected === n ? colors.gold : 'transparent',
                                border: `1px solid ${selected === n ? colors.gold : 'rgba(253,210,13,0.2)'}`,
                                color: selected === n ? colors.navy : colors.gray,
                                fontFamily: fonts.heading, fontSize: '1.2rem', fontWeight: 700,
                                cursor: 'pointer', transition: 'all 150ms ease',
                              }}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                          <span style={{ fontSize: '0.65rem', color: colors.gray }}>Strongly Disagree</span>
                          <span style={{ fontSize: '0.65rem', color: colors.gray }}>Strongly Agree</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Submit */}
              <div style={{ marginTop: '2rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setScreen('gate')}
                  disabled={!allAnswered}
                  style={{ ...btnPrimary, opacity: allAnswered ? 1 : 0.45, cursor: allAnswered ? 'pointer' : 'not-allowed' }}
                >
                  View My Results
                </button>
                <span style={{ fontSize: '0.78rem', color: allAnswered ? colors.green : colors.gray }}>
                  {allAnswered ? 'All questions answered — ready to continue.' : `${totalQuestions - answeredCount} question${totalQuestions - answeredCount !== 1 ? 's' : ''} remaining`}
                </span>
              </div>
            </div>
          )}

          {/* ══════════════════════════════
              SCREEN: EMAIL GATE
          ══════════════════════════════ */}
          {screen === 'gate' && (
            <div style={{ maxWidth: 560, margin: '0 auto', textAlign: 'center' }}>
              <div style={{ fontSize: 11, color: colors.gold, letterSpacing: '0.15em', fontWeight: 700, marginBottom: '1.5rem' }}>YOUR RESULTS</div>
              <h2 style={{ fontFamily: fonts.heading, fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '1rem' }}>
                Your Results Are <em style={{ color: colors.gold }}>Ready</em>
              </h2>
              <p style={{ fontSize: '0.98rem', lineHeight: 1.75, color: colors.gray, marginBottom: '2.5rem' }}>
                Enter your name and email to receive your personalized 5C Leadership Profile — including your strongest dimension, your critical gap, and your specific next step.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', textAlign: 'left' }}>
                {[
                  { label: 'First Name', id: 'firstName', type: 'text', placeholder: 'Your first name' },
                  { label: 'Last Name', id: 'lastName', type: 'text', placeholder: 'Your last name' },
                  { label: 'Email Address', id: 'email', type: 'email', placeholder: 'your@email.com' },
                ].map(field => (
                  <div key={field.id}>
                    <label style={{ display: 'block', fontSize: '0.72rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: colors.gold, fontWeight: 600, marginBottom: '0.4rem' }}>
                      {field.label}
                    </label>
                    <input
                      type={field.type}
                      placeholder={field.placeholder}
                      value={userData[field.id]}
                      onChange={e => setUserData(prev => ({ ...prev, [field.id]: e.target.value }))}
                      style={{ width: '100%', padding: '0.9rem 1rem', background: 'rgba(253,210,13,0.05)', border: `1px solid rgba(253,210,13,0.25)`, color: colors.cream, fontFamily: fonts.body, fontSize: '0.95rem', outline: 'none' }}
                    />
                  </div>
                ))}

                {gateError && (
                  <p style={{ fontSize: '0.82rem', color: colors.orange, marginTop: '0.25rem' }}>{gateError}</p>
                )}

                <button
                  onClick={revealResults}
                  disabled={sending}
                  style={{ ...btnPrimary, width: '100%', textAlign: 'center', opacity: sending ? 0.7 : 1, cursor: sending ? 'not-allowed' : 'pointer' }}
                >
                  {sending ? 'Preparing Your Profile...' : 'Reveal My Profile'}
                </button>
                <p style={{ fontSize: '0.75rem', color: colors.gray, textAlign: 'center' }}>Your information is private. We do not sell or share your data.</p>
              </div>
            </div>
          )}

          {/* ══════════════════════════════
              SCREEN: RESULTS
          ══════════════════════════════ */}
          {screen === 'results' && results && (
            <div>
              {/* Header */}
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <div style={badgeStyle}>Your 5C Leadership Profile</div>
                <h2 style={{ fontFamily: fonts.heading, fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 700, lineHeight: 1.1, marginBottom: '0.75rem' }}>
                  Here Is Where You <em style={{ color: colors.gold }}>Stand</em>
                </h2>
                <p style={{ fontSize: '1.1rem', color: colors.gray }}>
                  Your profile for <strong style={{ color: colors.cream }}>{userData.firstName} {userData.lastName}</strong>
                </p>
              </div>

              {/* Email Confirmation */}
              {emailSent && (
                <div style={{ padding: '1rem', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', marginBottom: '2rem', fontSize: '0.85rem', color: colors.green, textAlign: 'center' }}>
                  Your full results have been sent to {userData.email}
                </div>
              )}

              {/* Saved Confirmation */}
              {resultSaved && (
                <div style={{ fontSize: 12, color: t.success, marginTop: 8, textAlign: 'center' }}>
                  Your results have been saved to your profile.
                </div>
              )}

              {/* Overall Status */}
              <div style={{ padding: '2rem', textAlign: 'center', marginBottom: '2.5rem', border: `1px solid ${colors.goldLine}`, background: colors.goldDim }}>
                <div style={{ fontSize: '0.68rem', letterSpacing: '0.25em', textTransform: 'uppercase', color: colors.gold, fontWeight: 700, marginBottom: '0.5rem' }}>Overall Readiness Status</div>
                <div style={{ fontFamily: fonts.heading, fontSize: '1.8rem', fontWeight: 700, color: colors.cream }}>{getOverallStatus(results.totalScore)}</div>
                <div style={{ fontSize: '0.9rem', color: colors.gray, marginTop: '0.25rem' }}>Total Score: {results.totalScore} / 125</div>
              </div>

              {/* Dimension Scores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                {DIMENSIONS.map(dim => {
                  const s = results.scores[dim.id];
                  const st = getDimStatus(s);
                  const pct = Math.round((s / 25) * 100);
                  return (
                    <div key={dim.id} style={{ padding: '1.25rem 1.5rem', border: `1px solid rgba(253,210,13,0.15)`, background: 'rgba(253,210,13,0.03)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <div style={{ fontFamily: fonts.heading, fontSize: '1.2rem', fontWeight: 600, color: colors.cream }}>{dim.name}</div>
                        <div style={{ fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, padding: '0.2rem 0.6rem', color: st.color, border: `1px solid ${st.color}44`, background: `${st.color}11` }}>{st.label}</div>
                      </div>
                      <div style={{ height: 4, background: 'rgba(253,210,13,0.12)', width: '100%', marginBottom: '0.4rem' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: dim.color, transition: 'width 1s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: colors.gray }}>
                        <span>{dim.sub}</span>
                        <span style={{ fontWeight: 700, color: dim.color }}>{s} / 25</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Insight Block */}
              <div style={{ padding: '2rem', borderLeft: `3px solid ${colors.gold}`, background: 'rgba(253,210,13,0.05)', marginBottom: '2.5rem' }}>
                <h3 style={{ fontFamily: fonts.heading, fontSize: '1.5rem', fontWeight: 600, color: colors.cream, marginBottom: '1.25rem' }}>Your Blueprint Insight</h3>
                {[
                  { label: 'You Are Strongest In', value: `${results.strongest.name} — ${results.strongest.sub}`, italic: false },
                  { label: 'Your Greatest Gap', value: `${results.gap.name} — ${results.gap.sub}`, italic: false },
                  { label: 'Your Next Step', value: getNextStep(results.gap.id), italic: true },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: '1rem' }}>
                    <div style={{ fontSize: '0.68rem', letterSpacing: '0.2em', textTransform: 'uppercase', color: colors.gold, fontWeight: 700, marginBottom: '0.3rem' }}>{item.label}</div>
                    <div style={{ fontSize: item.italic ? '0.95rem' : '1.05rem', lineHeight: 1.65, color: item.italic ? colors.gray : colors.cream, fontStyle: item.italic ? 'italic' : 'normal' }}>{item.value}</div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div style={{ padding: '2.5rem', textAlign: 'center', background: `linear-gradient(135deg, ${colors.navyLight} 0%, ${colors.navy} 100%)`, border: `1px solid ${colors.goldLine}` }}>
                <h3 style={{ fontFamily: fonts.heading, fontSize: '1.8rem', fontWeight: 700, color: colors.cream, marginBottom: '0.75rem' }}>The Blueprint Is Built for This Moment</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: colors.gray, marginBottom: '1.75rem', maxWidth: 480, margin: '0 auto 1.75rem' }}>
                  Your results reveal exactly what the 5C Blueprint is designed to address. The gap you&apos;re carrying is not a deficiency — it&apos;s an invitation. The next step is a conversation.
                </p>
                <a
                  href="/blueprint/apply"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...btnPrimary, display: 'inline-block', textDecoration: 'none' }}
                >
            Apply for the Blueprint
                </a>
   <p style={{ fontSize: '0.78rem', color: 'rgba(253,248,240,0.35)', marginTop: '1rem' }}>Limited to 10 seats. Will reviews every application personally.</p>
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(253,210,13,0.15)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(253,248,240,0.6)', marginBottom: '1rem' }}>Want to go at your own pace? Start the Self-Paced Journey.</p>
                  <a href="/self-paced" style={{ ...btnPrimary, display: 'inline-block', textDecoration: 'none', background: 'transparent', border: '1px solid #FDD20D', color: '#FDD20D' }}>
                    Start the Journey →
                  </a>
                </div>
                <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(253,210,13,0.15)' }}>
                  <p style={{ fontSize: '0.85rem', color: 'rgba(253,248,240,0.6)', marginBottom: '1rem' }}>Already enrolled? Jump straight into your portal.</p>
                  <a href="/dashboard" style={{ ...btnPrimary, display: 'inline-block', textDecoration: 'none', background: 'transparent', border: '1px solid rgba(253,210,13,0.4)', color: 'rgba(253,210,13,0.6)' }}>
                    Access Your Portal →
                  </a>
                </div>
              </div>

            </div>
          )}

        </div>
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(253,248,240,0.3)', marginTop: '3rem', padding: '0 1.5rem 2rem', lineHeight: 1.6 }}>
          © {new Date().getFullYear()} Awakening Destiny Global. All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.
        </p>
      </div>
    </>
  );
}

// ════════════════════════════════════════
// SHARED STYLES
// ════════════════════════════════════════
const badgeStyle = {
  display: 'inline-block',
  background: 'rgba(253,210,13,0.12)',
  border: '1px solid rgba(253,210,13,0.35)',
  color: '#FDD20D',
  fontSize: '0.65rem',
  letterSpacing: '0.25em',
  textTransform: 'uppercase',
  fontWeight: 700,
  padding: '0.3rem 0.9rem',
  marginBottom: '1.5rem',
};

const btnPrimary = {
  background: '#FDD20D',
  color: '#021A35',
  fontFamily: fonts.body,
  fontSize: '0.85rem',
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  padding: '1rem 2.5rem',
  border: 'none',
  cursor: 'pointer',
  display: 'inline-block',
};
export async function getServerSideProps() {
  return { props: {} }
}
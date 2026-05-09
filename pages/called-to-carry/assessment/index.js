// pages/called-to-carry/assessment/index.js
// Called to Carry — 10-Q Assessment + Inline Results
// Preserves original results/[id].js layout exactly
// Adds 5 Coaching Layers: enhanced intro, helper text, mid-reflection, personalised summary, tier routing

import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import c from '../../../styles/AssessmentCoaching.module.css';
import { QUESTION_HELPER_TEXT } from '../../../lib/coaching-prompts';
import { ARCHETYPES, OFFICE_LABELS } from '../../../lib/archetypes';

const OFFICE_DISPLAY = { apostolic: 'Apostolic', prophetic: 'Prophetic', evangelistic: 'Evangelistic', pastoral: 'Pastoral', teaching: 'Teaching' };
const OVERLAY_DISPLAY = { builder: 'Builder', burden_bearer: 'Burden Bearer', reformer: 'Reformer', covenant_keeper: 'Covenant Keeper', equipper: 'Equipper' };

// ─── QUESTIONS ────────────────────────────────────────────────────────────
const OFFICE_QUESTIONS = [
  { id: 'office_1', track: 'office', question: 'When you see a new territory — a new market, community, ministry opportunity, or spiritual landscape — your first instinct is to:', options: [{ label: 'Plant something new that has never existed there', score: 'apostolic' }, { label: 'Listen for what God is already saying about it', score: 'prophetic' }, { label: 'Invite people into it and draw them together', score: 'evangelistic' }, { label: 'Care for those already there and make sure they are held', score: 'pastoral' }, { label: 'Understand it deeply and explain it to others', score: 'teaching' }] },
  { id: 'office_2', track: 'office', question: 'The weight you most consistently carry in your leadership is:', options: [{ label: 'The weight of pioneering what no one else has built', score: 'apostolic' }, { label: 'The weight of seeing what others do not yet see', score: 'prophetic' }, { label: 'The weight of those who are not yet gathered in', score: 'evangelistic' }, { label: 'The weight of the people entrusted to my care', score: 'pastoral' }, { label: 'The weight of truth that has not yet been made clear', score: 'teaching' }] },
  { id: 'office_3', track: 'office', question: 'When you enter a room full of people you do not know, you are most likely to:', options: [{ label: 'Sense what is missing and start drawing a vision for what could be', score: 'apostolic' }, { label: 'Feel the spiritual atmosphere before anyone has spoken', score: 'prophetic' }, { label: 'Find the person on the edge and make them feel seen', score: 'evangelistic' }, { label: 'Notice who is struggling and quietly move toward them', score: 'pastoral' }, { label: 'Observe the dynamics and begin to understand the group', score: 'teaching' }] },
  { id: 'office_4', track: 'office', question: 'When you teach, speak, or lead — what comes most naturally is:', options: [{ label: 'Casting vision that calls people into something new', score: 'apostolic' }, { label: 'Declaring what God is saying in this moment', score: 'prophetic' }, { label: 'Inviting people to encounter something bigger than themselves', score: 'evangelistic' }, { label: 'Walking alongside people through what they are facing', score: 'pastoral' }, { label: 'Bringing clarity to what has been confusing or misunderstood', score: 'teaching' }] },
  { id: 'office_5', track: 'office', question: 'The thing you are most afraid of losing in your leadership is:', options: [{ label: 'The pioneering edge — becoming too safe or settled', score: 'apostolic' }, { label: 'The prophetic clarity — becoming dull or distracted', score: 'prophetic' }, { label: 'The heart for the lost — becoming insulated from outsiders', score: 'evangelistic' }, { label: 'The intimacy with my people — becoming a manager instead of a shepherd', score: 'pastoral' }, { label: 'The depth of truth — becoming shallow or untethered from study', score: 'teaching' }] },
];

const OVERLAY_QUESTIONS = [
  { id: 'overlay_1', track: 'overlay', question: 'When you engage a problem that needs addressing, you most naturally:', options: [{ label: 'Design a structure that solves it long-term', score: 'builder' }, { label: 'Absorb the weight of it until it shifts', score: 'burden_bearer' }, { label: 'Confront what is broken and call for change', score: 'reformer' }, { label: 'Connect the right people to it and hold them together', score: 'covenant_keeper' }, { label: 'Train others to be able to handle problems like this themselves', score: 'equipper' }] },
  { id: 'overlay_2', track: 'overlay', question: 'The assignments you are most drawn to are the ones that involve:', options: [{ label: 'Building something lasting — structures, systems, institutions', score: 'builder' }, { label: 'Carrying weight others cannot — intercession, the hidden place', score: 'burden_bearer' }, { label: 'Confronting what is broken — reforming what has gone wrong', score: 'reformer' }, { label: 'Forming long-term covenant relationships — lifelong alliances', score: 'covenant_keeper' }, { label: 'Raising up leaders — training, mentoring, multiplying', score: 'equipper' }] },
  { id: 'overlay_3', track: 'overlay', question: 'When you look back at your life, the patterns you see most clearly are:', options: [{ label: 'A track record of building things from nothing', score: 'builder' }, { label: 'A track record of carrying weight that shaped me in hidden ways', score: 'burden_bearer' }, { label: 'A track record of confronting what needed to change', score: 'reformer' }, { label: 'A track record of long, faithful relationships across seasons', score: 'covenant_keeper' }, { label: 'A track record of pouring into others and raising them up', score: 'equipper' }] },
  { id: 'overlay_4', track: 'overlay', question: 'The greatest temptation you fight in your leadership is:', options: [{ label: 'Building beyond what I can sustain or releasing too slowly', score: 'builder' }, { label: 'Carrying weight that was never mine to carry', score: 'burden_bearer' }, { label: 'Confronting before relational equity has been established', score: 'reformer' }, { label: 'Holding onto covenants past the season God has released me from', score: 'covenant_keeper' }, { label: 'Holding onto leaders too long instead of releasing them', score: 'equipper' }] },
  { id: 'overlay_5', track: 'overlay', question: 'When God measures your life, the primary question will be:', options: [{ label: 'What did you build that was meant to outlast you?', score: 'builder' }, { label: 'What weight did you faithfully bear in the secret place?', score: 'burden_bearer' }, { label: 'What did you confront on My behalf?', score: 'reformer' }, { label: 'What covenants did you keep when it cost you?', score: 'covenant_keeper' }, { label: 'Who did you raise up to be released into their own assignment?', score: 'equipper' }] },
];

const QUESTIONS = [];
for (let i = 0; i < 5; i++) { QUESTIONS.push(OFFICE_QUESTIONS[i]); QUESTIONS.push(OVERLAY_QUESTIONS[i]); }

function calculateArchetype(answers) {
  const officeScores = { apostolic: 0, prophetic: 0, evangelistic: 0, pastoral: 0, teaching: 0 };
  const overlayScores = { builder: 0, burden_bearer: 0, reformer: 0, covenant_keeper: 0, equipper: 0 };
  answers.forEach((answer, idx) => {
    const q = QUESTIONS[idx];
    if (q.track === 'office') officeScores[answer.score] += 1;
    else overlayScores[answer.score] += 1;
  });
  const topOffice = Object.keys(officeScores).reduce((a, b) => officeScores[a] > officeScores[b] ? a : b);
  const topOverlay = Object.keys(overlayScores).reduce((a, b) => overlayScores[a] > overlayScores[b] ? a : b);
  return { office: topOffice, overlay: topOverlay, officeScores, overlayScores, archetypeId: `${topOffice}_${topOverlay}` };
}

// ─── COMPONENT ────────────────────────────────────────────────────────────
export default function AssessmentPage() {
  const [started, setStarted] = useState(false);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [gateData, setGateData] = useState({ firstName: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [helperOpen, setHelperOpen] = useState(false);

  // Layer 3
  const [midLoading, setMidLoading] = useState(false);
  const [midText, setMidText] = useState('');
  const [midDone, setMidDone] = useState(false);

  // Results state
  const [phase, setPhase] = useState('idle'); // idle | loading | done
  const [mirrorText, setMirrorText] = useState('');
  const [result, setResult] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [saving, setSaving] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);

  const handleAnswer = (option) => {
    const newAnswers = [...answers, { ...option, question: QUESTIONS[currentQ].question }];
    setAnswers(newAnswers);
    setHelperOpen(false);
    const nextQ = currentQ + 1;
    if (nextQ === 5 && !midDone) {
      setCurrentQ(5);
      triggerMidReflection(newAnswers, gateData.firstName);
    } else if (nextQ >= QUESTIONS.length) {
      setCurrentQ(QUESTIONS.length);
    } else {
      setCurrentQ(nextQ);
    }
  };

  const handleBack = () => {
    if (currentQ > 0 && currentQ < QUESTIONS.length) {
      setAnswers(answers.slice(0, -1));
      setCurrentQ(currentQ - 1);
      setHelperOpen(false);
    }
  };

  const triggerMidReflection = async (currentAnswers, firstName) => {
    setMidLoading(true);
    try {
      const res = await fetch('/api/called-to-carry/mid-reflection', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: currentAnswers, firstName }) });
      const data = await res.json();
      setMidText(data.reflection || FALLBACK_REFLECTION);
    } catch { setMidText(FALLBACK_REFLECTION); }
    finally { setMidLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const calc = calculateArchetype(answers);
      const res = await fetch('/api/called-to-carry/submit-archetype', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName: gateData.firstName, email: gateData.email, office: calc.office, overlay: calc.overlay, archetypeId: calc.archetypeId, officeScores: calc.officeScores, overlayScores: calc.overlayScores, emailConsent: consentChecked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submission failed.');

      fetch('/api/called-to-carry/capture-lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: gateData.email, firstName: gateData.firstName }) }).catch(() => {});

      const officeDefault = OFFICE_DISPLAY[calc.office];
      setSelectedLabel(officeDefault);
      setResult({ ...calc, firstName: gateData.firstName, email: gateData.email, officeDefault });

      setPhase('loading');
      const mirrorRes = await fetch('/api/called-to-carry/prophetic-mirror', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archetype: { ...calc, displayName: `${officeDefault} ${OVERLAY_DISPLAY[calc.overlay]}` }, answers, firstName: gateData.firstName }),
      });
      const mirrorData = await mirrorRes.json();
      setMirrorText(mirrorData.mirror || '');
      setPhase('done');
    } catch (err) { setError(err.message); setLoading(false); }
  };

  async function handleLabelChange(e) {
    const newLabel = e.target.value;
    setSelectedLabel(newLabel);
    setSaving(true);
    try {
      await fetch('/api/called-to-carry/save-label-preference', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: result.email, label_preference: newLabel === result.officeDefault ? 'functional' : 'custom', custom_label: newLabel === result.officeDefault ? null : newLabel }),
      });
    } catch (err) { console.error('Label save failed:', err); }
    finally { setSaving(false); }
  }

  async function handleSelfPacedCheckout() {
    try {
      const res = await fetch('/api/self-paced/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: result.email, firstName: result.firstName }) });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error('Checkout error:', err); }
  }

  // ── LAYER 1: INTRO ──────────────────────────────────────────────────────
  if (!started) {
    return (
      <>
        <Head>
          <title>Called to Carry Assessment — Awakening Destiny Global</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </Head>
        <div style={s.page}>
          <div style={s.main}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <p style={s.eyebrow}>The Called to Carry Assessment</p>
              <h1 style={s.archetypeName}>Discover What You Were Built to Carry.</h1>
              <p style={{ ...s.subtitle, marginTop: '1rem' }}>
                Ten questions. Two tracks. One archetype that names the grace on your leadership and the weight you were built to carry.
              </p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[
                '5 Offices × 5 Overlays = 25 unique archetype combinations',
                'Personalised identity insight rooted in Scripture',
                'A personalised summary of clarity spoken over your archetype',
                'Takes less than 5 minutes'
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '1rem', lineHeight: 1.6, opacity: 0.85 }}>
                  <span style={{ color: '#C8A951', marginTop: '2px' }}>✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p style={{ ...s.subtitle, fontSize: '0.9rem', opacity: 0.55, marginBottom: '2rem' }}>
              Answer from who you actually are — not who you are trying to become. There are no wrong answers. There is only your truth.
            </p>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => setStarted(true)} style={s.btnPrimary}>Begin the Assessment →</button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── LAYER 3: MID-REFLECTION ─────────────────────────────────────────────
  if (currentQ === 5 && !midDone) {
    return (
      <>
        <Head><title>Halfway — Called to Carry</title></Head>
        <div style={s.page}>
          <div style={{ ...s.main, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
            {midLoading || !midText ? (
              <>
                <p style={s.eyebrow}>Processing what you have shared…</p>
                <div style={s.spinner} />
                <p style={{ opacity: 0.45, fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem' }}>Your reflection is forming.</p>
              </>
            ) : (
              <>
                <p style={s.eyebrow}>Halfway through</p>
                <div style={{ background: 'rgba(200,169,81,0.07)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: '10px', padding: '2.5rem', maxWidth: '520px', marginBottom: '2rem' }}>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.25rem', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '2rem' }}>{midText}</p>
                  <button style={s.btnPrimary} onClick={() => setMidDone(true)}>
                    Continue → <span style={{ opacity: 0.7, fontWeight: 400 }}>5 questions remaining</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── GATE ────────────────────────────────────────────────────────────────
  if (currentQ >= QUESTIONS.length && phase === 'idle') {
    return (
      <>
        <Head><title>Your Archetype — Called to Carry</title></Head>
        <div style={s.page}>
          <div style={s.main}>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <p style={s.eyebrow}>Your Archetype Is Ready</p>
              <h1 style={s.archetypeName}>Where should we send your results?</h1>
              <p style={s.subtitle}>Enter your name and email to receive your Called to Carry archetype with a personalised summary of clarity.</p>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '420px', margin: '0 auto' }}>
              <input type="text" required placeholder="First name" value={gateData.firstName} onChange={e => setGateData({ ...gateData, firstName: e.target.value })} style={s.input} />
              <input type="email" required placeholder="Your email address" value={gateData.email} onChange={e => setGateData({ ...gateData, email: e.target.value })} style={s.input} />
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', textAlign: 'left' }}>
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={e => setConsentChecked(e.target.checked)}
                  style={{ marginTop: '3px', accentColor: '#C8A951', width: 16, height: 16, flexShrink: 0, cursor: 'pointer' }}
                />
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', lineHeight: 1.6, opacity: 0.7 }}>
                  Yes, send me Kingdom leadership insights and resources from Awakening Destiny Global. You can unsubscribe at any time.
                </span>
              </label>
              {error && <p style={{ color: '#ff6b6b', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif" }}>{error}</p>}
              <button type="submit" disabled={loading} style={s.btnPrimary}>{loading ? 'Processing…' : 'Reveal My Archetype →'}</button>
              <p style={{ textAlign: 'center', fontSize: '0.78rem', opacity: 0.45, fontFamily: "'Outfit', sans-serif" }}>We respect your inbox. No spam, ever.</p>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ── MIRROR LOADING ──────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <div style={s.page}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1.25rem' }}>
          <div style={s.spinner} />
          <p style={{ opacity: 0.45, fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem' }}>Preparing your personalised summary…</p>
        </div>
      </div>
    );
  }

  // ── FULL RESULTS ────────────────────────────────────────────────────────
  if (phase === 'done' && result) {
    const archetype = ARCHETYPES[result.archetypeId];
    const overlayName = OVERLAY_DISPLAY[result.overlay];
    const officeDefault = result.officeDefault;
    const labelOptions = [officeDefault, ...(OFFICE_LABELS?.[result.office] || []).filter(l => l !== officeDefault)];
    const firstName = result.firstName;
    const greeting = firstName ? `${firstName}, you are` : 'You are';
    const allScores = { ...result.officeScores, ...result.overlayScores };

    return (
      <div style={s.page}>
        <Head>
          <title>The {selectedLabel} {overlayName} — Called to Carry Results</title>
          <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </Head>
        <main style={s.main}>

          {/* Header */}
          <div style={s.header}>
            <p style={s.eyebrow}>Called to Carry · Your Result</p>
            <p style={s.greeting}>{greeting}</p>
            <h1 style={s.archetypeName}>The {selectedLabel} {overlayName}</h1>
          </div>

          {/* Label picker */}
          <div style={s.labelPicker}>
            <label htmlFor="label-select" style={s.labelPickerLabel}>Prefer a different term? Choose how you self-identify:</label>
            <select id="label-select" value={selectedLabel} onChange={handleLabelChange} disabled={saving} style={s.labelSelect}>
              {labelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            {saving && <span style={s.savingIndicator}>Saving…</span>}
          </div>

          {/* Layer 4: Personalised Summary */}
          {mirrorText && (
            <div style={{ background: 'rgba(200,169,81,0.07)', border: '1px solid rgba(200,169,81,0.25)', borderRadius: '8px', padding: '2rem 1.75rem', marginBottom: '2.5rem' }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A951', marginBottom: '1rem', fontWeight: 600 }}>Your Summary</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.15rem', lineHeight: 1.8, fontStyle: 'italic', opacity: 0.95 }}>{mirrorText}</p>
            </div>
          )}

          {/* Who You Are */}
          {archetype && (
            <div style={{ ...s.body }}>
              {(Array.isArray(archetype.who) ? archetype.who : [archetype.who]).filter(Boolean).map((para, i) => (
                <p key={i} style={s.para}>{para}</p>
              ))}
            </div>
          )}

          {/* Assignment */}
          {archetype?.assignment && (
            <section style={s.section}>
              <h2 style={s.sectionHeading}>Your Assignment</h2>
              <p style={s.para}>{archetype.assignment}</p>
            </section>
          )}

          {/* Strength */}
          {archetype?.strength && (
            <section style={s.section}>
              <h2 style={s.sectionHeading}>Your Strength</h2>
              <p style={s.para}>{archetype.strength}</p>
            </section>
          )}

          {/* Temptation */}
          {archetype?.temptation && (
            <section style={s.section}>
              <h2 style={s.sectionHeading}>Your Temptation</h2>
              <p style={s.para}>{archetype.temptation}</p>
            </section>
          )}

          {/* Scripture */}
          {archetype?.scripture && (
            <section style={s.scriptureSection}>
              <p style={s.scriptureText}>&ldquo;{archetype.scripture.text || archetype.scripture}&rdquo;</p>
              <p style={s.scriptureRef}>— {archetype.scripture.ref || archetype.scriptureRef}</p>
            </section>
          )}

          {/* Tier section */}
          <div style={s.tierSection}>
            <p style={s.tierEyebrow}>Choose Your Path Forward</p>
            <h2 style={s.tierHeading}>Three Ways to Walk This Out.</h2>
            <p style={s.tierIntro}>Your archetype is named. The next step is choosing how you want to walk the formation. All three pathways take you through the same 5C Leadership Blueprint — the difference is who walks beside you.</p>
            <div style={s.tierGrid}>

              {/* Self-Paced $149 */}
              <div style={s.tierCard}>
                <p style={s.tierLabel}>Self-Paced</p>
                <p style={s.tierPrice}>$149</p>
                <p style={s.tierTagline}>Walk it at your own pace.</p>
                <ul style={s.tierBullets}>
                  <li>All seven modules</li>
                  <li>Text + audio teaching</li>
                  <li>Personalized 5C Blueprint diagnostic</li>
                  <li>Blueprint export + Certificate</li>
                  <li>3 months portal access</li>
                </ul>
                <button onClick={handleSelfPacedCheckout} style={s.tierBtnPrimary}>Start the Journey →</button>
                <p style={s.tierNote}>Open enrollment. Begin immediately.</p>
              </div>

              {/* 21-Day Sprint $497 */}
              <div style={s.tierCard}>
                <p style={s.tierLabel}>21-Day Sprint</p>
                <p style={s.tierPrice}>$497</p>
                <p style={s.tierTagline}>Walk it directly with Will — intensively.</p>
                <ul style={s.tierBullets}>
                  <li>Everything in Self-Paced</li>
                  <li>21 days of direct access to Will</li>
                  <li>Personal apostolic counsel</li>
                  <li>Accelerated formation rhythm</li>
                  <li>Designed for leaders at a threshold</li>
                </ul>
                <Link href={`/called-to-carry/sprint/apply?archetype=${result.archetypeId}&email=${encodeURIComponent(result.email)}`} style={s.tierBtnPrimary}>Apply for the Sprint →</Link>
                <p style={s.tierNote}>Application required. Limited capacity.</p>
              </div>

              {/* Founders Cohort $997 */}
              <div style={s.tierCardFeatured}>
                <p style={s.tierBadge}>Most Transformative</p>
                <p style={s.tierLabel}>Founders Cohort</p>
                <p style={s.tierPrice}>$997</p>
                <p style={s.tierTagline}>Walk it with a covenant community.</p>
                <ul style={s.tierBullets}>
                  <li>Everything in Self-Paced</li>
                  <li>Live Zoom cohort sessions</li>
                  <li>Group processing &amp; community</li>
                  <li>8-week guided rhythm</li>
                  <li>Direct interaction with Will</li>
                </ul>
                <Link href={`/called-to-carry/founders/apply?archetype=${result.archetypeId}&email=${encodeURIComponent(result.email)}`} style={s.tierBtnPrimary}>Apply for the Cohort →</Link>
                <p style={s.tierNote}>Application required. Will reviews personally.</p>
              </div>

            </div>

            {/* Free entry path */}
            <div style={{ marginTop: '1.5rem', padding: '2rem 1.75rem', background: 'rgba(200,169,81,0.06)', border: '1px solid rgba(200,169,81,0.35)', borderRadius: '8px', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.72rem', letterSpacing: '0.18em', textTransform: 'uppercase', color: '#C8A951', fontWeight: 600, marginBottom: '0.75rem' }}>Start Free — No Payment Required</p>
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '1.35rem', fontWeight: 400, color: '#FDF8F0', lineHeight: 1.3, marginBottom: '0.75rem' }}>Not ready to commit? Begin the journey free.</p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.9rem', lineHeight: 1.65, opacity: 0.65, marginBottom: '1.5rem' }}>The Introduction and Calling modules are open to every leader — no card, no checkout. Taste the formation before you invest in the full journey.</p>
              <Link href="/modules/introduction" style={{ display: 'inline-block', background: '#C8A951', color: '#021A35', borderRadius: '4px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '0.9rem', padding: '0.8rem 2rem', textDecoration: 'none', letterSpacing: '0.04em' }}>Begin Free → Introduction &amp; Calling</Link>
            </div>

          </div>

          {/* Score breakdown */}
          <div style={s.scores}>
            <p style={s.scoresLabel}>Score breakdown</p>
            <div style={s.scoreGrid}>
              {Object.entries(allScores).map(([key, val]) => (
                <div key={key} style={s.scoreItem}>
                  <span style={s.scoreKey}>{key.replace(/_/g, ' ')}</span>
                  <span style={s.scoreVal}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={s.footerNote}>
            A copy of your results has been sent to your email.{' '}
            <Link href="/called-to-carry" style={s.footerLink}>Return to Called to Carry</Link>
          </p>
        </main>
      </div>
    );
  }

  // ── QUESTION VIEW ───────────────────────────────────────────────────────
  const question = QUESTIONS[currentQ];
  const progress = ((currentQ + 1) / QUESTIONS.length) * 100;
  const helperText = QUESTION_HELPER_TEXT[question?.id];

  return (
    <>
      <Head>
        <title>Question {currentQ + 1} of {QUESTIONS.length} — Called to Carry</title>
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <div style={s.page}>
        <div style={s.main}>
          {/* Progress bar */}
          <div style={{ height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', marginBottom: '2rem' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: '#C8A951', borderRadius: '2px', transition: 'width 0.3s ease' }} />
          </div>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: '0.8rem', opacity: 0.5, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Question {currentQ + 1} of {QUESTIONS.length}</span>
            <span style={{ background: 'rgba(200,169,81,0.15)', color: '#C8A951', padding: '2px 10px', borderRadius: '20px', fontSize: '0.72rem', letterSpacing: '0.06em' }}>
              {question.track === 'office' ? 'Office' : 'Overlay'}
            </span>
          </p>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.3rem, 4vw, 1.9rem)', fontWeight: 400, lineHeight: 1.4, marginBottom: '1.5rem' }}>{question.question}</h2>

          {/* Layer 2: Helper text */}
          {helperText && (
            <div style={{ marginBottom: '1.25rem' }}>
              <button
                onClick={() => setHelperOpen(!helperOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', color: 'rgba(200,169,81,0.75)', padding: 0, letterSpacing: '0.04em' }}
              >
                <span style={{ width: 16, height: 16, border: '1px solid currentColor', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', flexShrink: 0 }}>{helperOpen ? '−' : '?'}</span>
                {helperOpen ? 'Hide guidance' : 'How should I answer this?'}
              </button>
              {helperOpen && (
                <p style={{ marginTop: '10px', padding: '12px 16px', background: 'rgba(200,169,81,0.06)', borderLeft: '2px solid rgba(200,169,81,0.4)', borderRadius: '0 6px 6px 0', fontSize: '0.85rem', fontFamily: "'Outfit', sans-serif", color: '#C8A951', fontStyle: 'italic', lineHeight: 1.6 }}>
                  {helperText}
                </p>
              )}
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleAnswer(option)}
                style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.15)', borderRadius: '6px', cursor: 'pointer', textAlign: 'left', fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', color: '#FDF8F0', lineHeight: 1.5, transition: 'border-color 0.15s ease' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,169,81,0.45)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(200,169,81,0.15)'}
              >
                <span style={{ width: 28, height: 28, background: 'rgba(200,169,81,0.12)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: '0.8rem', color: '#C8A951', flexShrink: 0 }}>{String.fromCharCode(65 + idx)}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>

          {currentQ > 0 && (
            <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', color: 'rgba(253,248,240,0.4)', padding: 0 }}>← Back</button>
          )}
        </div>
      </div>
    </>
  );
}

const FALLBACK_REFLECTION = 'What I am seeing in you so far: a leader who carries more than they have yet been given language for. The weight is real. The assignment is forming. Continue — the second half will bring it into clarity.';

// ─── INLINE STYLES ────────────────────────────────────────────────────────
const s = {
  page: { background: '#021A35', minHeight: '100vh', color: '#FDF8F0', fontFamily: "'Georgia', serif" },
  main: { maxWidth: '680px', margin: '0 auto', padding: '4rem 1.5rem 6rem' },
  header: { textAlign: 'center', marginBottom: '2rem' },
  eyebrow: { color: '#C8A951', letterSpacing: '0.12em', fontSize: '0.78rem', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", marginBottom: '1.5rem' },
  greeting: { fontFamily: "'Outfit', sans-serif", fontSize: '1rem', opacity: 0.7, marginBottom: '0.4rem' },
  archetypeName: { fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 'clamp(2rem, 6vw, 3.5rem)', fontWeight: 400, lineHeight: 1.1, marginBottom: '1rem' },
  subtitle: { fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.75, fontStyle: 'italic', maxWidth: '480px', margin: '0 auto' },
  labelPicker: { textAlign: 'center', marginBottom: '3rem', padding: '1.5rem 1.25rem', background: 'rgba(200,169,81,0.06)', border: '1px solid rgba(200,169,81,0.18)', borderRadius: '6px' },
  labelPickerLabel: { display: 'block', fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', opacity: 0.8, marginBottom: '0.75rem' },
  labelSelect: { fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', padding: '0.55rem 1rem', background: '#021A35', color: '#FDF8F0', border: '1px solid rgba(200,169,81,0.4)', borderRadius: '4px', minWidth: '200px', cursor: 'pointer' },
  savingIndicator: { marginLeft: '0.75rem', fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', color: '#C8A951', opacity: 0.8 },
  body: { marginBottom: '2rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' },
  section: { marginBottom: '2.25rem' },
  sectionHeading: { fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C8A951', fontWeight: 600, marginBottom: '0.85rem' },
  para: { fontSize: '1.05rem', lineHeight: 1.8, marginBottom: '1.25rem', opacity: 0.9 },
  scriptureSection: { marginBottom: '3rem', padding: '2rem 1.5rem', borderLeft: '2px solid #C8A951', background: 'rgba(200,169,81,0.05)' },
  scriptureText: { fontSize: '1.1rem', lineHeight: 1.7, fontStyle: 'italic', marginBottom: '0.75rem', opacity: 0.92 },
  scriptureRef: { fontFamily: "'Outfit', sans-serif", fontSize: '0.85rem', color: '#C8A951', letterSpacing: '0.05em' },
  tierSection: { marginBottom: '3rem', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '2.5rem' },
  tierEyebrow: { color: '#C8A951', letterSpacing: '0.12em', fontSize: '0.78rem', textTransform: 'uppercase', fontFamily: "'Outfit', sans-serif", marginBottom: '0.5rem' },
  tierHeading: { fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', fontWeight: 400, marginBottom: '1rem' },
  tierIntro: { fontSize: '0.95rem', lineHeight: 1.7, opacity: 0.75, marginBottom: '2rem' },
  tierGrid: { display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', marginBottom: '2rem' },
  tierCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  tierCardFeatured: { background: 'rgba(200,169,81,0.08)', border: '1px solid rgba(200,169,81,0.5)', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  tierLabel: { fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C8A951', fontWeight: 600 },
  tierPrice: { fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, color: '#FDF8F0' },
  tierTagline: { fontSize: '0.95rem', opacity: 0.75, fontStyle: 'italic' },
  tierBullets: { paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.8, opacity: 0.8 },
  tierBtnPrimary: { display: 'inline-block', background: '#C8A951', color: '#021A35', borderRadius: '4px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1rem', padding: '0.9rem 2.2rem', textDecoration: 'none', marginBottom: '1rem', cursor: 'pointer', border: 'none', textAlign: 'center' },
  tierNote: { fontSize: '0.78rem', opacity: 0.5, fontFamily: "'Outfit', sans-serif" },
  tierBadge: { display: 'inline-block', background: '#C8A951', color: '#021A35', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', fontFamily: "'Outfit', sans-serif" },
  scores: { marginBottom: '2rem', opacity: 0.45 },
  scoresLabel: { fontFamily: "'Outfit', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' },
  scoreGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 2rem' },
  scoreItem: { display: 'flex', justifyContent: 'space-between', fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem' },
  scoreKey: { textTransform: 'capitalize' },
  scoreVal: { color: '#C8A951' },
  footerNote: { fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', opacity: 0.45, textAlign: 'center' },
  footerLink: { color: '#C8A951' },
  btnPrimary: { display: 'inline-block', background: '#C8A951', color: '#021A35', borderRadius: '4px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1rem', padding: '0.9rem 2.2rem', border: 'none', cursor: 'pointer', textDecoration: 'none' },
  input: { width: '100%', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(200,169,81,0.25)', borderRadius: '4px', color: '#FDF8F0', fontFamily: "'Outfit', sans-serif", fontSize: '0.95rem', boxSizing: 'border-box' },
  spinner: { width: 36, height: 36, border: '2px solid rgba(200,169,81,0.15)', borderTopColor: '#C8A951', borderRadius: '50%', animation: 'spin 0.9s linear infinite' },
};
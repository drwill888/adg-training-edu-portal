// pages/called-to-carry/assessment/results/[id].js
import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { ARCHETYPES } from '../../../../lib/called-to-carry/archetypes';

const OFFICE_DISPLAY = { apostolic:'Apostolic', prophetic:'Prophetic', evangelistic:'Evangelistic', pastoral:'Pastoral', teaching:'Teaching' };
const OVERLAY_DISPLAY = { builder:'Builder', burden_bearer:'Burden Bearer', reformer:'Reformer', covenant_keeper:'Covenant Keeper', equipper:'Equipper' };

export async function getServerSideProps({ params }) {
  const { id } = params;
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return { notFound: true };
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await supabase
    .from('called_to_carry_submissions')
    .select('id, email, first_name, office, overlay, archetype_id, office_scores, overlay_scores, label_preference, custom_label, created_at')
    .eq('id', id).single();
  if (error || !data) return { notFound: true };
  return { props: { submission: { id: data.id, email: data.email, firstName: data.first_name || null, archetype: data.archetype_id, office: data.office, overlay: data.overlay, scores: { ...data.office_scores, ...data.overlay_scores }, labelPreference: data.label_preference || 'functional', customLabel: data.custom_label || null, completedAt: data.created_at } } };
}

export default function AssessmentResults({ submission }) {
  const archetype = ARCHETYPES[submission.archetype];
  const officeDefault = OFFICE_DISPLAY[submission.office];
  const initialLabel = submission.customLabel || officeDefault;
  const [selectedLabel, setSelectedLabel] = useState(initialLabel);
  const [saving, setSaving] = useState(false);

  if (!archetype) return <div style={styles.page}><p style={{ textAlign:'center', padding:'4rem', opacity:0.6 }}>Results not found.</p></div>;

  const overlayName = OVERLAY_DISPLAY[submission.overlay];
  const firstName = submission.firstName;
  const greeting = firstName ? `${firstName}, you are` : 'You are';
  const labelOptions = [officeDefault, ...(archetype.officeLabels || [])];

  async function handleLabelChange(e) {
    const newLabel = e.target.value;
    setSelectedLabel(newLabel);
    setSaving(true);
    const isDefault = newLabel === officeDefault;
    try {
      await fetch('/api/called-to-carry/save-label-preference', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: submission.email, label_preference: isDefault ? 'functional' : 'custom', custom_label: isDefault ? null : newLabel }),
      });
    } catch (err) { console.error('Failed to save label preference:', err); }
    finally { setSaving(false); }
  }

  async function handleSelfPacedCheckout(email, firstName) {
    try {
      const res = await fetch('/api/self-paced/create-checkout-session', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch (err) { console.error('Checkout error:', err); }
  }

  return (
    <div style={styles.page}>
      <Head>
        <title>The {selectedLabel} {overlayName} — Called to Carry Results</title>
        <meta name="description" content={`Your Called to Carry archetype: The ${selectedLabel} ${overlayName}.`} />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Outfit:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      <main style={styles.main}>
        <div style={styles.header}>
          <p style={styles.eyebrow}>Called to Carry · Your Result</p>
          <p style={styles.greeting}>{greeting}</p>
          <h1 style={styles.archetypeName}>The {selectedLabel} {overlayName}</h1>
          <p style={styles.subtitle}>{archetype.subtitle}</p>
        </div>
        <div style={styles.labelPicker}>
          <label htmlFor="label-select" style={styles.labelPickerLabel}>Prefer a different term? Choose how you self-identify:</label>
          <select id="label-select" value={selectedLabel} onChange={handleLabelChange} disabled={saving} style={styles.labelSelect}>
            {labelOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {saving && <span style={styles.savingIndicator}>Saving…</span>}
        </div>
        <div style={styles.body}>
          {archetype.whoYouAre && archetype.whoYouAre.map((para, i) => <p key={`who-${i}`} style={styles.para}>{para}</p>)}
        </div>
        {archetype.assignment && <section style={styles.section}><h2 style={styles.sectionHeading}>Your Assignment</h2><p style={styles.para}>{archetype.assignment}</p></section>}
        {archetype.strength && <section style={styles.section}><h2 style={styles.sectionHeading}>Your Strength</h2><p style={styles.para}>{archetype.strength}</p></section>}
        {archetype.temptation && <section style={styles.section}><h2 style={styles.sectionHeading}>Your Temptation</h2><p style={styles.para}>{archetype.temptation}</p></section>}
        {archetype.scripture && (
          <section style={styles.scriptureSection}>
            <p style={styles.scriptureText}>&ldquo;{archetype.scripture}&rdquo;</p>
            {archetype.scriptureRef && <p style={styles.scriptureRef}>— {archetype.scriptureRef}</p>}
          </section>
        )}
        <div style={styles.tierSection}>
          <p style={styles.tierEyebrow}>Choose Your Path Forward</p>
          <h2 style={styles.tierHeading}>Three Ways to Walk This Out.</h2>
          <p style={styles.tierIntro}>Your archetype is named. The next step is choosing how you want to walk the formation. All three pathways take you through the same 5C Leadership Blueprint — the difference is who walks beside you.</p>
          <div style={styles.tierGrid}>
            <div style={styles.tierCard}>
              <p style={styles.tierLabel}>Self-Paced</p>
              <p style={styles.tierPrice}>$149</p>
              <p style={styles.tierTagline}>Walk it at your own pace.</p>
              <ul style={styles.tierBullets}>
                <li>All seven modules</li>
                <li>Text + audio teaching</li>
                <li>Personalized 5C Blueprint diagnostic</li>
                <li>Blueprint export + Certificate</li>
                <li>3 months portal access</li>
              </ul>
              <button onClick={() => handleSelfPacedCheckout(submission.email, submission.firstName)} style={styles.tierBtnPrimary}>Start the Journey →</button>
              <p style={styles.tierNote}>Open enrollment. Begin immediately.</p>
            </div>
            <div style={styles.tierCardFeatured}>
              <p style={styles.tierBadge}>Most Chosen</p>
              <p style={styles.tierLabel}>Founders Cohort</p>
              <p style={styles.tierPrice}>$497</p>
              <p style={styles.tierTagline}>Walk it with a cohort.</p>
              <ul style={styles.tierBullets}>
                <li>Everything in Self-Paced</li>
                <li>Live Zoom cohort sessions</li>
                <li>Group processing &amp; community</li>
                <li>8-week guided rhythm</li>
                <li>Direct interaction with Will</li>
              </ul>
              <Link href={`/called-to-carry/founders/apply?archetype=${submission.archetype}&email=${encodeURIComponent(submission.email)}`} style={styles.tierBtnPrimary}>Apply for the Cohort →</Link>
              <p style={styles.tierNote}>Application required. Will reviews personally.</p>
            </div>
            <div style={styles.tierCard}>
              <p style={styles.tierLabel}>21-Day Sprint</p>
              <p style={styles.tierPrice}>$997</p>
              <p style={styles.tierTagline}>Walk it directly with Will.</p>
              <ul style={styles.tierBullets}>
                <li>Everything in Self-Paced</li>
                <li>21 days of direct access to Will</li>
                <li>Personal apostolic counsel</li>
                <li>Accelerated formation rhythm</li>
                <li>Designed for leaders at a threshold</li>
              </ul>
              <Link href={`/called-to-carry/sprint/apply?archetype=${submission.archetype}&email=${encodeURIComponent(submission.email)}`} style={styles.tierBtnPrimary}>Apply for the Sprint →</Link>
              <p style={styles.tierNote}>Application required. Limited capacity.</p>
            </div>
          </div>
          {archetype.cta && archetype.cta.fallback && <p style={styles.tierFallback}>{archetype.cta.fallback}</p>}
        </div>
        <div style={styles.scores}>
          <p style={styles.scoresLabel}>Score breakdown</p>
          <div style={styles.scoreGrid}>
            {Object.entries(submission.scores || {}).map(([key, val]) => (
              <div key={key} style={styles.scoreItem}>
                <span style={styles.scoreKey}>{key.replace(/_/g, ' ')}</span>
                <span style={styles.scoreVal}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        <p style={styles.footerNote}>
          A copy of your results has been sent to your email.{' '}
          <Link href="/called-to-carry" style={styles.footerLink}>Return to Called to Carry</Link>
        </p>
        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: 'rgba(253,248,240,0.25)', marginTop: '1.5rem', lineHeight: 1.6 }}>
          © {new Date().getFullYear()} Awakening Destiny Global. All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.
        </p>
      </main>
    </div>
  );
}

const styles = {
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
  tierGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' },
  tierCard: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(200,169,81,0.2)', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  tierCardFeatured: { background: 'rgba(200,169,81,0.08)', border: '1px solid rgba(200,169,81,0.5)', borderRadius: '8px', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  tierLabel: { fontFamily: "'Outfit', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#C8A951', fontWeight: 600 },
  tierPrice: { fontFamily: "'Cormorant Garamond', serif", fontSize: '2rem', fontWeight: 400, color: '#FDF8F0' },
  tierTagline: { fontSize: '0.95rem', opacity: 0.75, fontStyle: 'italic' },
  tierBullets: { paddingLeft: '1.2rem', fontSize: '0.88rem', lineHeight: 1.8, opacity: 0.8 },
  tierBtnPrimary: { display: 'inline-block', background: '#C8A951', color: '#021A35', borderRadius: '4px', fontFamily: "'Outfit', sans-serif", fontWeight: 600, fontSize: '1rem', padding: '0.9rem 2.2rem', textDecoration: 'none', marginBottom: '1rem', cursor: 'pointer', border: 'none' },
  tierNote: { fontSize: '0.78rem', opacity: 0.5, fontFamily: "'Outfit', sans-serif" },
  tierBadge: { display: 'inline-block', background: '#C8A951', color: '#021A35', fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '0.2rem 0.6rem', borderRadius: '2px', fontFamily: "'Outfit', sans-serif" },
  tierFallback: { fontSize: '0.88rem', opacity: 0.5, textAlign: 'center', fontStyle: 'italic', marginTop: '1rem' },
  scores: { marginBottom: '2rem', opacity: 0.45 },
  scoresLabel: { fontFamily: "'Outfit', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' },
  scoreGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem 2rem' },
  scoreItem: { display: 'flex', justifyContent: 'space-between', fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem' },
  scoreKey: { textTransform: 'capitalize' },
  scoreVal: { color: '#C8A951' },
  footerNote: { fontFamily: "'Outfit', sans-serif", fontSize: '0.82rem', opacity: 0.45, textAlign: 'center' },
  footerLink: { color: '#C8A951' },
};
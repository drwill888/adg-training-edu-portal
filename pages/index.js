// pages/index.js
// 5C Leadership Blueprint — Landing Page
// Move current pages/index.js (dashboard) to pages/dashboard.js first

import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabase';

const css = `
  #adg-5c, #adg-5c * { box-sizing: border-box !important; }
  #adg-5c *:not(script):not(style) { font-family: 'Outfit', sans-serif !important; }

  #adg-5c {
    background: var(--navy) !important;
    color: var(--cream) !important;
    overflow-x: hidden !important;
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    line-height: normal !important;
    --navy: #021A35;
    --gold: #FDD20D;
    --blue: #0172BC;
    --orange: #F47722;
    --red: #EE3124;
    --cream: #FDF8F0;
    --navy-light: #0a2d52;
    --gold-dim: rgba(253,210,13,0.12);
    --gold-line: rgba(253,210,13,0.35);
  }

  #adg-5c .section-title { font-family: 'Cormorant Garamond', serif !important; font-size: clamp(2.2rem, 5vw, 3.8rem) !important; font-weight: 600 !important; line-height: 1.1 !important; color: var(--cream) !important; }
  #adg-5c .section-title em { color: var(--gold) !important; font-style: italic !important; }
  #adg-5c .body-text { font-size: 1.05rem !important; line-height: 1.8 !important; color: rgba(253,248,240,0.8) !important; }
  #adg-5c .gold-line { width: 48px !important; height: 2px !important; background: var(--gold) !important; margin: 1.2rem 0 !important; display: block !important; }
  #adg-5c .gold-line.center { margin: 1.2rem auto !important; }
  #adg-5c .container { max-width: 1140px !important; margin: 0 auto !important; padding: 0 2rem !important; }
  #adg-5c .gold-divider { height: 1px !important; background: linear-gradient(90deg, transparent, rgba(253,210,13,0.35), transparent) !important; display: block !important; }

  #adg-5c .section-badge { display: inline-block !important; background: rgba(253,210,13,0.12) !important; border: 1px solid rgba(253,210,13,0.35) !important; color: var(--gold) !important; font-size: 0.65rem !important; letter-spacing: 0.25em !important; text-transform: uppercase !important; padding: 0.3rem 0.8rem !important; margin-bottom: 1.25rem !important; font-weight: 600 !important; }
  #adg-5c .section-badge.dark { background: rgba(2,26,53,0.08) !important; border-color: rgba(2,26,53,0.2) !important; color: var(--blue) !important; }
  #adg-5c .section-badge.red { background: rgba(238,49,36,0.08) !important; border-color: rgba(238,49,36,0.2) !important; color: var(--red) !important; }
  #adg-5c .section-badge.orange { background: rgba(244,119,34,0.08) !important; border-color: rgba(244,119,34,0.2) !important; color: var(--orange) !important; }

  #adg-5c .btn-primary { background: var(--gold) !important; color: var(--navy) !important; font-family: 'Outfit', sans-serif !important; font-size: 0.85rem !important; font-weight: 700 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; padding: 1rem 2.2rem !important; border: none !important; cursor: pointer !important; text-decoration: none !important; display: inline-block !important; transition: transform 0.2s, box-shadow 0.2s !important; border-radius: 0 !important; }
  #adg-5c .btn-primary:hover { transform: translateY(-2px) !important; box-shadow: 0 8px 30px rgba(253,210,13,0.3) !important; background: var(--gold) !important; color: var(--navy) !important; }
  #adg-5c .btn-gold-outline { background: transparent !important; color: var(--gold) !important; font-family: 'Outfit', sans-serif !important; font-size: 0.85rem !important; font-weight: 700 !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; padding: 1rem 2.2rem !important; border: 1px solid var(--gold) !important; cursor: pointer !important; text-decoration: none !important; display: inline-block !important; border-radius: 0 !important; }
  #adg-5c .btn-gold-outline:hover { background: var(--gold) !important; color: var(--navy) !important; }

  #adg-5c nav { position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; z-index: 99999 !important; padding: 1.25rem 2rem !important; display: flex !important; align-items: center !important; justify-content: space-between !important; background: rgba(2,26,53,0.97) !important; backdrop-filter: blur(12px) !important; border-bottom: 1px solid rgba(253,210,13,0.35) !important; border-top: none !important; border-left: none !important; border-right: none !important; margin: 0 !important; }
  #adg-5c .nav-logo { font-family: 'Cormorant Garamond', serif !important; font-size: 1.2rem !important; font-weight: 600 !important; color: var(--cream) !important; text-decoration: none !important; }
  #adg-5c .nav-logo span { color: var(--gold) !important; }
  #adg-5c .nav-right { display: flex !important; align-items: center !important; gap: 1rem !important; }
  #adg-5c .nav-assess { font-size: 0.75rem !important; color: var(--gold) !important; text-decoration: none !important; letter-spacing: 0.08em !important; font-weight: 600 !important; }
  #adg-5c .nav-cta { background: var(--gold) !important; color: var(--navy) !important; font-family: 'Outfit', sans-serif !important; font-size: 0.8rem !important; font-weight: 700 !important; letter-spacing: 0.08em !important; text-transform: uppercase !important; padding: 0.6rem 1.4rem !important; border: none !important; cursor: pointer !important; text-decoration: none !important; display: inline-block !important; border-radius: 0 !important; }

  #adg-5c #hero { min-height: 100vh !important; display: flex !important; align-items: center !important; position: relative !important; overflow: hidden !important; padding: 8rem 2rem 5rem !important; background: var(--navy) !important; }
  #adg-5c .hero-bg { position: absolute !important; inset: 0 !important; background: radial-gradient(ellipse 80% 60% at 70% 50%, rgba(1,114,188,0.12) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 10% 80%, rgba(253,210,13,0.06) 0%, transparent 60%), #021A35 !important; }
  #adg-5c .hero-grid { position: absolute !important; inset: 0 !important; background-image: linear-gradient(rgba(253,210,13,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(253,210,13,0.04) 1px, transparent 1px) !important; background-size: 60px 60px !important; }
  #adg-5c .hero-content { position: relative !important; z-index: 2 !important; max-width: 780px !important; }
  #adg-5c .hero-eyebrow { display: inline-flex !important; align-items: center !important; gap: 0.75rem !important; background: rgba(253,210,13,0.12) !important; border: 1px solid rgba(253,210,13,0.35) !important; padding: 0.4rem 1rem !important; margin-bottom: 2rem !important; font-size: 0.7rem !important; font-weight: 600 !important; letter-spacing: 0.25em !important; text-transform: uppercase !important; color: var(--gold) !important; }
  #adg-5c .hero-title { font-family: 'Cormorant Garamond', serif !important; font-size: clamp(3rem, 7vw, 5.5rem) !important; font-weight: 700 !important; line-height: 1.0 !important; margin-bottom: 1.5rem !important; color: var(--cream) !important; }
  #adg-5c .hero-title .accent { color: var(--gold) !important; display: block !important; font-style: italic !important; }
  #adg-5c .hero-subtitle { font-size: 1.15rem !important; line-height: 1.75 !important; color: rgba(253,248,240,0.78) !important; max-width: 600px !important; margin-bottom: 2.5rem !important; }
  #adg-5c .hero-actions { display: flex !important; gap: 1rem !important; flex-wrap: wrap !important; margin-bottom: 2rem !important; }
  #adg-5c .hero-assess-nudge { display: flex !important; align-items: center !important; gap: 0.75rem !important; margin-bottom: 3rem !important; }
  #adg-5c .assess-nudge-line { height: 1px !important; width: 32px !important; background: rgba(253,210,13,0.35) !important; }
  #adg-5c .assess-nudge-text { font-size: 0.78rem !important; color: rgba(253,248,240,0.45) !important; letter-spacing: 0.05em !important; }
  #adg-5c .assess-nudge-link { font-size: 0.78rem !important; color: var(--gold) !important; font-weight: 600 !important; text-decoration: none !important; letter-spacing: 0.05em !important; border-bottom: 1px solid rgba(253,210,13,0.3) !important; }
  #adg-5c .hero-5c-row { display: flex !important; gap: 1.5rem !important; flex-wrap: wrap !important; }
  #adg-5c .hero-c { display: flex !important; align-items: center !important; gap: 0.5rem !important; opacity: 0.55 !important; font-size: 0.8rem !important; letter-spacing: 0.12em !important; text-transform: uppercase !important; font-weight: 500 !important; color: var(--cream) !important; }
  #adg-5c .hero-c-dot { width: 6px !important; height: 6px !important; border-radius: 50% !important; background: var(--gold) !important; flex-shrink: 0 !important; }
  #adg-5c .hero-scroll { position: absolute !important; bottom: 2.5rem !important; left: 50% !important; transform: translateX(-50%) !important; display: flex !important; flex-direction: column !important; align-items: center !important; gap: 0.5rem !important; font-size: 0.7rem !important; letter-spacing: 0.2em !important; text-transform: uppercase !important; opacity: 0.4 !important; color: var(--cream) !important; }
  #adg-5c .scroll-line { width: 1px !important; height: 40px !important; background: var(--cream) !important; animation: adgScrollPulse 2s infinite !important; }
  @keyframes adgScrollPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }

  #adg-5c #assess-teaser { padding: 5rem 2rem !important; background: var(--navy-light) !important; position: relative !important; overflow: hidden !important; }
  #adg-5c #assess-teaser::before { content: '' !important; position: absolute !important; inset: 0 !important; background: radial-gradient(ellipse 70% 100% at 50% 50%, rgba(253,210,13,0.05) 0%, transparent 70%) !important; }
  #adg-5c .assess-inner { position: relative !important; z-index: 2 !important; display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 4rem !important; align-items: center !important; }
  #adg-5c .assess-right { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 1rem !important; }
  #adg-5c .assess-score-card { padding: 1.25rem !important; border: 1px solid rgba(253,210,13,0.35) !important; background: rgba(253,210,13,0.12) !important; text-align: center !important; }
  #adg-5c .assess-score-card .dim-label { font-size: 0.65rem !important; letter-spacing: 0.2em !important; text-transform: uppercase !important; color: var(--gold) !important; font-weight: 700 !important; margin-bottom: 0.4rem !important; display: block !important; }
  #adg-5c .assess-score-card .dim-bar-track { height: 3px !important; background: rgba(253,210,13,0.15) !important; margin-bottom: 0.4rem !important; }
  #adg-5c .assess-score-card .dim-bar-fill { height: 100% !important; background: var(--gold) !important; display: block !important; }
  #adg-5c .assess-score-card .dim-status { font-size: 0.7rem !important; color: rgba(253,248,240,0.55) !important; display: block !important; }
  #adg-5c .assess-output { margin-top: 1.5rem !important; padding: 1.25rem !important; border-left: 3px solid var(--gold) !important; background: rgba(253,210,13,0.05) !important; }
  #adg-5c .assess-output p { font-family: 'Cormorant Garamond', serif !important; font-size: 1.1rem !important; font-style: italic !important; line-height: 1.7 !important; color: var(--cream) !important; margin-bottom: 0.5rem !important; }
  #adg-5c .assess-output .output-sub { font-size: 0.75rem !important; color: rgba(253,248,240,0.45) !important; font-style: normal !important; }

  #adg-5c #problem { padding: 7rem 2rem !important; background: var(--cream) !important; color: var(--navy) !important; }
  #adg-5c #problem .section-title { color: var(--navy) !important; }
  #adg-5c #problem .body-text { color: rgba(2,26,53,0.75) !important; }
  #adg-5c .pain-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 1.5rem !important; margin-top: 3rem !important; }
  #adg-5c .pain-card { border-left: 3px solid var(--navy) !important; padding: 1.5rem !important; background: rgba(2,26,53,0.04) !important; }
  #adg-5c .pain-card h4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.25rem !important; font-weight: 600 !important; color: var(--navy) !important; margin-bottom: 0.5rem !important; }
  #adg-5c .pain-card p { font-size: 0.95rem !important; line-height: 1.7 !important; color: rgba(2,26,53,0.7) !important; }

  #adg-5c #solution { padding: 7rem 2rem !important; background: var(--navy) !important; text-align: center !important; position: relative !important; overflow: hidden !important; }
  #adg-5c #solution::before { content: '5C' !important; position: absolute !important; top: 50% !important; left: 50% !important; transform: translate(-50%,-50%) !important; font-family: 'Cormorant Garamond', serif !important; font-size: 28rem !important; font-weight: 700 !important; color: rgba(253,210,13,0.03) !important; pointer-events: none !important; white-space: nowrap !important; }
  #adg-5c .solution-inner { position: relative !important; z-index: 2 !important; }
  #adg-5c .solution-description { max-width: 680px !important; margin: 0 auto 2.5rem !important; }

  #adg-5c #pillars { padding: 7rem 2rem !important; background: var(--navy-light) !important; }
  #adg-5c .pillars-intro { text-align: center !important; max-width: 640px !important; margin: 0 auto 4rem !important; }
  #adg-5c .pillar-item { display: grid !important; grid-template-columns: 80px 1fr !important; border-bottom: 1px solid rgba(253,210,13,0.15) !important; padding: 2.5rem 0 !important; gap: 2rem !important; align-items: start !important; background: transparent !important; }
  #adg-5c .pillar-num { font-family: 'Cormorant Garamond', serif !important; font-size: 4rem !important; font-weight: 700 !important; color: var(--gold) !important; line-height: 1 !important; opacity: 0.9 !important; }
  #adg-5c .pillar-body h3 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.9rem !important; font-weight: 600 !important; color: var(--cream) !important; margin-bottom: 0.3rem !important; }
  #adg-5c .pillar-body .pillar-sub { font-size: 0.75rem !important; letter-spacing: 0.2em !important; text-transform: uppercase !important; color: var(--gold) !important; font-weight: 600 !important; margin-bottom: 0.9rem !important; display: block !important; }
  #adg-5c .pillar-body p { font-size: 0.98rem !important; line-height: 1.75 !important; color: rgba(253,248,240,0.72) !important; max-width: 640px !important; }
  #adg-5c .pillar-outcomes { display: flex !important; flex-wrap: wrap !important; gap: 0.5rem !important; margin-top: 1rem !important; }
  #adg-5c .pillar-tag { font-size: 0.72rem !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; border: 1px solid rgba(253,210,13,0.3) !important; color: rgba(253,210,13,0.7) !important; padding: 0.25rem 0.7rem !important; background: transparent !important; }

  #adg-5c #who { padding: 7rem 2rem !important; background: var(--cream) !important; color: var(--navy) !important; }
  #adg-5c #who .section-title { color: var(--navy) !important; }
  #adg-5c .audience-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 1.5rem !important; margin-top: 3rem !important; }
  #adg-5c .audience-card { background: var(--navy) !important; color: var(--cream) !important; padding: 2rem 1.5rem !important; border-bottom: 3px solid var(--gold) !important; border-top: none !important; border-left: none !important; border-right: none !important; }
  #adg-5c .audience-card .icon { font-size: 1.8rem !important; margin-bottom: 1rem !important; display: block !important; }
  #adg-5c .audience-card h4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.3rem !important; font-weight: 600 !important; margin-bottom: 0.5rem !important; color: var(--gold) !important; }
  #adg-5c .audience-card p { font-size: 0.9rem !important; line-height: 1.65 !important; color: rgba(253,248,240,0.72) !important; }
  #adg-5c .not-for { margin-top: 3rem !important; padding: 2rem !important; border: 1px solid rgba(2,26,53,0.15) !important; background: rgba(2,26,53,0.04) !important; }
  #adg-5c .not-for h4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.2rem !important; color: var(--navy) !important; margin-bottom: 0.75rem !important; }
  #adg-5c .not-for p { font-size: 0.95rem !important; line-height: 1.7 !important; color: rgba(2,26,53,0.65) !important; }

  #adg-5c #deliverables { padding: 7rem 2rem !important; background: var(--navy) !important; }
  #adg-5c .deliverables-intro { max-width: 620px !important; margin-bottom: 4rem !important; }
  #adg-5c .deliverables-grid { display: grid !important; grid-template-columns: repeat(3, 1fr) !important; gap: 1.5rem !important; }
  #adg-5c .deliverable-card { background: rgba(253,210,13,0.05) !important; border: 1px solid rgba(253,210,13,0.2) !important; padding: 2rem !important; }
  #adg-5c .deliverable-card .d-icon { width: 44px !important; height: 44px !important; background: rgba(253,210,13,0.12) !important; border: 1px solid rgba(253,210,13,0.35) !important; display: flex !important; align-items: center !important; justify-content: center !important; font-size: 1.2rem !important; margin-bottom: 1.2rem !important; }
  #adg-5c .deliverable-card h4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.3rem !important; font-weight: 600 !important; color: var(--gold) !important; margin-bottom: 0.5rem !important; }
  #adg-5c .deliverable-card p { font-size: 0.92rem !important; line-height: 1.7 !important; color: rgba(253,248,240,0.7) !important; }

  #adg-5c #journey { padding: 7rem 2rem !important; background: var(--navy-light) !important; }
  #adg-5c .journey-intro { text-align: center !important; max-width: 600px !important; margin: 0 auto 4rem !important; }
  #adg-5c .journey-steps { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important; gap: 0 !important; }
  #adg-5c .journey-step { padding: 2rem !important; position: relative !important; background: transparent !important; }
  #adg-5c .journey-step:not(:last-child)::after { content: '→' !important; position: absolute !important; right: -0.5rem !important; top: 50% !important; transform: translateY(-50%) !important; color: var(--gold) !important; font-size: 1.5rem !important; opacity: 0.4 !important; }
  #adg-5c .step-num { font-family: 'Cormorant Garamond', serif !important; font-size: 3rem !important; font-weight: 700 !important; color: var(--gold) !important; line-height: 1 !important; margin-bottom: 0.75rem !important; display: block !important; }
  #adg-5c .journey-step h4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.2rem !important; font-weight: 600 !important; color: var(--cream) !important; margin-bottom: 0.4rem !important; }
  #adg-5c .journey-step p { font-size: 0.88rem !important; line-height: 1.6 !important; color: rgba(253,248,240,0.65) !important; }

  #adg-5c #leader { padding: 7rem 2rem !important; background: var(--cream) !important; color: var(--navy) !important; }
  #adg-5c .leader-layout { display: grid !important; grid-template-columns: 1fr 1.4fr !important; gap: 4rem !important; align-items: center !important; }
  #adg-5c .leader-content h2 { font-family: 'Cormorant Garamond', serif !important; font-size: clamp(2rem, 4vw, 3rem) !important; font-weight: 600 !important; line-height: 1.1 !important; color: var(--navy) !important; margin-bottom: 0.5rem !important; }
  #adg-5c .leader-title { font-size: 0.78rem !important; letter-spacing: 0.18em !important; text-transform: uppercase !important; color: var(--orange) !important; font-weight: 600 !important; margin-bottom: 1.5rem !important; display: block !important; }
  #adg-5c .leader-content p { font-size: 0.98rem !important; line-height: 1.8 !important; color: rgba(2,26,53,0.75) !important; margin-bottom: 1rem !important; }
  #adg-5c .leader-credentials { display: flex !important; flex-wrap: wrap !important; gap: 0.5rem !important; margin-top: 1.5rem !important; }
  #adg-5c .cred-tag { font-size: 0.72rem !important; letter-spacing: 0.1em !important; text-transform: uppercase !important; border: 1px solid rgba(2,26,53,0.25) !important; color: rgba(2,26,53,0.6) !important; padding: 0.3rem 0.75rem !important; background: transparent !important; }

  #adg-5c #faq { padding: 7rem 2rem !important; background: var(--navy-light) !important; }
  #adg-5c .faq-list { max-width: 740px !important; margin-top: 3rem !important; }
  #adg-5c .faq-item { border-bottom: 1px solid rgba(253,210,13,0.15) !important; padding: 1.75rem 0 !important; border-top: none !important; border-left: none !important; border-right: none !important; background: transparent !important; }
  #adg-5c .faq-item h4 { font-family: 'Cormorant Garamond', serif !important; font-size: 1.2rem !important; font-weight: 600 !important; color: var(--cream) !important; margin-bottom: 0.75rem !important; }
  #adg-5c .faq-item p { font-size: 0.95rem !important; line-height: 1.75 !important; color: rgba(253,248,240,0.68) !important; }

  #adg-5c #cta-close { padding: 8rem 2rem !important; background: var(--navy) !important; text-align: center !important; position: relative !important; overflow: hidden !important; }
  #adg-5c #cta-close::before { content: '' !important; position: absolute !important; inset: 0 !important; background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(253,210,13,0.07) 0%, transparent 70%) !important; }
  #adg-5c .cta-inner { position: relative !important; z-index: 2 !important; max-width: 680px !important; margin: 0 auto !important; }
  #adg-5c .cta-dual { display: flex !important; gap: 1rem !important; justify-content: center !important; flex-wrap: wrap !important; }
  #adg-5c .cta-subtext { font-size: 0.82rem !important; color: rgba(253,248,240,0.4) !important; margin-top: 1.5rem !important; letter-spacing: 0.05em !important; display: block !important; }

  #adg-5c footer { background: #010f1f !important; padding: 3rem 2rem !important; border-top: 1px solid rgba(253,210,13,0.35) !important; }
  #adg-5c .footer-inner { display: flex !important; align-items: center !important; justify-content: space-between !important; flex-wrap: wrap !important; gap: 1rem !important; }
  #adg-5c .footer-brand { font-family: 'Cormorant Garamond', serif !important; font-size: 1.1rem !important; font-weight: 600 !important; color: rgba(253,248,240,0.6) !important; }
  #adg-5c .footer-brand span { color: var(--gold) !important; }
  #adg-5c .footer-links { display: flex !important; gap: 2rem !important; flex-wrap: wrap !important; }
  #adg-5c .footer-links a { font-size: 0.8rem !important; color: rgba(253,248,240,0.4) !important; text-decoration: none !important; letter-spacing: 0.08em !important; }
  #adg-5c .footer-links a:hover { color: var(--gold) !important; }
  #adg-5c .footer-copy { font-size: 0.78rem !important; color: rgba(253,248,240,0.3) !important; text-align: center !important; margin-top: 2rem !important; display: block !important; }

  @media (max-width: 768px) {
    #adg-5c .assess-inner { grid-template-columns: 1fr !important; gap: 2.5rem !important; }
    #adg-5c .pain-grid { grid-template-columns: 1fr !important; }
    #adg-5c .audience-grid { grid-template-columns: 1fr !important; }
    #adg-5c .deliverables-grid { grid-template-columns: 1fr !important; }
    #adg-5c .leader-layout { grid-template-columns: 1fr !important; }
    #adg-5c .leader-layout img { max-width: 320px !important; margin: 0 auto !important; display: block !important; }
    #adg-5c .journey-step:not(:last-child)::after { display: none !important; }
    #adg-5c .pillar-item { grid-template-columns: 60px 1fr !important; }
  }
`;


export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.push('/dashboard');
        } else {
          setChecking(false);
        }
      } catch (e) {
        setChecking(false);
      }
    }
    checkSession();
  }, []);

  if (checking) return null;

  return (
    <>
      <Head>
        <title>5C Leadership Blueprint | Awakening Destiny Global</title>
        <meta name="description" content="A leadership formation experience built on five integrated dimensions — Calling, Connection, Competency, Capacity, and Convergence. Designed for Kingdom entrepreneurs, pastors, and emerging leaders." />
        <meta property="og:title" content="5C Leadership Blueprint | Awakening Destiny Global" />
        <meta property="og:description" content="A leadership formation experience built on five integrated dimensions — Calling, Connection, Competency, Capacity, and Convergence. Designed for Kingdom entrepreneurs, pastors, and emerging leaders." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://5cblueprint.awakeningdestiny.global/" />
        <meta property="og:site_name" content="5C Leadership Blueprint" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="5C Leadership Blueprint | Awakening Destiny Global" />
        <meta name="twitter:description" content="A leadership formation experience built on five integrated dimensions — Calling, Connection, Competency, Capacity, and Convergence. Designed for Kingdom entrepreneurs, pastors, and emerging leaders." />
      </Head>

      <style dangerouslySetInnerHTML={{ __html: css }} />

      <div id="adg-5c">

        {/* NAV */}
        <nav>
          <a href="/" className="nav-logo">5C <span>Blueprint</span></a>
          <div className="nav-right">
            <a href="/assessment" className="nav-assess">Take the Assessment →</a>
            <a href="/login" className="nav-assess" style={{marginLeft: '0.5rem'}}>Login</a>
            <a href="/login" className="nav-cta">Access the Course</a>
          </div>
        </nav>

        {/* ═══ SECTION 1 — HERO ═══ */}
        <section id="hero">
          <div className="hero-bg"></div>
          <div className="hero-grid"></div>
          <div className="container hero-content">
            <div className="hero-eyebrow">Awakening Destiny Global</div>
            <h1 className="hero-title">
              You Were Not Built<br />
              <span className="accent">to Lead Alone.</span>
            </h1>
            <p className="hero-subtitle">
              The 5C Leadership Blueprint is an apostolic-prophetic framework that equips Kingdom leaders, entrepreneurs, and emerging voices to build with clarity, walk in identity, and lead with enduring impact — not just for a season, but for generations.
            </p>
            <div className="hero-actions">
              <a href="/login" className="btn-primary">Access the Course</a>
              <a href="/assessment" className="btn-gold-outline">Take the Free Assessment</a>
            </div>
            <div className="hero-assess-nudge">
              <div className="assess-nudge-line"></div>
              <span className="assess-nudge-text">Already have an account?</span>
              <a href="/login" className="assess-nudge-link">Sign in to continue your journey</a>
            </div>
            <div className="hero-5c-row">
              {['Calling','Connection','Competency','Capacity','Convergence'].map(c => (
                <div key={c} className="hero-c"><div className="hero-c-dot"></div> {c}</div>
              ))}
            </div>
          </div>
          <div className="hero-scroll"><div className="scroll-line"></div>Scroll</div>
        </section>

        {/* ═══ SECTION 2 — ASSESSMENT TEASER ═══ */}
        <section id="assess-teaser">
          <div className="container assess-inner">
            <div className="assess-left">
              <div className="section-badge">Free Assessment</div>
              <h2 className="section-title" style={{marginBottom:'1rem'}}>Know Where You<br /><em>Stand Before You Build</em></h2>
              <div className="gold-line"></div>
              <p className="body-text" style={{marginBottom:'1.75rem'}}>
                Before you enroll, take the 5C Leadership Assessment — 25 questions, 5 dimensions, 10 minutes. Walk away with a clear picture of your strongest dimension, your greatest gap, and your most strategic next step. Your personalized profile is sent directly to your inbox.
              </p>
              <div className="assess-output">
                <p>&ldquo;You are strongest in: <strong style={{color:'#FDD20D'}}>Calling</strong><br />
                Your greatest gap is: <strong style={{color:'#F47722'}}>Capacity</strong><br />
                Your next step is: <strong style={{color:'#FDF8F0'}}>The 5C Blueprint</strong>&rdquo;</p>
                <span className="output-sub">Sample output — your profile will reflect your actual responses.</span>
              </div>
              <div style={{marginTop:'1.75rem'}}>
                <a href="/assessment" className="btn-primary">Take the Free Assessment</a>
              </div>
            </div>
            <div className="assess-right">
              {[
                {label:'Calling', pct:'88%', status:'Strong · 22/25'},
                {label:'Connection', pct:'64%', status:'Developing · 16/25'},
                {label:'Competency', pct:'72%', status:'Developing · 18/25'},
                {label:'Capacity', pct:'44%', status:'Misaligned · 11/25'},
              ].map(d => (
                <div key={d.label} className="assess-score-card">
                  <div className="dim-label">{d.label}</div>
                  <div className="dim-bar-track"><div className="dim-bar-fill" style={{width:d.pct}}></div></div>
                  <div className="dim-status">{d.status}</div>
                </div>
              ))}
              <div className="assess-score-card" style={{gridColumn:'span 2'}}>
                <div className="dim-label">Convergence</div>
                <div className="dim-bar-track"><div className="dim-bar-fill" style={{width:'60%'}}></div></div>
                <div className="dim-status">Developing · 15/25</div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 3 — THE PROBLEM ═══ */}
        <section id="problem">
          <div className="container">
            <div className="section-badge dark">The Reality</div>
            <h2 className="section-title" style={{color:'#021A35'}}>Most Leaders Are <em style={{color:'#0172BC'}}>Busy — but Not Built.</em></h2>
            <div className="gold-line" style={{background:'#0172BC'}}></div>
            <p className="body-text" style={{maxWidth:'640px', marginBottom:'3rem', color:'rgba(2,26,53,0.75)'}}>
              They&apos;re showing up, working hard, even producing results. But underneath the activity is a quiet ache — a sense that something essential is missing. Gifted people running on borrowed frameworks. Leaders who haven&apos;t yet connected their gifts to their governance.
            </p>
            <div className="pain-grid">
              {[
                {title:'Gifted but Directionless', body:"You know you're called, but clarity about your specific assignment remains elusive. The gift is real — the lane isn't defined."},
                {title:'Isolated in Leadership', body:"You're carrying weight that was never meant to be carried alone. The higher you go, the thinner the relational oxygen."},
                {title:'Competent but Not Aligned', body:"Skills are sharp. But skills disconnected from calling produce exhaustion, not legacy. You're performing without fully thriving."},
                {title:'Capacity Without Structure', body:"Vision is abundant. But without rhythms that sustain — spiritual, physical, relational — leaders peak early and burn out quietly."},
                {title:'Activity Without Convergence', body:"Doing more isn't the problem. You need the moment where assignment, anointing, and alignment converge into unstoppable momentum."},
                {title:'No Proven Roadmap', body:"Leadership development in the Kingdom is often fragmented — part church, part business school, part self-help. You need an integrated framework."},
              ].map(card => (
                <div key={card.title} className="pain-card">
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 4 — SOLUTION INTRO ═══ */}
        <section id="solution">
          <div className="container solution-inner">
            <div className="section-badge">The Blueprint</div>
            <h2 className="section-title" style={{marginBottom:'1.5rem'}}>Introducing the<br /><em>5C Leadership Blueprint</em></h2>
            <div className="gold-line center"></div>
            <div className="solution-description">
              <p className="body-text">
                The 5C Blueprint is a proven, Spirit-led leadership development system built on five foundational dimensions — each one unlocking the next, each one essential to the whole. It&apos;s not a self-improvement program. It&apos;s a Kingdom alignment process — systematic enough for the strategist in you, revelatory enough for the prophet in you.
              </p>
            </div>
            <a href="#pillars" className="btn-primary">See the 5 Dimensions</a>
          </div>
        </section>

        {/* ═══ SECTION 5 — THE 5 PILLARS ═══ */}
        <section id="pillars">
          <div className="container">
            <div className="pillars-intro">
              <div className="section-badge">The Framework</div>
              <h2 className="section-title">Five Dimensions.<br /><em>One Complete Leader.</em></h2>
            </div>
            <div>
              {[
                { num:'01', sub:'The First Dimension', name:'Calling', body:"Every Kingdom leader must begin here — not with what they can do, but with who they are and what they were made for. Calling is the anchor. Without it, gifted people drift. This dimension cuts through the noise of opinion, expectation, and assignment confusion to give you the language and the clarity to name your specific purpose in the Kingdom. You'll move from a vague sense of destiny to a defined sense of direction.", tags:['Identity Clarity','Assignment Definition','Prophetic Affirmation'], last:false },
                { num:'02', sub:'The Second Dimension', name:'Connection', body:"No assignment is fulfilled in isolation. The Kingdom was designed for covenant relationship — not networking, not transactional collaboration, but deep, accountable, Spirit-aligned connection. This dimension builds the relational architecture that sustains your leadership over time. You'll learn how to attract and steward the right relationships, identify spiritual family, and lead within community without losing yourself — and without your identity depending on the room.", tags:['Relational Intelligence','Covenant vs. Contract','Identity Security','Spiritual Family'], last:false },
                { num:'03', sub:'The Third Dimension', name:'Competency', body:"Anointing opens doors. Competency keeps you in the room. This dimension bridges spiritual gifting with strategic skill-building — because excellence is not worldly, it's biblical. You'll sharpen the functional skills that your specific assignment demands: communication, decision-making, business acumen, organizational leadership, and Spirit-led problem solving. Competency aligned to calling produces exponential output.", tags:['Strategic Thinking','Business Acumen','Communication Mastery'], last:false },
                { num:'04', sub:'The Fourth Dimension', name:'Capacity', body:"Your next level is always held by your current capacity. This isn't just about bandwidth — it's about the spiritual, physical, emotional, and organizational infrastructure needed to hold what God has designed for you. Many leaders are called to more but cannot sustain more. This dimension addresses the rhythms, structures, and internal realities that either expand or limit your impact. Sustainable Kingdom leadership requires a prepared vessel.", tags:['Sustainable Rhythms','Emotional Health','Resource Stewardship'], last:false },
                { num:'05', sub:'The Fifth Dimension', name:'Convergence', body:"Convergence is the moment everything comes together — when your calling, relationships, competencies, and capacity align under the hand of God and produce lasting fruit. This is not a distant dream; it is a designed destination. In this dimension, you move from preparation into full deployment. You step into the fullness of your assignment, your enterprise takes shape, your voice carries greater weight, and your leadership becomes a gateway for others.", tags:['Legacy Formation','Enterprise Launch','Generational Impact'], last:true },
              ].map(p => (
                <div key={p.num} className="pillar-item" style={p.last ? {borderBottom:'none'} : {}}>
                  <div className="pillar-num">{p.num}</div>
                  <div className="pillar-body">
                    <div className="pillar-sub">{p.sub}</div>
                    <h3>{p.name}</h3>
                    <p>{p.body}</p>
                    <div className="pillar-outcomes">
                      {p.tags.map(t => <span key={t} className="pillar-tag">{t}</span>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 6 — WHO IT'S FOR ═══ */}
        <section id="who">
          <div className="container">
            <div className="section-badge red">Who This Is For</div>
            <h2 className="section-title" style={{color:'#021A35'}}>Built for Leaders<br />Who <em style={{color:'#EE3124'}}>Know They&apos;re Called</em> to More</h2>
            <div className="gold-line" style={{background:'#EE3124'}}></div>
            <div className="audience-grid">
              {[
                {num:'01', title:'Kingdom Entrepreneurs', body:"Business builders who want enterprise that reflects the Kingdom — profitable, purposeful, and Spirit-led from the boardroom to the balance sheet."},
                {num:'02', title:'Emerging Leaders', body:"Called ones in transition — moving from potential into purpose, from the preparation room into the deployment room."},
                {num:'03', title:'Pastors & Apostolic Leaders', body:"Shepherds and builders who need a framework that integrates spiritual governance with organizational effectiveness."},
                {num:'04', title:'Prophetic Voices', body:"Those who carry prophetic grace and need the structural wisdom to steward their gift with both accuracy and accountability."},
                {num:'05', title:'Executive Leaders', body:"High-capacity leaders at the peak of influence who sense that something deeper — something Kingdom — is being required of them now."},
                {num:'06', title:'Intercessors & Prayer Leaders', body:"Those who operate in intercession and need to understand how their gift is a leadership gift — one that shapes strategy, not just atmosphere."},
              ].map(card => (
                <div key={card.title} className="audience-card">
                  <div className="icon" style={{fontFamily:"'Cormorant Garamond', serif", fontWeight:700, opacity:0.6}}>{card.num}</div>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
            <div className="not-for">
              <h4>This is not for everyone — and that&apos;s intentional.</h4>
              <p>The 5C Blueprint is not a shortcut to success, a motivational boost, or a self-improvement program. It requires honest self-assessment, spiritual hunger, and a genuine willingness to be built. If you&apos;re looking for quick wins without transformation — this isn&apos;t your program. But if you are ready to be aligned, equipped, and deployed — welcome home.</p>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 7 — WHAT YOU GET (3x3 GRID) ═══ */}
        <section id="deliverables">
          <div className="container">
            <div className="deliverables-intro">
              <div className="section-badge">What&apos;s Included</div>
              <h2 className="section-title">Everything You Need to<br /><em>Build and Sustain</em></h2>
              <div className="gold-line"></div>
              <p className="body-text">This isn&apos;t a course you watch and forget. Every element is designed to produce real transformation — in your identity, your clarity, and your Kingdom enterprise.</p>
            </div>
            <div className="deliverables-grid">
              {[
                {num:'01', title:'5C Curriculum Modules', body:"Seven structured modules — Introduction, one for each of the 5 Dimensions, and a Commissioning — each building sequentially on the last with revelatory teaching, biblical foundations, and strategic frameworks."},
                {num:'02', title:'Interactive Reflection Questions', body:"Each module includes guided reflection questions designed to draw out what's already in you — surfacing clarity, confronting blind spots, and anchoring revelation to real application."},
                {num:'03', title:'Personalized Summaries', body:"At the close of each module, receive a personalized leadership summary tailored to your responses — a written declaration of where you are and where you're going."},
                {num:'04', title:'AI Leadership Assistant', body:"Your built-in guide throughout the Blueprint. Ask questions, go deeper on content, process what you're learning — available to you at every step of the journey."},
                {num:'05', title:'Prayer & Activation Support', body:"Every dimension includes targeted prayers and prophetic activations — so when you're stuck, unsure, or need a breakthrough, you have a Kingdom-anchored way forward built right into the experience."},
                {num:'06', title:'Reference Blogs & Scripture Study', body:"Each module connects to curated blog content and Scripture references for those who want to go deeper — anchoring the teaching in the Word and extending the revelation beyond the module."},
                {num:'07', title:'Podcast Training Series', body:"Access to the 5C Blueprint podcast — episodes that expand on each module with prophetic teaching, interviews, and leadership activation content to reinforce what you're building."},
                {num:'08', title:'Certificate of Commissioning', body:"Upon completing all five dimensions, receive a formal Certificate of Commissioning — a tangible marker of the work done, the ground covered, and the assignment ahead."},
                {num:'09', title:'Individual or Cohort', body:"Choose your path — move through the Blueprint at your own pace with full module access, or join a live cohort with peer community, group coaching, and real-time apostolic leadership input. One Blueprint. Two ways to build."},
              ].map(card => (
                <div key={card.title} className="deliverable-card">
                  <div className="d-icon" style={{fontFamily:"'Cormorant Garamond', serif", fontWeight:700, fontSize:'1rem'}}>{card.num}</div>
                  <h4>{card.title}</h4>
                  <p>{card.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 8 — HOW IT WORKS ═══ */}
        <section id="journey">
          <div className="container">
            <div className="journey-intro">
              <div className="section-badge">The Process</div>
              <h2 className="section-title">How the <em>Blueprint Works</em></h2>
              <p className="body-text" style={{marginTop:'1rem'}}>From your first step to your commissioning moment — here is the path.</p>
            </div>
            <div className="journey-steps">
              {[
                {num:'01', title:'Take the Assessment', body:"Start with the free 5C Leadership Assessment to get your profile — your strongest dimension, your gap, and your next step."},
                {num:'02', title:'Apply & Align', body:"Sign up, take the assessment, and begin the Introduction module. Clarify your current season and enter the blueprint process with intentionality — not transactions."},
                {num:'03', title:'Build Through the 5Cs', body:"Move through each module — sequentially and intentionally. Individual pace or live cohort. Each C unlocks the next."},
                {num:'04', title:'Integrate & Apply', body:"Coaching sessions translate learning into real strategy — your business, your leadership structure, your Kingdom enterprise taking shape."},
                {num:'05', title:'Commission & Deploy', body:"Complete the blueprint. Receive your Certificate of Commissioning. Step into your assignment with clarity and authority."},
              ].map(step => (
                <div key={step.num} className="journey-step">
                  <div className="step-num">{step.num}</div>
                  <h4>{step.title}</h4>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 9 — MEET THE LEADER ═══ */}
        <section id="leader">
          <div className="container">
            <div className="leader-layout">
              <div>
                <img src="/images/will-meier.jpg" alt="Will Meier — Founder, Awakening Destiny Global" style={{width:'100%',borderRadius:'8px',display:'block'}} />
                <div style={{height:'4px',background:'#FDD20D',borderRadius:'0 0 8px 8px'}}></div>
              </div>
              <div className="leader-content">
                <div className="section-badge orange">About Your Guide</div>
                <h2>Will Meier</h2>
                <div className="leader-title">Kingdom Strategist · Leadership Architect · Business Consultant · Coach · Speaker</div>
                <p>Will Meier is the founder of Awakening Destiny Global — a Kingdom leadership development organization with one clear mandate: restore, align, and deploy. His assignment is not to build programs — it&apos;s to build people, who build nations.</p>
                <p>Operating with apostolic and prophetic grace, Will brings a rare integration of revelatory insight and strategic precision. His engineering background formed the systematic framework that undergirds the 5C Blueprint — not as an academic exercise, but as a battle-tested architecture for Kingdom leaders in every sphere of influence.</p>
                <p>He has served Kingdom entrepreneurs, intercessors, pastors, and executive leaders across nations — equipping them with the Word, spiritual gifts, prophetic insight, and the business acumen to build enterprises that endure beyond a single generation.</p>
                <div className="leader-credentials">
                  {['Apostolic Leader','Prophetic Voice','Business Consultant','Leadership Coach','Speaker','Founder, ADG'].map(c => (
                    <span key={c} className="cred-tag">{c}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ SECTION 10 — FAQ ═══ */}
        <section id="faq">
          <div className="container">
            <div className="section-badge">Common Questions</div>
            <h2 className="section-title">Clarity Before <em>You Commit</em></h2>
            <div className="faq-list">
              {[
                {q:"Is this a church program or a business program?", a:"It's neither — and it's both. The 5C Blueprint is a Kingdom framework, which means it integrates spiritual formation, biblical governance, and strategic business development into one cohesive system. You don't have to choose between the pulpit and the marketplace here. Both are addressed with equal depth and authority."},
                {q:"What if I'm not sure what my calling is yet?", a:"That's exactly why the first dimension is Calling. You don't need to arrive with certainty — you need to arrive with hunger. The process itself is designed to surface, clarify, and articulate the assignment you've already been given. Many leaders discover in this module what they've known in their spirit for years but never had language for."},
                {q:"Where do I start if I've never done anything like this?", a:"Start with the free 5C Leadership Assessment. It takes 10 minutes and gives you a clear picture of where you stand across all five dimensions. Your profile will tell you exactly where the Blueprint will have the greatest impact on your leadership."},
                {q:"What's the difference between Individual and Cohort?", a:"The Individual pathway gives you complete access to all modules at your own pace — ideal if your schedule is unpredictable or you prefer to move at the speed of your season. The Cohort pathway adds live coaching sessions, peer community, and real-time group engagement. Same Blueprint, different experience."},
                {q:"Is this only for leaders in ministry?", a:"No. The 5C Blueprint was specifically designed for the full spectrum of Kingdom leadership — business owners, corporate executives, nonprofit founders, creatives, educators, and ministry leaders alike. If you operate with influence and you carry a Kingdom assignment, this framework is for you."},
                {q:"What makes this different from other leadership programs?", a:"Most leadership programs are built on either academic theory or marketplace strategy. The 5C Blueprint is built on apostolic wisdom — it operates at the intersection of the supernatural and the strategic. The revelatory dimension is not an add-on; it's the engine. The result is a framework that transforms identity, not just skill-sets."},
                {q:"What is the investment?", a:"Individual access to the full 5C Leadership Blueprint is $149 — all five modules plus the bonus Commissioning module, personalized AI summaries, pre-and-post diagnostics, and a downloadable blueprint document. The Introduction module is always free. We also offer a 7-day satisfaction guarantee — if the Blueprint is not what you expected, email us for a full refund, no questions asked."},
              ].map((faq, fi) => (
                <div key={faq.q} className="faq-item" style={{cursor:'pointer'}} onClick={() => setOpenFaq(openFaq === fi ? null : fi)}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                    <h4 style={{flex:1}}>{faq.q}</h4>
                    <span style={{color:'#FDD20D', fontSize:'1.2rem', fontWeight:700, flexShrink:0, marginLeft:'1rem'}}>{openFaq === fi ? '−' : '+'}</span>
                  </div>
                  {openFaq === fi && <p style={{marginTop:'0.75rem'}}>{faq.a}</p>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ SECTION 11 — CLOSING CTA ═══ */}
        <section id="cta-close">
          <div className="container cta-inner">
            <div className="section-badge">Your Next Step</div>
            <h2 className="section-title">The Blueprint Is Already<br />Written on <em>Your Life.</em></h2>
            <div className="gold-line center"></div>
            <p className="body-text">
              You didn&apos;t land here by accident. Something in you recognizes what&apos;s being offered — not just a program, but a process. Not just training, but transformation. The 5C Blueprint is the framework that will help you read what God has already written on your life and build accordingly.
            </p>
            <div className="cta-dual">
              <a href="/login" className="btn-primary">Access the Course</a>
              <a href="/assessment" className="btn-gold-outline">Take the Free Assessment</a>
            </div>
            <span className="cta-subtext">The Introduction module is free. Start building your blueprint today.</span>
            <span className="cta-subtext" style={{marginTop:'0.5rem', fontSize:'0.75rem', opacity: 0.5}}>7-day satisfaction guarantee. If the Blueprint is not what you expected, email info@awakeningdestiny.global within 7 days for a full refund.</span>
          </div>
        </section>

        <div className="gold-divider"></div>

        {/* FOOTER */}
        <footer>
          <div className="container">
            <div className="footer-inner">
              <div className="footer-brand">Awakening Destiny <span>Global</span></div>
              <div className="footer-links">
                <a href="https://awakeningdestiny.global" target="_blank" rel="noopener noreferrer">Main Site</a>
                <a href="/assessment">Assessment</a>
                <a href="mailto:info@awakeningdestiny.global">Contact</a>
                <a href="#pillars">The 5Cs</a>
                <a href="/login">Access Course</a>
              </div>
            </div>
            <span className="footer-copy">© {new Date().getFullYear()} Awakening Destiny Global · 5cblueprint.awakeningdestiny.global · All rights reserved. All content, frameworks, materials, and AI tools are proprietary intellectual property of Awakening Destiny Global and may not be reproduced, distributed, or used without express written permission.</span>
          </div>
        </footer>

      </div>
    </>
  );
}

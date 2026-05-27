// pages/dashboard.js
import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { usePaymentStatus } from "../lib/usePaymentStatus";
import { supabase } from "../lib/supabase";
import { colors, fonts, radii, shadows, moduleAccents } from "../styles/tokens";
import { useIsMobile } from "../lib/useBreakpoint";
import { LockIcon, DashboardIcon } from "../components/Icons";
import Button from "../components/ui/Button";
import Card from "../components/ui/Card";

const modules = [
  { id: 0, title: "Introduction", subtitle: "Course Foundation", icon: "—", href: "/modules/introduction", free: true, timeEstimate: "~30 min" },
  { id: 1, title: "Calling", subtitle: "Potential (Purpose)", question: "Who was I designed to become?", icon: "1", href: "/modules/calling", timeEstimate: "~60 min" },
  { id: 2, title: "Connection", subtitle: "Identity (Relationships)", question: "Whose am I?", icon: "2", href: "/modules/connection", timeEstimate: "~60 min" },
  { id: 3, title: "Competency", subtitle: "Excellence (Credibility)", question: "Can I carry what I'm called to build?", icon: "3", href: "/modules/competency", timeEstimate: "~60 min" },
  { id: 4, title: "Capacity", subtitle: "Character (Sustainability)", question: "Can I sustain what I'm building?", icon: "4", href: "/modules/capacity", timeEstimate: "~60 min" },
  { id: 5, title: "Convergence", subtitle: "Sweet Spot (Impact)", question: "Am I operating in my sweet spot?", icon: "5", href: "/modules/convergence", timeEstimate: "~60 min" },
  { id: 6, title: "Commissioning", subtitle: "Bonus Module", icon: "+", href: "/modules/commissioning", bonus: true, timeEstimate: "~45 min" },
];

const accents = moduleAccents;
const TOTAL_STEPS = { 0: 7, 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8 };

function Sidebar({ currentPage, setCurrentPage, open, onClose, paid }) {
  const isMobile = useIsMobile();

  const navItems = [
    { key: "dashboard", label: "Dashboard", icon: null, isDash: true },
    { key: "mod-0", label: "Introduction", icon: "—", href: "/modules/introduction", locked: false },
    { key: "mod-1", label: "1. Calling", icon: "1", href: "/modules/calling", locked: !paid },
    { key: "mod-2", label: "2. Connection", icon: "2", href: "/modules/connection", locked: !paid },
    { key: "mod-3", label: "3. Competency", icon: "3", href: "/modules/competency", locked: !paid },
    { key: "mod-4", label: "4. Capacity", icon: "4", href: "/modules/capacity", locked: !paid },
    { key: "mid-journey", label: "Mid-Journey Blueprint", icon: "◈", href: "/mid-journey-report", locked: !paid },
    { key: "mod-5", label: "5. Convergence", icon: "5", href: "/modules/convergence", locked: !paid },
    { key: "mod-6", label: "Commissioning", icon: "+", href: "/modules/commissioning", locked: !paid },
    { key: "final-blueprint", label: "Final Blueprint", icon: "★", href: "/final-blueprint", locked: !paid },
  ];

  return (
    <>
      {isMobile && open && (
        <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 49 }} />
      )}
      <div style={{ width: 260, minHeight: "100vh", background: colors.navy, flexShrink: 0, display: "flex", flexDirection: "column", ...(isMobile ? { position: "fixed", top: 0, left: 0, zIndex: 50, height: "100vh", overflowY: "auto", transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform 300ms ease" } : {}) }}>
        <div style={{ padding: "24px 16px 16px", borderBottom: "1px solid " + colors.navyMid, textAlign: "center" }}>
          <div style={{ fontSize: 14, color: colors.white, fontWeight: 700, marginBottom: 4 }}>5C Leadership Blueprint</div>
          <div style={{ fontSize: 11, color: colors.gold, fontStyle: "italic" }}>Awakening Destiny Global</div>
        </div>
        <div style={{ padding: "12px 0", flex: 1, overflowY: "auto" }}>
          {navItems.map(function(item) {
            var act = currentPage === item.key;
            return (
              <div key={item.key}
                onClick={function() {
                  if (item.locked) return;
                  if (item.href) { window.location.href = item.href; }
                  else { setCurrentPage(item.key); if (isMobile) onClose(); }
                }}
                style={{ padding: "10px 20px", cursor: item.locked ? "default" : "pointer", display: "flex", alignItems: "center", gap: 10, background: act ? colors.navyLight : "transparent", borderLeft: act ? "3px solid " + colors.gold : "3px solid transparent", opacity: item.locked ? 0.4 : 1, transition: "all 300ms ease" }}
                onMouseEnter={function(e) { if (!act && !item.locked) e.currentTarget.style.background = colors.navyLight; }}
                onMouseLeave={function(e) { if (!act && !item.locked) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontSize: 14, width: 22, textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", color: act ? colors.gold : colors.gray300 }}>
                  {item.locked ? <LockIcon size={14} color={colors.gray500} /> : item.isDash ? <DashboardIcon size={14} color={act ? colors.gold : colors.gray300} /> : <span style={{ fontWeight: 700, fontSize: 12 }}>{item.icon}</span>}
                </span>
                <span style={{ fontSize: 13, fontWeight: act ? 600 : 400, color: act ? colors.white : colors.gray300 }}>{item.label}</span>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "16px 20px", borderTop: "1px solid " + colors.navyMid, textAlign: "center" }}>
          <div style={{ fontSize: 11, color: colors.gray500 }}>From Design to Destiny</div>
        </div>
      </div>
    </>
  );
}

function ProgressBar({ percent, accent, height }) {
  return (
    <div style={{ width: "100%", height: height || 6, background: colors.navyMid, borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: percent + "%", height: "100%", background: accent || colors.gold, borderRadius: 4, transition: "width 300ms ease" }} />
    </div>
  );
}

async function handleCheckout(pathway) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const email = session?.user?.email;
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, pathway: pathway || 'individual' }),
    });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      alert('Checkout error: ' + (data.error || 'No URL returned'));
    }
  } catch (err) {
    console.error('Checkout error:', err);
    alert('Something went wrong: ' + err.message);
  }
}

function ReportCard({ type, unlocked, href }) {
  const isMidJourney = type === 'mid-journey';
  const label = isMidJourney ? 'MID-JOURNEY BLUEPRINT' : 'FINAL BLUEPRINT';
  const icon = isMidJourney ? '◈' : '★';
  const title = isMidJourney ? 'Formation Diagnostic' : 'Complete Formation Record';
  const subtitle = isMidJourney ? 'Prophetic-strategic formation report' : 'Your full 5C capstone document';
  const readyText = isMidJourney ? 'Your personalized report is ready.' : 'Your capstone document is ready.';
  const lockedText = isMidJourney ? 'Unlocks after Capacity.' : 'Unlocks after Commissioning.';

  return (
    <Card
      variant={unlocked ? "accent" : "default"}
      onClick={unlocked ? function() { window.location.href = href; } : undefined}
      style={{ opacity: unlocked ? 1 : 0.5, position: "relative", borderLeft: unlocked ? "3px solid " + colors.gold : undefined }}
    >
      {!unlocked && (
        <div style={{ position: "absolute", top: 12, right: 12, fontSize: 11, color: colors.gray500, fontWeight: 600, letterSpacing: "0.08em" }}>LOCKED</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(253,210,13,0.15)", border: "1px solid rgba(253,210,13,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: colors.gold, flexShrink: 0 }}>{icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, color: colors.gold, letterSpacing: "0.1em", fontWeight: 600, marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: colors.cream }}>{title}</div>
          <div style={{ fontSize: 12, color: colors.gray300, fontStyle: "italic" }}>{subtitle}</div>
        </div>
      </div>
      <div style={{ borderTop: "1px solid " + colors.navyMid, paddingTop: 10 }}>
        <div style={{ fontSize: 13, color: unlocked ? colors.gold : colors.gray500, fontStyle: "italic", fontFamily: fonts.heading }}>
          {unlocked ? readyText : lockedText}
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [page, setPage] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { paid, loading } = usePaymentStatus();
  const [bannerDismissed, setBannerDismissed] = useState(
    typeof window !== 'undefined' && !!localStorage.getItem('adg_banner_dismissed')
  );

  useEffect(() => {
    async function checkAuth() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { router.push('/login'); }
      } catch (e) { router.push('/login'); }
    }
    checkAuth();
  }, []);

  useEffect(() => {
    const session_id = router.query.session_id;
    if (!session_id) return;
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ session_id }),
    }).then(() => { window.location.href = '/dashboard'; }).catch(() => {});
  }, [router.query.session_id]);

  const [firstName, setFirstName] = useState("");
  useEffect(() => {
    async function loadName() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const meta = session.user.user_metadata;
          if (meta?.first_name) {
            setFirstName(meta.first_name);
          } else if (meta?.full_name) {
            setFirstName(meta.full_name.split(" ")[0]);
          } else {
            const { data } = await supabase
              .from("user_profiles")
              .select("full_name")
              .eq("id", session.user.id)
              .single();
            if (data?.full_name) setFirstName(data.full_name.split(" ")[0]);
          }
        }
      } catch (e) { }
    }
    loadName();
  }, []);

  var assessHistState = useState([]);
  var assessHist = assessHistState[0];
  var setAssessHist = assessHistState[1];
  useEffect(() => {
    async function loadAssessHistory() {
      try {
        var { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        var aResult = await supabase
          .from("assessments")
          .select("id, total_score, max_possible, dimension_scores, taken_at")
          .eq("user_id", session.user.id)
          .order("taken_at", { ascending: false })
          .limit(5);
        if (aResult.data) setAssessHist(aResult.data);
      } catch (e) { }
    }
    loadAssessHistory();
  }, []);

  const [progress, setProgress] = useState({});
  useEffect(() => {
    async function loadProgress() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) return;
        const { data } = await supabase
          .from("user_progress")
          .select("module_id, current_step")
          .eq("user_id", session.user.id);
        if (data) {
          const map = {};
          data.forEach(function(row) { map[row.module_id] = row.current_step; });
          setProgress(map);
        }
      } catch (e) { }
    }
    loadProgress();
  }, []);

  var totalSteps = 0;
  var completedSteps = 0;
  modules.forEach(function(m) {
    var total = TOTAL_STEPS[m.id] || 8;
    totalSteps += total;
    var done = progress[m.id] || 0;
    completedSteps += done === 0 ? 0 : Math.min(done + 1, total);
  });
  var overallPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;
  var greeting = firstName ? ("Welcome back, " + firstName) : "Welcome";

  var midJourneyUnlocked = paid && (progress[4] || 0) >= 7;
  var finalBlueprintUnlocked = paid && (progress[6] || 0) >= 7;

  var gridItems = [
    { type: 'module', data: modules[0] },
    { type: 'module', data: modules[1] },
    { type: 'module', data: modules[2] },
    { type: 'module', data: modules[3] },
    { type: 'module', data: modules[4] },
    { type: 'report', reportType: 'mid-journey', unlocked: midJourneyUnlocked, href: '/mid-journey-report' },
    { type: 'module', data: modules[5] },
    { type: 'module', data: modules[6] },
    { type: 'report', reportType: 'final-blueprint', unlocked: finalBlueprintUnlocked, href: '/final-blueprint' },
  ];

  return (
    <>
      <Head>
        <title>Dashboard | 5C Leadership Blueprint</title>
        <meta name="description" content="Track your leadership formation journey across all five dimensions of the Blueprint." />
        <meta property="og:title" content="Dashboard | 5C Leadership Blueprint" />
        <meta property="og:description" content="Track your leadership formation journey across all five dimensions of the Blueprint." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://5cblueprint.awakeningdestiny.global/dashboard" />
        <meta property="og:site_name" content="5C Leadership Blueprint" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Dashboard | 5C Leadership Blueprint" />
        <meta name="twitter:description" content="Track your leadership formation journey across all five dimensions of the Blueprint." />
      </Head>
      <div style={{ display: "flex", minHeight: "100vh", fontFamily: fonts.body, background: colors.navy }}>

        <Sidebar
          currentPage={page}
          setCurrentPage={setPage}
          open={sidebarOpen}
          onClose={function() { setSidebarOpen(false); }}
          paid={paid}
        />

        <div style={{ flex: 1, minHeight: "100vh", overflowY: "auto" }}>

          {/* ─── TOPBAR ─── */}
          <div style={{ padding: isMobile ? "10px 16px" : "12px 40px", borderBottom: "1px solid " + colors.navyMid, background: colors.navyLight, display: "flex", alignItems: "center", gap: 12, position: "sticky", top: 0, zIndex: 30 }}>
            {isMobile && (
              <button onClick={function() { setSidebarOpen(function(s) { return !s; }); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ width: 22, height: 2, background: colors.gold, borderRadius: 2 }} />
                <div style={{ width: 22, height: 2, background: colors.gold, borderRadius: 2 }} />
                <div style={{ width: 22, height: 2, background: colors.gold, borderRadius: 2 }} />
              </button>
            )}
            <div style={{ fontSize: 13, color: colors.gray300 }}>Dashboard</div>
          </div>

          <div style={{ padding: isMobile ? "20px 16px" : "32px 40px", maxWidth: 960 }}>

            {/* ─── EARLY ACCESS BANNER ─── */}
            {!bannerDismissed && (
              <div style={{ background: "rgba(253,210,13,0.08)", border: "1px solid rgba(253,210,13,0.25)", borderRadius: 12, padding: "14px 20px", marginBottom: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>🚀</span>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: colors.gold }}>Early Access Launch — </span>
                    <span style={{ fontSize: 13, color: colors.gray300 }}>We just launched. If you encounter anything unexpected, email </span>
                    <a href="mailto:info@awakeningdestiny.global" style={{ fontSize: 13, color: colors.gold }}>info@awakeningdestiny.global</a>
                    <span style={{ fontSize: 13, color: colors.gray300 }}> and we will make it right.</span>
                  </div>
                </div>
                <button
                  onClick={function() {
                    localStorage.setItem('adg_banner_dismissed', '1');
                    setBannerDismissed(true);
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: colors.gray500, fontSize: 20, flexShrink: 0, padding: 0, lineHeight: 1 }}>×
                </button>
              </div>
            )}

            {/* ─── GREETING + PROGRESS ─── */}
            <h1 style={{ fontFamily: fonts.heading, fontSize: 28, fontWeight: 700, color: colors.cream, margin: "0 0 4px" }}>{greeting}</h1>
            <p style={{ fontSize: 14, color: colors.gray300, margin: "0 0 20px", fontStyle: "italic" }}>Your leadership formation journey — from design to destiny.</p>

            <Card style={{ marginBottom: 28 }} padding="16px 20px">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: colors.cream }}>Overall Progress</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.gold }}>{overallPercent}%</span>
              </div>
              <ProgressBar percent={overallPercent} accent={colors.gold} height={8} />
            </Card>

            {/* ─── START HERE / CONTINUE ─── */}
            {(function() {
              var nextMod = null;
              for (var mi = 0; mi < modules.length; mi++) {
                var m = modules[mi];
                if (m.id === 6) continue;
                var locked = !m.free && !paid;
                if (locked) continue;
                var stepsDone = progress[m.id] || 0;
                var stepsTotal = TOTAL_STEPS[m.id] || 8;
                var pct = stepsDone === 0 ? 0 : Math.min(Math.round(((stepsDone + 1) / stepsTotal) * 100), 100);
                if (pct < 100) { nextMod = { mod: m, percent: pct, index: mi }; break; }
              }
              if (!nextMod) return null;
              var isFirstTime = !progress[0];
              var nm = nextMod.mod;
              return (
                <Card variant="highlight" style={{ marginBottom: 24, textAlign: isFirstTime ? "center" : "left" }} padding={24}>
                  <div style={{ fontSize: 11, color: colors.gold, letterSpacing: "0.1em", fontWeight: 600, marginBottom: 6 }}>{isFirstTime ? "START HERE" : "CONTINUE"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: colors.cream, marginBottom: 4, fontFamily: fonts.heading }}>
                    {isFirstTime ? "Begin with the Introduction" : nm.title + (nextMod.percent > 0 ? " — " + nextMod.percent + "% complete" : "")}
                  </div>
                  <div style={{ fontSize: 13, color: colors.gray300, marginBottom: 16 }}>
                    {isFirstTime ? "Understand the framework before entering the modules." : (nm.question || nm.subtitle)}
                  </div>
                  {!isFirstTime && nextMod.percent > 0 && (
                    <div style={{ marginBottom: 16 }}><ProgressBar percent={nextMod.percent} accent={colors.gold} height={6} /></div>
                  )}
                  <Button onClick={function() { window.location.href = nm.href; }}>
                    {isFirstTime ? "Begin" : nextMod.percent > 0 ? "Continue" : "Start"}
                  </Button>
                </Card>
              );
            })()}

            {/* ─── ASSESSMENT HISTORY ─── */}
            {assessHist.length > 0 && (
              <Card style={{ marginBottom: 24 }} padding="20px 24px">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: colors.cream }}>Assessment History</span>
                  <a href="/assessment" style={{ fontSize: 12, color: colors.gold, textDecoration: "none" }}>Retake →</a>
                </div>
                {assessHist.map(function(a, i) {
                  var pct = Math.round((a.total_score / (a.max_possible || 125)) * 100);
                  var date = new Date(a.taken_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  var dims = ["calling", "connection", "competency", "capacity", "convergence"];
                  var scores = a.dimension_scores || {};
                  return (
                    <div key={a.id} style={{ marginBottom: i < assessHist.length - 1 ? 12 : 0, paddingBottom: i < assessHist.length - 1 ? 12 : 0, borderBottom: i < assessHist.length - 1 ? "1px solid " + colors.navyMid : "none" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: colors.gray300 }}>{date}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.cream }}>{a.total_score}/125 <span style={{ fontSize: 11, color: colors.gold, fontWeight: 600 }}>({pct}%)</span></span>
                      </div>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {dims.map(function(d) {
                          var s = scores[d] || 0;
                          return (
                            <div key={d} style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: colors.navyMid, border: "1px solid rgba(253,210,13,0.15)", color: colors.gray300 }}>
                              {d.charAt(0).toUpperCase() + d.slice(1)}: <span style={{ fontWeight: 700, color: colors.gold }}>{s}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </Card>
            )}

            {/* ─── MARKETING / UNLOCK CTA ─── */}
            {!paid && !loading && (
              <Card variant="highlight" style={{ marginBottom: 28, background: "linear-gradient(135deg, #021A35 0%, #0a2a4d 100%)" }} padding={isMobile ? 20 : 28}>
                <div style={{ fontSize: 11, color: colors.gold, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10 }}>THE 5C LEADERSHIP BLUEPRINT</div>
                <div style={{ fontFamily: fonts.heading, fontSize: 22, fontWeight: 700, color: colors.white, lineHeight: 1.35, marginBottom: 12 }}>
                  Most leaders are overcommitted and underaligned. This training changes that.
                </div>
                <p style={{ fontSize: 13, color: colors.gray300, lineHeight: 1.7, margin: "0 0 10px" }}>
                  The 5C Blueprint is a formation experience — not a course. Five integrated dimensions that move you from scattered potential to focused, sustainable impact. Each module builds on the last. By the end, you will have a personalized leadership blueprint anchored in your calling, sharpened by honest self-assessment, and ready to deploy.
                </p>
                <p style={{ fontSize: 13, color: colors.gray300, lineHeight: 1.7, margin: "0 0 20px" }}>
                  Personalized summaries. Pre-and-post diagnostics that show your growth. A downloadable blueprint document you can revisit for years. Built for Kingdom entrepreneurs, pastors, prophetic voices, and emerging leaders who are done with surface-level development.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 20 }}>
                  {["Calling — Who you are", "Connection — Whose you are", "Competency — What you carry", "Capacity — What you sustain", "Convergence — Where it all aligns"].map(function(item, i) {
                    return (
                      <div key={i} style={{ fontSize: 12, padding: "5px 12px", background: "rgba(253,210,13,0.12)", border: "1px solid rgba(253,210,13,0.25)", borderRadius: 6, color: colors.gold, fontWeight: 500 }}>
                        {item}
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                  <Button onClick={() => handleCheckout('individual')} style={{ whiteSpace: "nowrap" }}>
                    Unlock Full Access — $149
                  </Button>
                  <span style={{ fontSize: 12, color: colors.gray500 }}>Introduction module is free. Full access unlocks all 5 modules + bonus Commissioning module.</span>
                </div>
                <p style={{ fontSize: 11, color: colors.gray500, marginTop: 10 }}>
                  7-day satisfaction guarantee. If the Blueprint is not what you expected, email <a href="mailto:info@awakeningdestiny.global" style={{ color: colors.gold }}>info@awakeningdestiny.global</a> within 7 days for a full refund — no questions asked.
                </p>
              </Card>
            )}

            {/* ─── UPGRADE PATH — visible to paid users ─── */}
            {paid && (
              <Card style={{ marginBottom: 28, background: "linear-gradient(135deg, #021A35 0%, #0a2a4d 100%)", border: "1px solid rgba(253,210,13,0.25)" }} padding={isMobile ? 20 : 28}>
                <div style={{ fontSize: 11, color: colors.gold, letterSpacing: "0.12em", fontWeight: 700, marginBottom: 10 }}>READY TO GO DEEPER?</div>
                <div style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, color: colors.white, lineHeight: 1.35, marginBottom: 10 }}>
                  Graduate to the Next Level
                </div>
                <p style={{ fontSize: 13, color: colors.gray300, lineHeight: 1.7, margin: "0 0 20px" }}>
                  The Self-Paced Blueprint is your foundation. When you are ready to go further — with direct access to Will, a cohort of aligned Kingdom leaders, or an intensive 21-day formation sprint — your next step is available.
                </p>
                <p style={{ fontSize: 12, color: colors.gold, fontStyle: "italic", margin: "0 0 20px", lineHeight: 1.6 }}>
                  Already completed Self-Paced? Your $149 investment applies as a credit toward either tier. Reach out directly to receive your personal upgrade code.
                </p>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <Button
                    onClick={() => window.location.href = '/called-to-carry/founders/apply'}
                    style={{ whiteSpace: "nowrap" }}>
                    Apply — Founders Cohort $997
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/called-to-carry/sprint/apply'}
                    style={{ whiteSpace: "nowrap" }}>
                    Apply — 21-Day Sprint $497
                  </Button>
                </div>
              </Card>
            )}

            {/* ─── MODULE + REPORT GRID ─── */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16, marginBottom: 24 }}>
              {gridItems.map(function(item, idx) {

                if (item.type === 'report') {
                  return (
                    <ReportCard
                      key={item.reportType}
                      type={item.reportType}
                      unlocked={item.unlocked}
                      href={item.href}
                    />
                  );
                }

                var m = item.data;
                var locked = !m.free && !paid;
                var stepsDone = progress[m.id] || 0;
                var stepsTotal = TOTAL_STEPS[m.id] || 8;
                var modPercent = stepsDone === 0 ? 0 : Math.min(Math.round(((stepsDone + 1) / stepsTotal) * 100), 100);
                return (
                  <Card key={m.id}
                    variant={locked ? "default" : "accent"}
                    onClick={locked ? undefined : function() { window.location.href = m.href; }}
                    style={{ opacity: locked ? 0.5 : 1, position: "relative" }}>
                    {locked && (
                      <div style={{ position: "absolute", top: 12, right: 12, fontSize: 11, color: colors.gray500, fontWeight: 600, letterSpacing: "0.08em" }}>LOCKED</div>
                    )}
                    {m.bonus && !locked && (
                      <div style={{ position: "absolute", top: 12, right: 12, fontSize: 10, fontWeight: 700, background: colors.gold, color: colors.navy, padding: "2px 8px", borderRadius: 4, letterSpacing: "0.08em" }}>BONUS</div>
                    )}
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: "rgba(253,210,13,0.1)", border: "1px solid rgba(253,210,13,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, color: colors.gold, flexShrink: 0 }}>{m.id === 0 ? "—" : m.id === 6 ? "+" : m.id}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: colors.cream }}>{m.title}</div>
                        <div style={{ fontSize: 12, color: colors.gray300, fontStyle: "italic" }}>{m.subtitle}</div>
                        <div style={{ fontSize: 11, color: colors.gray500, marginTop: 2 }}>{m.timeEstimate}</div>
                      </div>
                    </div>
                    {!locked && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 11, color: colors.gray300 }}>{modPercent === 100 ? "Complete" : modPercent > 0 ? "In progress" : "Not started"}</span>
                          <span style={{ fontSize: 11, fontWeight: 600, color: colors.gold }}>{modPercent}%</span>
                        </div>
                        <ProgressBar percent={modPercent} accent={colors.gold} height={4} />
                      </div>
                    )}
                    {m.question && (
                      <div style={{ fontSize: 13, color: colors.gold, fontStyle: "italic", fontFamily: fonts.heading, borderTop: "1px solid " + colors.navyMid, paddingTop: 10 }}>{m.question}</div>
                    )}
                  </Card>
                );
              })}
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
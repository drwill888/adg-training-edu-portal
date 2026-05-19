// pages/admin.js
// Admin dashboard — locked to Will's email only
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { colors as tok } from "../styles/tokens";
import AdminNav from "../components/AdminNav";

var NAVY = tok.navy;
var GOLD = tok.gold;
var GOLD_BRIGHT = tok.gold;

var MODULE_NAMES = ["Introduction", "Calling", "Connection", "Competency", "Capacity", "Convergence", "Commissioning"];
var ADMIN_EMAIL = "meier.will@gmail.com";
var TOTAL_STEPS = { 0: 9, 1: 11, 2: 11, 3: 11, 4: 11, 5: 11, 6: 8 };
var ACCENT_COLORS = [tok.gold, tok.skyBlue, tok.royalBlue, tok.orange, tok.skyBlue, tok.red, tok.gold];
var DIMENSIONS = ["calling", "connection", "competency", "capacity", "convergence"];

var TIER_COLORS = { "self-paced": "#0172BC", "founders": "#C8A951", "sprint": "#EE3124", "scholarship": "#16a34a" };
var TIER_LABELS = { "self-paced": "Self-Paced $149", "founders": "Founders $997", "sprint": "Sprint $497", "scholarship": "Scholarship" };

function inferTier(payment) {
  if (payment.tier && payment.tier !== "self-paced") return payment.tier;
  var amt = payment.amount || 0;
  if (amt >= 99700) return "founders";
  if (amt >= 49700) return "sprint";
  if (amt >= 14900) return "self-paced";
  return "scholarship";
}

// Case-insensitive email match
function emailMatch(a, b) {
  if (!a || !b) return false;
  return a.toLowerCase().trim() === b.toLowerCase().trim();
}

// Format archetype_id: "apostolic_builder" → "Apostolic Builder"
function formatArchetype(str) {
  if (!str) return "—";
  return str.replace(/_/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
}

export default function AdminDashboard() {
  var authState = useState(null); var user = authState[0]; var setUser = authState[1];
  var loadingState = useState(true); var loading = loadingState[0]; var setLoading = loadingState[1];
  var paymentsState = useState([]); var payments = paymentsState[0]; var setPayments = paymentsState[1];
  var progressState = useState([]); var progress = progressState[0]; var setProgress = progressState[1];
  var profilesState = useState([]); var profiles = profilesState[0]; var setProfiles = profilesState[1];
  var assessmentsState = useState([]); var assessments = assessmentsState[0]; var setAssessments = assessmentsState[1];
  var applicationsState = useState([]); var applications = applicationsState[0]; var setApplications = applicationsState[1];
  var submissionsState = useState([]); var submissions = submissionsState[0]; var setSubmissions = submissionsState[1];
  var tabState = useState("overview"); var tab = tabState[0]; var setTab = tabState[1];
  var sendEmailState = useState({ email: "", name: "", status: "" }); var sendEmail = sendEmailState[0]; var setSendEmail = sendEmailState[1];
  var resendingState = useState(null); var resending = resendingState[0]; var setResending = resendingState[1];
  var resendPaymentState = useState(null); var resendingPayment = resendPaymentState[0]; var setResendingPayment = resendPaymentState[1];

  useEffect(function() {
    async function checkAuth() {
      var result = await supabase.auth.getSession();
      var session = result.data.session;
      if (session && session.user) setUser(session.user);
      setLoading(false);
    }
    checkAuth();
  }, []);

  useEffect(function() {
    if (!user || user.email !== ADMIN_EMAIL) return;
    async function loadData() {
      var payResult = await supabase.from("payments").select("*").order("created_at", { ascending: false });
      if (payResult.data) setPayments(payResult.data);
      var progResult = await supabase.from("user_progress").select("*").order("updated_at", { ascending: false });
      if (progResult.data) setProgress(progResult.data);
      var profilesResult = await supabase.from("user_profiles").select("id, full_name, email");
      if (profilesResult.data) setProfiles(profilesResult.data);
      var assessResult = await supabase.from("assessments").select("*").order("taken_at", { ascending: false });
      if (assessResult.data) setAssessments(assessResult.data);
      var appResult = await supabase.from("cohort_applications").select("*").order("created_at", { ascending: false });
      if (appResult.data) setApplications(appResult.data);
      var subResult = await supabase.from("called_to_carry_submissions").select("*").order("created_at", { ascending: false });
      if (subResult.data) setSubmissions(subResult.data);
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAFAF8" }}>
        <p style={{ color: "#999", fontSize: 14 }}>Loading...</p>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: NAVY, fontFamily: "'Outfit', sans-serif" }}>
        <div style={{ textAlign: "center", padding: 40 }}>
          <div style={{ fontSize: 11, color: GOLD_BRIGHT, letterSpacing: "0.15em", fontWeight: 700, marginBottom: 16 }}>RESTRICTED</div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", color: "#FDF8F0", fontSize: "1.8rem", marginBottom: 12 }}>Admin Access Only</h1>
          <p style={{ color: "#9ca3af", fontSize: 14, marginBottom: 24 }}>You must be logged in as the administrator to view this page.</p>
          <a href="/dashboard" style={{ color: GOLD_BRIGHT, fontSize: 14 }}>← Back to Dashboard</a>
        </div>
      </div>
    );
  }

  // Stats
  var totalRevenue = payments.reduce(function(sum, p) { return sum + (p.amount || 0); }, 0) / 100;
  var uniqueUserIds = [];
  progress.forEach(function(p) { if (uniqueUserIds.indexOf(p.user_id) === -1) uniqueUserIds.push(p.user_id); });
  var totalUsers = profiles.length > 0 ? profiles.length : uniqueUserIds.length;

  var selfPacedPay = payments.filter(function(p) { return inferTier(p) === "self-paced"; });
  var foundersPay  = payments.filter(function(p) { return inferTier(p) === "founders"; });
  var sprintPay    = payments.filter(function(p) { return inferTier(p) === "sprint"; });
  var scholarPay   = payments.filter(function(p) { return inferTier(p) === "scholarship"; });

  var selfPacedRev = selfPacedPay.reduce(function(s,p){return s+(p.amount||0);},0)/100;
  var foundersRev  = foundersPay.reduce(function(s,p){return s+(p.amount||0);},0)/100;
  var sprintRev    = sprintPay.reduce(function(s,p){return s+(p.amount||0);},0)/100;

  var pendingApps  = applications.filter(function(a){return a.status==="pending";}).length;
  var approvedApps = applications.filter(function(a){return a.status==="approved";}).length;

  // Email lookup — profiles first, payments as fallback
  function emailFor(userId) {
    var profile = profiles.find(function(p) { return p.id === userId; });
    if (profile && profile.email) return profile.email;
    if (profile && profile.full_name) return profile.full_name;
    return userId.slice(0, 8) + "…";
  }

  function getUserProgress(userId) {
    var userProg = progress.filter(function(p) { return p.user_id === userId; });
    var mods = {};
    userProg.forEach(function(p) {
      mods[p.module_id] = { step: p.current_step || 0, hasCommitments: p.commitments && Object.keys(p.commitments).length > 0, hasSummary: !!p.ai_summary };
    });
    return mods;
  }

  function getStepLabel(stepNum) {
    var labels = ["Activation", "Pre-Check", "Teaching", "Exemplar", "Stages", "Post-Check", "Commitment", "Blueprint"];
    return labels[stepNum] || ("Step " + stepNum);
  }

  function exportCSV() {
    var rows = [["Email", "Module", "Current Step", "Has Commitments", "Has Blueprint", "Last Updated"]];
    progress.forEach(function(p) {
      rows.push([emailFor(p.user_id), MODULE_NAMES[p.module_id] || "Module " + p.module_id, getStepLabel(p.current_step || 0), p.commitments && Object.keys(p.commitments).length > 0 ? "Yes" : "No", !!p.ai_summary ? "Yes" : "No", p.updated_at ? new Date(p.updated_at).toLocaleDateString() : ""]);
    });
    var csv = rows.map(function(r) { return r.join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = "5c-blueprint-progress-" + new Date().toISOString().split("T")[0] + ".csv"; a.click(); URL.revokeObjectURL(url);
  }

  async function sendLoginEmail(email, name) {
    if (!email || !name) return;
    setResending(email);
    try {
      var res = await fetch("/api/send-magic-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      });
      var json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to send");
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      setResending(null);
    }
  }

  async function resendPaymentLink(applicationId) {
    setResendingPayment(applicationId);
    try {
      var { data: s } = await supabase.auth.getSession();
      var token = s.session ? s.session.access_token : "";
      var res = await fetch("/api/admin/resend-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ applicationId }),
      });
      var json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed");
      alert("Fresh payment link sent to " + json.email);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setResendingPayment(null);
    }
  }

  async function handleSendEmail() {
    if (!sendEmail.email || !sendEmail.name) {
      setSendEmail(function(s) { return { ...s, status: "error:Email and name are required." }; });
      return;
    }
    setSendEmail(function(s) { return { ...s, status: "sending" }; });
    var result = await sendLoginEmail(sendEmail.email, sendEmail.name);
    if (result.ok) {
      setSendEmail({ email: "", name: "", status: "sent" });
    } else {
      setSendEmail(function(s) { return { ...s, status: "error:" + result.error }; });
    }
  }

  function exportPaymentsCSV() {
    var rows = [["Email", "Tier", "Amount", "Status", "Stripe Session", "Date"]];
    payments.forEach(function(p) {
      rows.push([p.email, TIER_LABELS[inferTier(p)] || inferTier(p), "$" + ((p.amount || 0) / 100).toFixed(2), p.status, p.stripe_session_id || "", p.created_at ? new Date(p.created_at).toLocaleDateString() : ""]);
    });
    var csv = rows.map(function(r) { return r.join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = "5c-blueprint-payments-" + new Date().toISOString().split("T")[0] + ".csv"; a.click(); URL.revokeObjectURL(url);
  }

  function exportApplicationsCSV() {
    var rows = [["Name", "Email", "Tier", "Status", "Applied", "Why Now"]];
    applications.forEach(function(a) {
      rows.push([a.first_name + " " + a.last_name, a.email, a.tier, a.status, a.created_at ? new Date(a.created_at).toLocaleDateString() : "", (a.why_now || "").replace(/,/g, ";")]);
    });
    var csv = rows.map(function(r) { return r.join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = "5c-applications-" + new Date().toISOString().split("T")[0] + ".csv"; a.click(); URL.revokeObjectURL(url);
  }

  function exportSubmissionsCSV() {
    var rows = [["Name", "Email", "Office", "Overlay", "Archetype", "Paid", "Tier", "Applied", "Date"]];
    submissions.forEach(function(s) {
      var payment = payments.find(function(p) { return emailMatch(p.email, s.email) && p.status === "completed"; });
      var application = applications.find(function(a) { return emailMatch(a.email, s.email); });
      rows.push([s.first_name, s.email, s.office || "", s.overlay || "", s.archetype_id || "", payment ? "Yes" : "No", payment ? (TIER_LABELS[inferTier(payment)] || inferTier(payment)) : "Free", application ? application.tier + " — " + application.status : "No", s.created_at ? new Date(s.created_at).toLocaleDateString() : ""]);
    });
    var csv = rows.map(function(r) { return r.join(","); }).join("\n");
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob); var a = document.createElement("a");
    a.href = url; a.download = "called-to-carry-submissions-" + new Date().toISOString().split("T")[0] + ".csv"; a.click(); URL.revokeObjectURL(url);
  }

  return (
    <div style={{ minHeight: "100vh", background: tok.cream, fontFamily: "'Outfit', sans-serif" }}>
      <AdminNav />

      {/* Header */}
      <div style={{ background: NAVY, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>5C Blueprint — Admin</div>
          <div style={{ fontSize: 11, color: GOLD, fontStyle: "italic" }}>Awakening Destiny Global</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <a href="https://adg-admin-tools.vercel.app/email"
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#fff", textDecoration: "none", background: "#0f3d6e", borderRadius: 4, padding: "4px 10px", letterSpacing: "0.08em", fontWeight: 600 }}>
            ✉ EMAIL
          </a>
          <a href="https://adg-admin-tools.vercel.app/sms"
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#fff", textDecoration: "none", background: "#0f3d6e", borderRadius: 4, padding: "4px 10px", letterSpacing: "0.08em", fontWeight: 600 }}>
            📱 SMS
          </a>
          <a href="https://adg-admin-tools.vercel.app/dashboard"
            target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: GOLD, textDecoration: "none", border: "1px solid " + GOLD, borderRadius: 4, padding: "4px 10px", letterSpacing: "0.08em", fontWeight: 600 }}>
            ↗ ALL TOOLS
          </a>
          <a href="/" style={{ fontSize: 13, color: GOLD, textDecoration: "none", marginLeft: 8 }}>← Dashboard</a>
        </div>
      </div>

      {/* Summary Cards Row 1 */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 16 }}>
          {[
            { label: "Total Students", value: totalUsers, color: GOLD },
            { label: "Total Revenue", value: "$" + totalRevenue.toFixed(2), color: "#0172BC" },
            { label: "10-Q Submissions", value: submissions.length, color: "#0172BC" },
            { label: "Assessments", value: assessments.length, color: "#EE3124" },
            { label: "Pending Apps", value: pendingApps, color: pendingApps > 0 ? "#F47722" : "#888" },
          ].map(function(card) {
            return (
              <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb", borderTop: "3px solid " + card.color }}>
                <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>{card.label}</div>
                <div style={{ fontSize: 32, fontWeight: 700, color: NAVY }}>{card.value}</div>
              </div>
            );
          })}
        </div>

        {/* Tier Cards Row 2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 16 }}>
          {[
            { label: "Self-Paced", sublabel: "$149", count: selfPacedPay.length, rev: selfPacedRev, color: TIER_COLORS["self-paced"] },
            { label: "Founders Cohort", sublabel: "$997", count: foundersPay.length, rev: foundersRev, color: TIER_COLORS["founders"] },
            { label: "21-Day Sprint", sublabel: "$497", count: sprintPay.length, rev: sprintRev, color: TIER_COLORS["sprint"] },
            { label: "Scholarships", sublabel: "discounted", count: scholarPay.length, rev: 0, color: TIER_COLORS["scholarship"] },
          ].map(function(card) {
            return (
              <div key={card.label} style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", border: "1px solid #e5e7eb", borderLeft: "4px solid " + card.color }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>{card.label}</div>
                    <div style={{ fontSize: 11, color: card.color, fontWeight: 600, marginBottom: 6 }}>{card.sublabel}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>{card.count}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>students</div>
                  </div>
                  {card.rev > 0 && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#888", marginBottom: 2 }}>Revenue</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: card.color }}>${card.rev.toFixed(0)}</div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Send Login Email */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "8px 24px 0" }}>
        <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 12, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 10 }}>Send Login Email</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
            <input
              placeholder="First name"
              value={sendEmail.name}
              onChange={function(e) { setSendEmail(function(s) { return { ...s, name: e.target.value, status: "" }; }); }}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 160, outline: "none" }}
            />
            <input
              placeholder="Email address"
              value={sendEmail.email}
              onChange={function(e) { setSendEmail(function(s) { return { ...s, email: e.target.value, status: "" }; }); }}
              style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 13, width: 240, outline: "none" }}
            />
            <button
              onClick={handleSendEmail}
              disabled={sendEmail.status === "sending"}
              style={{ padding: "8px 18px", background: NAVY, color: GOLD_BRIGHT, border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: sendEmail.status === "sending" ? 0.6 : 1 }}
            >
              {sendEmail.status === "sending" ? "Sending…" : "Send"}
            </button>
            {sendEmail.status === "sent" && <span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>✓ Sent!</span>}
            {sendEmail.status.startsWith("error:") && <span style={{ fontSize: 13, color: "#dc2626" }}>{sendEmail.status.slice(6)}</span>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "8px 24px" }}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["overview", "funnel", "payments", "applications", "progress", "analytics"].map(function(t) {
            var badge = t === "applications" && pendingApps > 0 ? pendingApps : null;
            var funnelBadge = t === "funnel" && submissions.length > 0 ? submissions.length : null;
            var activeBadge = badge || funnelBadge;
            return (
              <button key={t} onClick={function() { setTab(t); }}
                style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", background: tab === t ? NAVY : "transparent", color: tab === t ? GOLD_BRIGHT : "#888", border: tab === t ? "none" : "1px solid #e5e7eb", position: "relative" }}>
                {t === "funnel" ? "Called to Carry" : t.charAt(0).toUpperCase() + t.slice(1)}
                {activeBadge && (
                  <span style={{ position: "absolute", top: -6, right: -6, background: t === "funnel" ? "#0172BC" : "#EE3124", color: "#fff", borderRadius: "50%", width: 18, height: 18, fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {activeBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "16px 24px 48px" }}>

        {/* Overview */}
        {tab === "overview" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>User Progress Overview</h2>
              <button onClick={exportCSV} style={{ padding: "8px 16px", background: NAVY, color: GOLD_BRIGHT, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↓ Export CSV</button>
            </div>
            {uniqueUserIds.length === 0 && <p style={{ color: "#888", fontSize: 14, padding: 24, textAlign: "center" }}>No user progress data yet.</p>}
            {uniqueUserIds.map(function(userId) {
              var userMods = getUserProgress(userId);
              var userEmail = emailFor(userId);
              var userPayment = payments.find(function(p) { return emailMatch(p.email, userEmail) && p.status === "completed"; });
              var isPaid = !!userPayment;
              var tier = userPayment ? inferTier(userPayment) : null;
              return (
                <div key={userId} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb", marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{userEmail}</div>
                        <div style={{ fontSize: 12, color: isPaid ? "#16a34a" : "#888" }}>{isPaid ? "Paid" : "Free tier"}</div>
                      </div>
                      {tier && (
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, background: TIER_COLORS[tier] + "22", color: TIER_COLORS[tier], border: "1px solid " + TIER_COLORS[tier] + "44" }}>
                          {TIER_LABELS[tier]}
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {MODULE_NAMES.map(function(name, idx) {
                      var mod = userMods[idx];
                      var stepNum = mod ? mod.step : -1;
                      var completed = stepNum >= (TOTAL_STEPS[idx] || 10);
                      var inProgress = stepNum > 0 && stepNum < (TOTAL_STEPS[idx] || 10);
                      return (
                        <div key={idx} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: completed ? "#dcfce7" : inProgress ? "#FFF9E6" : "#f3f4f6", color: completed ? "#16a34a" : inProgress ? "#92400e" : "#9ca3af", border: "1px solid " + (completed ? "#bbf7d0" : inProgress ? "#fde68a" : "#e5e7eb") }}>
                          {name}{inProgress ? " (" + getStepLabel(stepNum) + ")" : completed ? " ✓" : ""}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Called to Carry Funnel */}
        {tab === "funnel" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>Called to Carry — 10-Q Funnel</h2>
              <button onClick={exportSubmissionsCSV} style={{ padding: "8px 16px", background: NAVY, color: GOLD_BRIGHT, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↓ Export CSV</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total Submissions", value: submissions.length, color: "#0172BC" },
                { label: "Free Only", value: submissions.filter(function(s) { return !payments.find(function(p) { return emailMatch(p.email, s.email) && p.status === "completed"; }); }).length, color: "#888" },
                { label: "Converted to Paid", value: submissions.filter(function(s) { return !!payments.find(function(p) { return emailMatch(p.email, s.email) && p.status === "completed"; }); }).length, color: "#16a34a" },
                { label: "Applied", value: submissions.filter(function(s) { return !!applications.find(function(a) { return emailMatch(a.email, s.email); }); }).length, color: GOLD },
              ].map(function(card) {
                return (
                  <div key={card.label} style={{ background: "#fff", borderRadius: 10, padding: "16px 20px", border: "1px solid #e5e7eb", borderTop: "3px solid " + card.color }}>
                    <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600, marginBottom: 4 }}>{card.label}</div>
                    <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>{card.value}</div>
                  </div>
                );
              })}
            </div>

            {submissions.length === 0 && <p style={{ color: "#888", fontSize: 14, padding: 24, textAlign: "center" }}>No 10-Q submissions yet.</p>}

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {submissions.map(function(s) {
                var payment = payments.find(function(p) { return emailMatch(p.email, s.email) && p.status === "completed"; });
                var application = applications.find(function(a) { return emailMatch(a.email, s.email); });
                var isPaid = !!payment;
                var tier = payment ? inferTier(payment) : null;
                var borderColor = isPaid ? "#16a34a" : application ? GOLD : "#e5e7eb";
                var archetypeLabel = s.custom_label ? s.custom_label : s.archetype_id ? formatArchetype(s.archetype_id) : (s.office && s.overlay) ? formatArchetype(s.office) + " " + formatArchetype(s.overlay) : "—";
                return (
                  <div key={s.id} style={{ background: "#fff", borderRadius: 12, padding: "18px 24px", border: "1px solid #e5e7eb", borderLeft: "4px solid " + borderColor }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 180 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{s.first_name}</div>
                        <div style={{ fontSize: 13, color: "#555" }}>{s.email}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>{new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 4 }}>Archetype</div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{archetypeLabel}</div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 12, background: isPaid ? "#dcfce7" : "#f3f4f6", color: isPaid ? "#16a34a" : "#888", border: "1px solid " + (isPaid ? "#bbf7d0" : "#e5e7eb") }}>
                          {isPaid ? "✓ Paid — " + (TIER_LABELS[tier] || tier) : "Free"}
                        </span>
                        {application && (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 12, background: application.status === "approved" ? "#dcfce7" : application.status === "paid" ? "#dbeafe" : "#FFF3CD", color: application.status === "approved" ? "#16a34a" : application.status === "paid" ? "#1d4ed8" : "#92400e", border: "1px solid " + (application.status === "approved" ? "#bbf7d0" : application.status === "paid" ? "#bfdbfe" : "#fde68a") }}>
                            {application.status === "approved" ? "✓ Approved" : application.status === "paid" ? "✓ Enrolled" : "⏳ Pending"} — {application.tier === "sprint" ? "Sprint" : "Founders"}
                          </span>
                        )}
                        <a href={"/called-to-carry/assessment/results/" + s.id} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: GOLD, fontWeight: 600, textDecoration: "none" }}>→ View Archetype Report</a>
                        <span style={{ fontSize: 11, color: "#0172BC", fontWeight: 600 }}>✉ Archetype email sent</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Payments */}
        {tab === "payments" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>Payment Records</h2>
              <button onClick={exportPaymentsCSV} style={{ padding: "8px 16px", background: NAVY, color: GOLD_BRIGHT, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↓ Export CSV</button>
            </div>
            {payments.length === 0 && <p style={{ color: "#888", fontSize: 14, padding: 24, textAlign: "center" }}>No payments recorded yet.</p>}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff", borderRadius: 12, overflow: "hidden" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["Email", "Tier", "Amount", "Status", "Date", ""].map(function(h) {
                      return <th key={h} style={{ padding: "12px 16px", fontSize: 12, fontWeight: 700, color: "#555", textAlign: "left", borderBottom: "1px solid #e5e7eb" }}>{h}</th>;
                    })}
                  </tr>
                </thead>
                <tbody>
                  {payments.map(function(p, i) {
                    var tier = inferTier(p);
                    var nameGuess = (p.email || "").split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, function(c) { return c.toUpperCase(); });
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: NAVY }}>{p.email}</td>
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, background: (TIER_COLORS[tier] || "#888") + "22", color: TIER_COLORS[tier] || "#888", border: "1px solid " + (TIER_COLORS[tier] || "#888") + "44" }}>
                            {TIER_LABELS[tier] || tier}
                          </span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 13, color: NAVY, fontWeight: 600 }}>${((p.amount || 0) / 100).toFixed(2)}</td>
                        <td style={{ padding: "12px 16px", fontSize: 12 }}>
                          <span style={{ padding: "3px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600, background: p.status === "completed" ? "#dcfce7" : "#fef9c3", color: p.status === "completed" ? "#16a34a" : "#92400e" }}>{p.status}</span>
                        </td>
                        <td style={{ padding: "12px 16px", fontSize: 12, color: "#888" }}>{p.created_at ? new Date(p.created_at).toLocaleDateString() : ""}</td>
                        <td style={{ padding: "8px 16px" }}>
                          <button
                            onClick={async function() {
                              var result = await sendLoginEmail(p.email, nameGuess);
                              alert(result.ok ? "Login email sent to " + p.email : "Error: " + result.error);
                            }}
                            disabled={resending === p.email}
                            style={{ padding: "5px 12px", background: "transparent", border: "1px solid #e5e7eb", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", color: NAVY, whiteSpace: "nowrap" }}
                          >
                            {resending === p.email ? "Sending…" : "Resend Login"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Applications */}
        {tab === "applications" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>
                Cohort Applications
                {pendingApps > 0 && <span style={{ marginLeft: 10, fontSize: 13, background: "#EE3124", color: "#fff", borderRadius: 12, padding: "2px 10px", fontFamily: "Outfit, sans-serif" }}>{pendingApps} pending</span>}
              </h2>
              <button onClick={exportApplicationsCSV} style={{ padding: "8px 16px", background: NAVY, color: GOLD_BRIGHT, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↓ Export CSV</button>
            </div>
            {applications.length === 0 && <p style={{ color: "#888", fontSize: 14, padding: 24, textAlign: "center" }}>No applications yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {applications.map(function(a) {
                var tierColor = a.tier === "sprint" ? TIER_COLORS["sprint"] : TIER_COLORS["founders"];
                var tierLabel = a.tier === "sprint" ? "21-Day Sprint" : "Founders Cohort";
                var statusColor = a.status === "approved" ? "#16a34a" : a.status === "pending" ? "#F47722" : "#888";
                return (
                  <div key={a.id} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb", borderLeft: "4px solid " + tierColor }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: NAVY }}>{a.first_name} {a.last_name}</div>
                        <div style={{ fontSize: 13, color: "#555" }}>{a.email}</div>
                        {a.phone && <div style={{ fontSize: 12, color: "#888" }}>{a.phone}</div>}
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 12, background: tierColor + "22", color: tierColor, border: "1px solid " + tierColor + "44" }}>{tierLabel}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 12px", borderRadius: 12, background: statusColor + "22", color: statusColor, border: "1px solid " + statusColor + "44" }}>{a.status}</span>
                        <span style={{ fontSize: 11, color: "#888" }}>{a.created_at ? new Date(a.created_at).toLocaleDateString() : ""}</span>
                      </div>
                    </div>
                    {a.why_now && (
                      <div style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px", border: "1px solid #f0f0f0" }}>
                        <div style={{ fontSize: 11, color: "#888", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Why Now</div>
                        <div style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>{a.why_now}</div>
                      </div>
                    )}
                    {a.business_or_ministry && <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}><span style={{ fontWeight: 600 }}>Building: </span>{a.business_or_ministry}</div>}
                    {a.archetype && <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}><span style={{ fontWeight: 600 }}>Archetype: </span>{formatArchetype(a.archetype)}</div>}
                    {a.approved_at && (
                      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: "#16a34a" }}>Approved {new Date(a.approved_at).toLocaleDateString()}</span>
                        {a.status === "approved" && (
                          <button
                            onClick={function() { resendPaymentLink(a.id); }}
                            disabled={resendingPayment === a.id}
                            style={{ padding: "5px 14px", background: "transparent", border: "1px solid #C8A951", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", color: "#92400e", whiteSpace: "nowrap" }}
                          >
                            {resendingPayment === a.id ? "Sending…" : "Resend Payment Link"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress */}
        {tab === "progress" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: NAVY }}>Detailed Progress</h2>
              <button onClick={exportCSV} style={{ padding: "8px 16px", background: NAVY, color: GOLD_BRIGHT, border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↓ Export CSV</button>
            </div>
            {uniqueUserIds.length === 0 && <p style={{ color: "#888", fontSize: 14, padding: 24, textAlign: "center" }}>No progress data yet.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {uniqueUserIds.map(function(userId) {
                var userEmail = emailFor(userId);
                var userMods = getUserProgress(userId);
                var userPayment = payments.find(function(p) { return emailMatch(p.email, userEmail) && p.status === "completed"; });
                var isPaid = !!userPayment;
                var tier = userPayment ? inferTier(userPayment) : null;
                var lastUpdated = progress.filter(function(p) { return p.user_id === userId; }).map(function(p) { return p.updated_at; }).sort().reverse()[0];
                return (
                  <div key={userId} style={{ background: "#fff", borderRadius: 12, padding: "20px 24px", border: "1px solid #e5e7eb" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>{userEmail}</div>
                        <div style={{ fontSize: 11, color: "#aaa", marginTop: 2 }}>Last active: {lastUpdated ? new Date(lastUpdated).toLocaleString() : "—"}</div>
                      </div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 12, background: isPaid ? "#dcfce7" : "#f3f4f6", color: isPaid ? "#16a34a" : "#888", border: "1px solid " + (isPaid ? "#bbf7d0" : "#e5e7eb") }}>
                          {isPaid ? "Paid — " + (TIER_LABELS[tier] || tier) : "Free tier"}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {MODULE_NAMES.map(function(name, idx) {
                        var mod = userMods[idx];
                        var stepNum = mod ? mod.step : -1;
                        var completed = stepNum >= (TOTAL_STEPS[idx] || 10);
                        var inProgress = stepNum > 0 && !completed;
                        var hasBlueprint = mod && mod.hasSummary;
                        var hasCommit = mod && mod.hasCommitments;
                        var bg = completed ? "#dcfce7" : inProgress ? "#FFF9E6" : "#f3f4f6";
                        var color = completed ? "#16a34a" : inProgress ? "#92400e" : "#9ca3af";
                        var border = completed ? "#bbf7d0" : inProgress ? "#fde68a" : "#e5e7eb";
                        return (
                          <div key={idx} style={{ padding: "6px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: bg, color: color, border: "1px solid " + border, display: "flex", flexDirection: "column", alignItems: "center", minWidth: 80 }}>
                            <span>{name}{completed ? " ✓" : ""}</span>
                            {inProgress && <span style={{ fontSize: 10, fontWeight: 400, marginTop: 2 }}>{getStepLabel(stepNum)}</span>}
                            {(hasBlueprint || hasCommit) && <span style={{ fontSize: 9, marginTop: 2, color: "#0172BC" }}>{hasBlueprint ? "📄" : ""}{hasCommit ? "✏️" : ""}</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Analytics */}
        {tab === "analytics" && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.4rem", fontWeight: 700, color: NAVY, marginBottom: 24 }}>Analytics</h2>
            <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Module Completion Funnel</h3>
              {MODULE_NAMES.map(function(modName, idx) {
                var started = progress.filter(function(p) { return p.module_id === idx && p.current_step > 0; }).length;
                var completed = progress.filter(function(p) { return p.module_id === idx && p.current_step >= (TOTAL_STEPS[idx] || 10); }).length;
                var totalU = Math.max(uniqueUserIds.length, 1);
                return (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{modName}</span>
                      <span style={{ fontSize: 12, color: "#888" }}>{completed} completed / {started} started</span>
                    </div>
                    <div style={{ height: 8, background: "#f0f0f0", borderRadius: 4, position: "relative" }}>
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (started / totalU * 100) + "%", background: ACCENT_COLORS[idx] + "55", borderRadius: 4 }} />
                      <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: (completed / totalU * 100) + "%", background: ACCENT_COLORS[idx], borderRadius: 4 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e5e7eb", marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Diagnostic Assessments</h3>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 2 }}>Total Taken</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>{assessments.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600, marginBottom: 2 }}>Avg Score</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: NAVY }}>
                    {assessments.length > 0 ? (assessments.reduce(function(sum, a) { return sum + (a.total_score || 0); }, 0) / assessments.length).toFixed(1) : "—"}
                  </div>
                </div>
              </div>
              {assessments.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 10 }}>Dimension Averages</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {DIMENSIONS.map(function(dim) {
                      var scored = assessments.filter(function(a) { return a.dimension_scores && a.dimension_scores[dim] != null; });
                      var avg = scored.length > 0 ? (scored.reduce(function(sum, a) { return sum + (a.dimension_scores[dim] || 0); }, 0) / scored.length).toFixed(1) : "—";
                      return (
                        <div key={dim} style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                          <div style={{ fontSize: 11, color: "#888", textTransform: "capitalize", fontWeight: 600, marginBottom: 2 }}>{dim}</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: NAVY }}>{avg}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {assessments.length === 0 && <p style={{ color: "#888", fontSize: 14, margin: 0 }}>No assessments taken yet.</p>}
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "24px", border: "1px solid #e5e7eb" }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: NAVY, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Revenue by Month</h3>
              {payments.length === 0 && <p style={{ color: "#888", fontSize: 14, margin: 0 }}>No payments yet.</p>}
              {payments.length > 0 && (function() {
                var monthMap = {};
                payments.forEach(function(p) {
                  if (!p.created_at) return;
                  var d = new Date(p.created_at);
                  var key = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
                  if (!monthMap[key]) monthMap[key] = { total: 0, count: 0, label: d.toLocaleString("default", { month: "long", year: "numeric" }), tiers: {} };
                  monthMap[key].total += (p.amount || 0);
                  monthMap[key].count += 1;
                  var tier = inferTier(p);
                  monthMap[key].tiers[tier] = (monthMap[key].tiers[tier] || 0) + 1;
                });
                var keys = Object.keys(monthMap).sort().reverse().slice(0, 6);
                if (keys.length === 0) return <p style={{ color: "#888", fontSize: 14, margin: 0 }}>No payments yet.</p>;
                return (
                  <div>
                    {keys.map(function(key) {
                      var m = monthMap[key];
                      return (
                        <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: NAVY }}>{m.label}</span>
                          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              {Object.entries(m.tiers).map(function(entry) {
                                return (
                                  <span key={entry[0]} style={{ fontSize: 10, fontWeight: 700, padding: "1px 8px", borderRadius: 10, background: (TIER_COLORS[entry[0]] || "#888") + "22", color: TIER_COLORS[entry[0]] || "#888" }}>
                                    {entry[1]}× {entry[0]}
                                  </span>
                                );
                              })}
                            </div>
                            <span style={{ fontSize: 13, color: "#555" }}>
                              <span style={{ fontWeight: 700, color: NAVY }}>${(m.total / 100).toFixed(2)}</span>
                              <span style={{ fontSize: 12, color: "#888", marginLeft: 8 }}>({m.count} payment{m.count !== 1 ? "s" : ""})</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export async function getServerSideProps() {
  return { props: {} }
}

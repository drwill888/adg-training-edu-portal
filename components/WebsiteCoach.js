import { useState, useRef, useEffect } from "react";

const NAVY = "#021A35";
const NAVY_LIGHT = "#0a2d52";
const GOLD = "#FDD20D";
const CREAM = "#FDF8F0";
const GRAY = "#6b7280";
const WHITE = "#FFFFFF";

const SOFT_LEAD_AFTER = 2; // show soft lead form after this many assistant replies
const SESSION_KEY = "adg_coach_session";

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function getSession() {
  if (typeof window === "undefined") return { sessionId: null, hasLead: false };
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    console.log("[coach] localStorage raw:", raw);
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log("[coach] parsed session:", parsed);
      return parsed;
    }
  } catch (err) {
    console.error("[coach] getSession error:", err);
  }
  const fresh = { sessionId: genId(), hasLead: false };
  localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
  console.log("[coach] created fresh session:", fresh);
  return fresh;
}

function saveSession(updates) {
  if (typeof window === "undefined") return;
  try {
    const current = getSession();
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...updates }));
  } catch {}
}

export default function WebsiteCoach() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [hasLead, setHasLead] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadLastName, setLeadLastName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadInterest, setLeadInterest] = useState("");
  const [consentMarketing, setConsentMarketing] = useState(true);
  const [leadSubmitting, setLeadSubmitting] = useState(false);
  const [gated, setGated] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const assistantCount = messages.filter((m) => m.role === "assistant").length;

  useEffect(() => {
    const session = getSession();
    setSessionId(session.sessionId);
    // TEMP DEBUG: force hasLead false on every page load so form always appears
    setHasLead(false);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showLeadForm]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // Show soft lead form after SOFT_LEAD_AFTER assistant replies (if not already captured)
  useEffect(() => {
    if (!hasLead && assistantCount >= SOFT_LEAD_AFTER && !showLeadForm) {
      setShowLeadForm(true);
    }
  }, [assistantCount, hasLead, showLeadForm]);

  async function sendMessage(e) {
    e?.preventDefault();
    const q = input.trim();
    if (!q || loading || !sessionId) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, question: q, hasLead }),
      });
      const data = await res.json();

      if (data.conversationId) setConversationId(data.conversationId);

      if (data.gated) {
        setGated(true);
        setShowLeadForm(true);
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.answer }]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLead(e) {
    e?.preventDefault();
    if (!leadEmail) return;
    setLeadSubmitting(true);

    try {
      await fetch("/api/coach/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          email: leadEmail,
          firstName: leadName,
          lastName: leadLastName,
          interest: leadInterest,
          consentMarketing,
        }),
      });

      setHasLead(true);
      saveSession({ hasLead: true });
      setShowLeadForm(false);
      setGated(false);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Thanks${leadName ? `, ${leadName}` : ""}! I've got your info. Feel free to keep asking — I'm here to help you find your next step with ADG.`,
        },
      ]);
    } catch {
      // silently continue
    } finally {
      setLeadSubmitting(false);
    }
  }

  async function emailSummary() {
    if (!conversationId || summaryLoading) return;
    setSummaryLoading(true);
    try {
      await fetch("/api/coach/summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          sendVisitorEmail: hasLead,
          sendTeamEmail: true,
        }),
      });
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: hasLead
            ? "Done! I've emailed your conversation summary. The ADG team will follow up soon."
            : "Summary saved! Share your email to receive a copy.",
        },
      ]);
      if (!hasLead) setShowLeadForm(true);
    } catch {
      // silently ignore
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: GOLD,
            color: NAVY,
            border: "none",
            borderRadius: 999,
            padding: "12px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(2,26,53,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ fontSize: 18 }}>💬</span> Ask the ADG Guide
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 380,
            maxWidth: "calc(100vw - 32px)",
            height: 560,
            maxHeight: "calc(100vh - 48px)",
            background: WHITE,
            borderRadius: 16,
            boxShadow: "0 8px 40px rgba(2,26,53,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: `1px solid ${GOLD}`,
          }}
        >
          {/* Header */}
          <div
            style={{
              background: NAVY,
              color: WHITE,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  background: GOLD,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ✦
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>ADG Guide</div>
                <div
                  style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.2, cursor: "pointer" }}
                  onClick={() => {
                    try { localStorage.removeItem(SESSION_KEY); } catch {}
                    window.location.reload();
                  }}
                  title="Click to reset session"
                >
                  [reset] msgs:{assistantCount} hasLead:{String(hasLead)} form:{String(showLeadForm)}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {conversationId && messages.length > 1 && (
                <button
                  onClick={emailSummary}
                  disabled={summaryLoading}
                  title="Email summary"
                  style={{
                    background: "transparent",
                    border: `1px solid rgba(253,210,13,0.4)`,
                    color: GOLD,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                    opacity: summaryLoading ? 0.5 : 1,
                  }}
                >
                  {summaryLoading ? "..." : "Email summary"}
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: 20,
                  cursor: "pointer",
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 16,
              display: "flex",
              flexDirection: "column",
              gap: 12,
              background: CREAM,
            }}
          >
            {messages.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  color: GRAY,
                  fontSize: 14,
                  marginTop: 40,
                  lineHeight: 1.6,
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
                <div style={{ fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                  Welcome to ADG
                </div>
                Ask me anything about our programs, the 5C Blueprint, or where to start your
                leadership journey.
              </div>
            )}

            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  justifyContent: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    borderRadius: m.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                    background: m.role === "user" ? NAVY : WHITE,
                    color: m.role === "user" ? WHITE : NAVY,
                    fontSize: 14,
                    lineHeight: 1.55,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", justifyContent: "flex-start" }}>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: "16px 16px 16px 4px",
                    background: WHITE,
                    color: GRAY,
                    fontSize: 14,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  <span style={{ letterSpacing: 2 }}>···</span>
                </div>
              </div>
            )}

            {/* Lead capture form */}
            {showLeadForm && !hasLead && (
              <div
                style={{
                  background: WHITE,
                  border: `1px solid ${GOLD}`,
                  borderRadius: 12,
                  padding: 16,
                  marginTop: 4,
                }}
              >
                <div
                  style={{ fontSize: 13, fontWeight: 600, color: NAVY, marginBottom: 10 }}
                >
                  {gated
                    ? "Share your info to continue"
                    : "Want to save this conversation or get a follow-up?"}
                </div>
                <form onSubmit={submitLead} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <input
                    placeholder="First name"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Last name"
                    value={leadLastName}
                    onChange={(e) => setLeadLastName(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                  <select
                    value={leadInterest}
                    onChange={(e) => setLeadInterest(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">What interests you most? (optional)</option>
                    <option value="discovery">Discovery Conversation</option>
                    <option value="cohort">ADG Cohort</option>
                    <option value="self-paced">Self-Paced Training</option>
                    <option value="advisory">Advisory / 1:1 Coaching</option>
                    <option value="general">Just exploring</option>
                  </select>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      fontSize: 12,
                      color: NAVY,
                      lineHeight: 1.4,
                      cursor: "pointer",
                      padding: "2px 0",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={consentMarketing}
                      onChange={(e) => setConsentMarketing(e.target.checked)}
                      style={{ marginTop: 2, accentColor: NAVY }}
                    />
                    <span>Send me occasional emails from ADG with new programs, resources, and Discovery Conversation invitations.</span>
                  </label>
                  <button
                    type="submit"
                    disabled={leadSubmitting || !leadEmail}
                    style={{
                      background: GOLD,
                      color: NAVY,
                      border: "none",
                      borderRadius: 8,
                      padding: "9px 0",
                      fontWeight: 700,
                      fontSize: 13,
                      cursor: leadSubmitting || !leadEmail ? "not-allowed" : "pointer",
                      opacity: leadSubmitting || !leadEmail ? 0.6 : 1,
                    }}
                  >
                    {leadSubmitting ? "Saving…" : "Continue"}
                  </button>
                  {!gated && (
                    <button
                      type="button"
                      onClick={() => setShowLeadForm(false)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: GRAY,
                        fontSize: 12,
                        cursor: "pointer",
                        textAlign: "center",
                      }}
                    >
                      Maybe later
                    </button>
                  )}
                </form>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={sendMessage}
            style={{
              display: "flex",
              gap: 8,
              padding: "10px 12px",
              borderTop: `1px solid #e2e6ed`,
              background: WHITE,
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={gated ? "Share your email above to continue…" : "Ask a question…"}
              disabled={gated || loading}
              style={{
                flex: 1,
                border: "1px solid #e2e6ed",
                borderRadius: 8,
                padding: "9px 12px",
                fontSize: 14,
                outline: "none",
                background: gated ? "#f9fafb" : WHITE,
                color: NAVY,
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || gated || !sessionId}
              style={{
                background: NAVY,
                color: GOLD,
                border: "none",
                borderRadius: 8,
                padding: "9px 16px",
                fontWeight: 700,
                fontSize: 14,
                cursor: !input.trim() || loading || gated ? "not-allowed" : "pointer",
                opacity: !input.trim() || loading || gated ? 0.5 : 1,
                flexShrink: 0,
              }}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const inputStyle = {
  border: "1px solid #e2e6ed",
  borderRadius: 8,
  padding: "8px 10px",
  fontSize: 13,
  outline: "none",
  color: "#021A35",
  background: "#fff",
  width: "100%",
  boxSizing: "border-box",
};

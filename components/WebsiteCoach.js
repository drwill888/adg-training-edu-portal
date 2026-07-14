import { useState, useRef, useEffect } from "react";

const NAVY = "#021A35";
const NAVY_LIGHT = "#0a2d52";
const GOLD = "#FDD20D";
const CREAM = "#FDF8F0";
const GRAY = "#6b7280";
const WHITE = "#FFFFFF";

const SOFT_LEAD_AFTER = 2; // show soft lead form after this many assistant replies
const SESSION_KEY = "adg_coach_session";
const POSITION_KEY = "adg_coach_position"; // corner name OR {x,y} pixel offsets
const COACH_NAME = "Ezra";
const COACH_TAGLINE =
  "Spiritual intelligence for your next faithful step";
const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];

// Returns CSS positioning style for a corner name or {x, y} pixel offsets.
function positionStyle(pos) {
  if (pos && typeof pos === "object" && "x" in pos && "y" in pos) {
    return { left: pos.x, top: pos.y };
  }
  switch (pos) {
    case "bottom-left":
      return { bottom: 24, left: 24 };
    case "top-right":
      return { top: 24, right: 24 };
    case "top-left":
      return { top: 24, left: 24 };
    case "bottom-right":
    default:
      return { bottom: 24, right: 24 };
  }
}

function loadPosition() {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return "bottom-right";
    if (raw.startsWith("{")) {
      const p = JSON.parse(raw);
      if (typeof p.x === "number" && typeof p.y === "number") return p;
    }
    if (POSITIONS.includes(raw)) return raw;
  } catch {}
  return "bottom-right";
}

function savePosition(pos) {
  try {
    localStorage.setItem(
      POSITION_KEY,
      typeof pos === "string" ? pos : JSON.stringify(pos)
    );
  } catch {}
}

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
  // When loaded inside an iframe (e.g. embedded on WordPress), skip drag/position/scroll logic
  const isEmbed = typeof window !== "undefined" && window.parent !== window;

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      intro: true,
      content:
        "I am Ezra.\n\nI am named after Ezra the priest and scribe in the Bible — whose name means \"help\" or \"helper.\" In that spirit, I am here to help.\n\nEssentially, I am Will's scribe. I have been formed from his writings, teachings, coaching frameworks, and Kingdom wisdom to represent his thinking with clarity and faithfulness.\n\nI can help you reflect, discern, study, ask better questions, find patterns and themes, and take faithful next steps.\n\nIf you mention a child, please don't share their full name, birth date, school, address, or medical information — a nickname or general description is safer.\n\nWhat would you like to ask?",
    },
  ]);
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
  const [position, setPosition] = useState("bottom-right");
  const [minimized, setMinimized] = useState(false); // scroll-driven mini state
  const [isMobile, setIsMobile] = useState(false);
  // In embed mode the iframe is narrow but should never trigger mobile-fullscreen layout
  const effectiveMobile = isMobile && !isEmbed;
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  const assistantCount = messages.filter((m) => m.role === "assistant" && !m.intro).length;

  useEffect(() => {
    const session = getSession();
    setSessionId(session.sessionId);
    setHasLead(Boolean(session.hasLead));

    if (!isEmbed) setPosition(loadPosition());

    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);

    if (isEmbed) return () => window.removeEventListener("resize", checkMobile);

    // Auto-minimize on scroll past hero (only when widget is closed, not in embed)
    let lastY = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y > 200 && y > lastY + 30) setMinimized(true);
      else if (y < 100) setMinimized(false);
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  function cyclePosition() {
    const current = typeof position === "string" ? position : "bottom-right";
    const idx = POSITIONS.indexOf(current);
    const next = POSITIONS[(idx + 1) % POSITIONS.length];
    setPosition(next);
    if (isEmbed) {
      window.parent.postMessage({ type: "EZRA_CORNER", corner: next }, "*");
    } else {
      savePosition(next);
    }
  }

  // ── Drag-to-move ────────────────────────────────────────────
  const panelRef = useRef(null);
  const dragState = useRef(null);
  function onDragStart(e) {
    if (effectiveMobile) return;
    const target = e.target;
    if (target.closest("button")) return;
    if (!panelRef.current) return;
    e.preventDefault();
    const point = e.touches?.[0] || e;
    if (isEmbed) {
      dragState.current = { embed: true };
      window.parent.postMessage({ type: "EZRA_DRAG_START", clientX: point.clientX, clientY: point.clientY }, "*");
      window.addEventListener("mousemove", onDragMove);
      window.addEventListener("mouseup", onDragEnd);
      window.addEventListener("touchmove", onDragMove, { passive: false });
      window.addEventListener("touchend", onDragEnd);
      return;
    }
    const rect = panelRef.current.getBoundingClientRect();
    dragState.current = {
      offsetX: point.clientX - rect.left,
      offsetY: point.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
    window.addEventListener("touchmove", onDragMove, { passive: false });
    window.addEventListener("touchend", onDragEnd);
  }
  function onDragMove(e) {
    if (!dragState.current) return;
    if (e.cancelable) e.preventDefault();
    const point = e.touches?.[0] || e;
    if (dragState.current.embed) {
      window.parent.postMessage({ type: "EZRA_DRAG_MOVE", clientX: point.clientX, clientY: point.clientY }, "*");
      return;
    }
    const { offsetX, offsetY, width, height } = dragState.current;
    const maxX = window.innerWidth - width;
    const maxY = window.innerHeight - height;
    const x = Math.max(0, Math.min(maxX, point.clientX - offsetX));
    const y = Math.max(0, Math.min(maxY, point.clientY - offsetY));
    setPosition({ x, y });
  }
  function onDragEnd() {
    if (!dragState.current) return;
    const wasEmbed = dragState.current.embed;
    dragState.current = null;
    if (wasEmbed) {
      window.parent.postMessage({ type: "EZRA_DRAG_END" }, "*");
      window.removeEventListener("mousemove", onDragMove);
      window.removeEventListener("mouseup", onDragEnd);
      window.removeEventListener("touchmove", onDragMove);
      window.removeEventListener("touchend", onDragEnd);
      return;
    }
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onDragMove);
    window.removeEventListener("mouseup", onDragEnd);
    window.removeEventListener("touchmove", onDragMove);
    window.removeEventListener("touchend", onDragEnd);
    setPosition((p) => {
      savePosition(p);
      return p;
    });
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showLeadForm]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  // When embedded as an iframe, tell the parent page to resize around the widget
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage({ type: "EZRA_RESIZE", isOpen }, "*");
    }
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
        body: JSON.stringify({ sessionId, question: q, hasLead, email: hasLead ? leadEmail : null }),
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
      {/* Floating button — collapsed bubble on mobile or when scrolled away */}
      {!isOpen && (
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.parent !== window) {
              window.parent.postMessage({ type: "EZRA_RESIZE", isOpen: true }, "*");
            }
            setIsOpen(true);
            setMinimized(false);
          }}
          aria-label={`Ask ${COACH_NAME}`}
          style={{
            position: "fixed",
            ...positionStyle(position),
            zIndex: 9999,
            background: GOLD,
            color: NAVY,
            border: "none",
            borderRadius: 999,
            padding: minimized || effectiveMobile ? "12px 14px" : "12px 20px",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
            boxShadow: "0 4px 20px rgba(2,26,53,0.3)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            transition: "padding 200ms ease",
          }}
        >
          <span style={{ fontSize: 18 }}>✦</span>
          {!(minimized || effectiveMobile) && <span>Ask {COACH_NAME}</span>}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            ...(effectiveMobile
              ? { top: 0, left: 0, right: 0, bottom: 0 }
              : positionStyle(position)),
            zIndex: 9999,
            width: effectiveMobile ? "100vw" : 380,
            maxWidth: effectiveMobile ? "100vw" : "calc(100vw - 32px)",
            height: effectiveMobile ? "100vh" : 448,
            maxHeight: effectiveMobile ? "100vh" : "calc(100vh - 48px)",
            background: WHITE,
            borderRadius: effectiveMobile ? 0 : 16,
            boxShadow: "0 8px 40px rgba(2,26,53,0.25)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            border: `1px solid ${GOLD}`,
          }}
        >
          {/* Header — drag handle on desktop (disabled in embed mode) */}
          <div
            onMouseDown={onDragStart}
            onTouchStart={onDragStart}
            onDragStart={(e) => e.preventDefault()}
            draggable={false}
            style={{
              background: NAVY,
              color: WHITE,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
              cursor: effectiveMobile ? "default" : "grab",
              userSelect: "none",
              WebkitUserSelect: "none",
              touchAction: "none",
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
                <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{COACH_NAME}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", lineHeight: 1.2 }}>
                  {COACH_TAGLINE}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {!effectiveMobile && (
                <button
                  onClick={cyclePosition}
                  title="Snap to next corner (or drag the header to move freely)"
                  aria-label="Move widget position"
                  style={{
                    background: "transparent",
                    border: `1px solid rgba(253,210,13,0.4)`,
                    color: GOLD,
                    borderRadius: 6,
                    padding: "4px 8px",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                >
                  ⤢
                </button>
              )}
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
                onClick={() => {
                  if (typeof window !== "undefined" && window.parent !== window) {
                    window.parent.postMessage({ type: "EZRA_RESIZE", isOpen: false }, "*");
                  }
                  setIsOpen(false);
                }}
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

          {/* Child-privacy notice — shown before any input, in addition to the
              reminder above the text box, so it can't be missed pre-typing. */}
          <div
            style={{
              padding: "8px 14px",
              fontSize: 11,
              lineHeight: 1.4,
              color: NAVY,
              background: "#FFF3CD",
              borderBottom: "1px solid #f0d78c",
              flexShrink: 0,
            }}
          >
            For your child's safety: don't share their full name, birth date, school,
            address, or medical details here — use a nickname or general description.
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

          {/* Privacy notice */}
          <div
            style={{
              padding: "6px 12px",
              fontSize: 11,
              lineHeight: 1.4,
              color: GRAY,
              background: CREAM,
              borderTop: `1px solid #e2e6ed`,
              flexShrink: 0,
            }}
          >
            Please don't share a child's full name, birth date, school, address, medical
            information, or other details that could identify them — use a nickname or
            general description instead.
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

// Admin: review coach conversations, promote useful Q/A pairs into the KB.
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminNav from "../../components/AdminNav";
import { useIsMobile } from "../../lib/useBreakpoint";

const ADMIN_EMAIL = "meier.will@gmail.com";

const NAVY = "#021A35";
const GOLD = "#FDD20D";
const CREAM = "#FDF8F0";
const BORDER = "rgba(2,26,53,0.12)";

const btn = (variant = "primary") => ({
  padding: "8px 14px",
  borderRadius: 8,
  border: variant === "primary" ? "none" : `1px solid ${BORDER}`,
  background: variant === "primary" ? NAVY : "white",
  color: variant === "primary" ? GOLD : NAVY,
  fontWeight: 600,
  fontSize: 12,
  cursor: "pointer",
});

const inputStyle = {
  padding: "10px 12px",
  borderRadius: 8,
  border: `1px solid ${BORDER}`,
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

export default function CoachConversationsAdmin() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [promote, setPromote] = useState(null); // { question, answer, title, source }
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      setAuthChecked(true);
    });
  }, []);

  async function authHeader() {
    const { data } = await supabase.auth.getSession();
    return data.session ? `Bearer ${data.session.access_token}` : "";
  }

  async function loadList() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coach-conversations", {
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setConversations(json.conversations || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteConversation(id) {
    if (!confirm("Delete this conversation? This cannot be undone.")) return;
    setDeleting(id);
    setError("");
    try {
      const res = await fetch(`/api/admin/coach-conversations?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete");
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (selectedId === id) { setSelectedId(null); setThread(null); }
      setStatus("Conversation deleted.");
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  }

  async function loadThread(id) {
    setSelectedId(id);
    setThread(null);
    setError("");
    try {
      const res = await fetch(`/api/admin/coach-conversations?id=${id}`, {
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load thread");
      setThread(json);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) loadList();
  }, [user]);

  function openPromote(messageIndex) {
    if (!thread) return;
    const msg = thread.messages[messageIndex];
    if (!msg || msg.role !== "assistant") return;
    // Find the most recent prior user message
    let q = "";
    for (let i = messageIndex - 1; i >= 0; i--) {
      if (thread.messages[i].role === "user") {
        q = thread.messages[i].content;
        break;
      }
    }
    setPromote({
      question: q,
      answer: msg.content,
      title: q.slice(0, 70) || "Promoted Q&A",
      source: "promoted-from-chat",
    });
  }

  async function savePromote() {
    if (!promote.question?.trim() || !promote.answer?.trim()) {
      return setError("Both question and answer are required.");
    }
    setStatus("Adding to KB...");
    setError("");
    try {
      const content = `Q: ${promote.question.trim()}\n\nA: ${promote.answer.trim()}`;
      const res = await fetch("/api/admin/coach-kb", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await authHeader(),
        },
        body: JSON.stringify({
          title: promote.title.trim() || "Promoted Q&A",
          source: promote.source.trim() || "promoted-from-chat",
          content,
          metadata: { promoted_from_conversation_id: selectedId },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save");
      setStatus(`Added to KB (${json.chunkCount} chunks).`);
      setPromote(null);
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  if (!authChecked) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user)
    return (
      <div style={{ padding: 40 }}>
        Please <a href="/login">log in</a> to access this page.
      </div>
    );
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
    return <div style={{ padding: 40 }}>Not authorized.</div>;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <AdminNav />
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "20px 14px" : "32px 24px" }}>
        <div style={{ marginBottom: 20 }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28,
              color: NAVY,
              margin: 0,
            }}
          >
            Coach Conversations
          </h1>
          <p style={{ color: "rgba(2,26,53,0.6)", fontSize: 13, margin: "4px 0 0" }}>
            Review what visitors are asking. Promote a good answer into the knowledge
            base so future visitors get it consistently.
          </p>
        </div>

        {error && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}
        {status && (
          <div
            style={{
              background: "#dcfce7",
              color: "#166534",
              padding: 12,
              borderRadius: 8,
              marginBottom: 12,
              fontSize: 13,
            }}
          >
            {status}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "minmax(280px, 360px) 1fr",
            gap: 20,
          }}
        >
          {/* Left: conversations list */}
          <div
            style={{
              background: "white",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              maxHeight: isMobile ? "60vh" : "75vh",
              overflowY: "auto",
              display: isMobile && selectedId ? "none" : "block",
            }}
          >
            <div
              style={{
                padding: "12px 14px",
                fontSize: 11,
                fontWeight: 700,
                color: "rgba(2,26,53,0.5)",
                letterSpacing: 0.5,
                textTransform: "uppercase",
                borderBottom: `1px solid ${BORDER}`,
              }}
            >
              Recent {loading ? "(loading…)" : `(${conversations.length})`}
            </div>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => loadThread(c.id)}
                style={{
                  padding: "12px 14px",
                  borderBottom: `1px solid ${BORDER}`,
                  cursor: "pointer",
                  background: selectedId === c.id ? "rgba(2,26,53,0.04)" : "transparent",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 600, color: NAVY, wordBreak: "break-word", paddingRight: 28 }}>
                  {c.lead ? `${c.lead.first_name || ""} ${c.lead.last_name || ""}`.trim() || c.lead.email : "Anonymous visitor"}
                </div>
                <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)", marginTop: 2, wordBreak: "break-all" }}>
                  {c.lead?.email || c.session_id.slice(0, 12) + "…"}
                </div>
                <div style={{ fontSize: 11, color: "rgba(2,26,53,0.5)", marginTop: 4 }}>
                  {new Date(c.updated_at).toLocaleString()} · {c.message_count} msgs
                </div>
                <button
                  title="Delete conversation"
                  disabled={deleting === c.id}
                  onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }}
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 14,
                    color: "rgba(180,0,0,0.5)",
                    padding: 2,
                    lineHeight: 1,
                  }}
                >
                  🗑
                </button>
              </div>
            ))}
            {!loading && conversations.length === 0 && (
              <div style={{ padding: 16, fontSize: 13, color: "rgba(2,26,53,0.6)" }}>
                No conversations yet.
              </div>
            )}
          </div>

          {/* Right: thread */}
          <div
            style={{
              background: "white",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: isMobile ? 14 : 20,
              maxHeight: isMobile ? "none" : "75vh",
              overflowY: isMobile ? "visible" : "auto",
              display: isMobile && !selectedId ? "none" : "block",
            }}
          >
            {isMobile && selectedId && (
              <button
                style={{ ...btn("secondary"), marginBottom: 12 }}
                onClick={() => {
                  setSelectedId(null);
                  setThread(null);
                }}
              >
                ← Back to conversations
              </button>
            )}
            {!thread && !selectedId && (
              <div style={{ color: "rgba(2,26,53,0.6)", fontSize: 14 }}>
                Select a conversation on the left to review it.
              </div>
            )}
            {selectedId && !thread && (
              <div style={{ color: "rgba(2,26,53,0.6)", fontSize: 14 }}>Loading…</div>
            )}
            {thread && (
              <>
                <div
                  style={{
                    paddingBottom: 12,
                    borderBottom: `1px solid ${BORDER}`,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: NAVY }}>
                    {thread.lead
                      ? `${thread.lead.first_name || ""} ${thread.lead.last_name || ""}`.trim() || thread.lead.email
                      : "Anonymous visitor"}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)" }}>
                    {thread.lead?.email}
                    {thread.lead?.interest && ` · interest: ${thread.lead.interest}`}
                  </div>
                  {thread.conversation.summary && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: 10,
                        background: "rgba(253,210,13,0.1)",
                        borderRadius: 6,
                        fontSize: 13,
                        color: NAVY,
                      }}
                    >
                      <strong>Summary:</strong> {thread.conversation.summary}
                    </div>
                  )}
                </div>

                {thread.messages.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 10,
                      background:
                        m.role === "user" ? "rgba(2,26,53,0.06)" : "rgba(253,210,13,0.08)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          textTransform: "uppercase",
                          color: m.role === "user" ? "rgba(2,26,53,0.6)" : "#8a6700",
                        }}
                      >
                        {m.role === "user" ? "Visitor" : "ADG Guide"}
                      </span>
                      {m.role === "assistant" && (
                        <button style={btn("secondary")} onClick={() => openPromote(i)}>
                          Promote to KB
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 14, lineHeight: 1.55, whiteSpace: "pre-wrap", overflowWrap: "anywhere", color: NAVY }}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* Promote modal */}
        {promote && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 20,
              zIndex: 50,
            }}
            onClick={() => setPromote(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "white",
                borderRadius: 12,
                padding: 24,
                width: "min(700px, 100%)",
                maxHeight: "85vh",
                overflowY: "auto",
              }}
            >
              <div style={{ fontWeight: 700, color: NAVY, fontSize: 18, marginBottom: 4 }}>
                Promote Q&amp;A to Knowledge Base
              </div>
              <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)", marginBottom: 16 }}>
                Edit anything before saving. This becomes a new KB document the coach can retrieve.
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  placeholder="Title (short, descriptive)"
                  value={promote.title}
                  onChange={(e) => setPromote({ ...promote, title: e.target.value })}
                  style={inputStyle}
                />
                <input
                  placeholder="Source tag (e.g. 'faq-cohort', 'faq-discovery')"
                  value={promote.source}
                  onChange={(e) => setPromote({ ...promote, source: e.target.value })}
                  style={inputStyle}
                />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                    Question
                  </div>
                  <textarea
                    value={promote.question}
                    onChange={(e) => setPromote({ ...promote, question: e.target.value })}
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: NAVY, marginBottom: 4 }}>
                    Answer (edit to clean / polish)
                  </div>
                  <textarea
                    value={promote.answer}
                    onChange={(e) => setPromote({ ...promote, answer: e.target.value })}
                    rows={10}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
                  <button style={btn("secondary")} onClick={() => setPromote(null)}>
                    Cancel
                  </button>
                  <button style={btn("primary")} onClick={savePromote}>
                    Add to KB
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

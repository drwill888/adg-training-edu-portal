// Admin UI for the coach knowledge base.
// Locked to ADMIN_EMAIL via Supabase session.
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminNav from "../../components/AdminNav";

const ADMIN_EMAIL = "meier.will@gmail.com";

const NAVY = "#021A35";
const GOLD = "#FDD20D";
const CREAM = "#FDF8F0";
const BORDER = "rgba(2,26,53,0.12)";

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

const btn = (variant = "primary") => ({
  padding: "10px 18px",
  borderRadius: 8,
  border: variant === "primary" ? "none" : `1px solid ${BORDER}`,
  background: variant === "primary" ? NAVY : variant === "danger" ? "#ef4444" : "white",
  color: variant === "primary" || variant === "danger" ? GOLD : NAVY,
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
});

export default function CoachKbAdmin() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // {id?, title, source, content}
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [importMode, setImportMode] = useState(null); // null | "url" | "bulk" | "pdf"
  const [importUrl, setImportUrl] = useState("");
  const [importBulk, setImportBulk] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [importResults, setImportResults] = useState([]);

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

  async function loadDocs() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/coach-kb", {
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setDocuments(json.documents || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) loadDocs();
  }, [user]);

  async function save() {
    if (!editing.title?.trim() || !editing.content?.trim()) {
      setError("Title and content are required.");
      return;
    }
    setStatus("Saving...");
    setError("");
    try {
      const isEdit = Boolean(editing.id);
      const url = isEdit ? `/api/admin/coach-kb?id=${editing.id}` : "/api/admin/coach-kb";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: await authHeader(),
        },
        body: JSON.stringify({
          title: editing.title.trim(),
          source: editing.source?.trim() || null,
          content: editing.content,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setStatus(
        `Saved. ${json.chunkCount ?? "?"} chunks ${isEdit ? "rebuilt" : "created"}.`
      );
      setEditing(null);
      await loadDocs();
    } catch (e) {
      setError(e.message);
      setStatus("");
    }
  }

  async function runImportUrl() {
    if (!importUrl.trim()) return setError("Paste a URL first.");
    setImportBusy(true);
    setError("");
    setImportResults([]);
    try {
      const res = await fetch("/api/admin/coach-kb-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ mode: "url", url: importUrl.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Import failed");
      setImportResults(json.items || []);
      setStatus(`Imported "${json.items?.[0]?.title}".`);
      setImportUrl("");
      await loadDocs();
    } catch (e) {
      setError(e.message);
    } finally {
      setImportBusy(false);
    }
  }

  async function importBulkUrls() {
    const urls = importBulk
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);
    if (urls.length === 0) return setError("Paste at least one URL.");
    setImportBusy(true);
    setError("");
    setImportResults([]);
    try {
      const res = await fetch("/api/admin/coach-kb-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ mode: "bulk", urls }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Bulk import failed");
      setImportResults(json.items || []);
      const ok = (json.items || []).filter((x) => x.ok).length;
      setStatus(`Imported ${ok} of ${urls.length}.`);
      setImportBulk("");
      await loadDocs();
    } catch (e) {
      setError(e.message);
    } finally {
      setImportBusy(false);
    }
  }

  async function importPdf(file) {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) return setError("PDF too large (max 15MB).");
    setImportBusy(true);
    setError("");
    setImportResults([]);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(",")[1]);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch("/api/admin/coach-kb-import", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: await authHeader() },
        body: JSON.stringify({ mode: "pdf", filename: file.name, base64 }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "PDF import failed");
      setImportResults(json.items || []);
      setStatus(`Imported PDF "${json.items?.[0]?.title}".`);
      await loadDocs();
    } catch (e) {
      setError(e.message);
    } finally {
      setImportBusy(false);
    }
  }

  async function remove(doc) {
    if (!confirm(`Delete "${doc.title}"? This removes all its chunks too.`)) return;
    setStatus("Deleting...");
    setError("");
    try {
      const res = await fetch(`/api/admin/coach-kb?id=${doc.id}`, {
        method: "DELETE",
        headers: { Authorization: await authHeader() },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Delete failed");
      setStatus("Deleted.");
      await loadDocs();
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
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: NAVY,
                margin: 0,
              }}
            >
              Coach Knowledge Base
            </h1>
            <p style={{ color: "rgba(2,26,53,0.6)", fontSize: 13, margin: "4px 0 0" }}>
              Add or edit documents Ezra draws from when answering visitors.
            </p>
          </div>
          {!editing && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                style={btn("secondary")}
                onClick={() => setImportMode(importMode === "url" ? null : "url")}
              >
                Import URL
              </button>
              <button
                style={btn("secondary")}
                onClick={() => setImportMode(importMode === "bulk" ? null : "bulk")}
              >
                Bulk URLs
              </button>
              <button
                style={btn("secondary")}
                onClick={() => setImportMode(importMode === "pdf" ? null : "pdf")}
              >
                Upload PDF
              </button>
              <button
                style={btn("primary")}
                onClick={() =>
                  setEditing({ title: "", source: "", content: "", id: null })
                }
              >
                + Add document
              </button>
            </div>
          )}
        </div>

        {importMode && !editing && (
          <div
            style={{
              background: "white",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 12 }}>
              {importMode === "url" && "Import from a URL"}
              {importMode === "bulk" && "Bulk import URLs"}
              {importMode === "pdf" && "Upload a PDF"}
            </div>

            {importMode === "url" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  placeholder="https://awakeningdestiny.global/your-blog-post"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)" }}>
                  Works with public web pages and public Google Docs (shareable link).
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={btn("secondary")} onClick={() => setImportMode(null)}>
                    Cancel
                  </button>
                  <button style={btn("primary")} onClick={runImportUrl} disabled={importBusy}>
                    {importBusy ? "Fetching…" : "Fetch & ingest"}
                  </button>
                </div>
              </div>
            )}

            {importMode === "bulk" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <textarea
                  placeholder={"One URL per line, e.g.\nhttps://awakeningdestiny.global/blog/post-1\nhttps://awakeningdestiny.global/blog/post-2"}
                  value={importBulk}
                  onChange={(e) => setImportBulk(e.target.value)}
                  rows={8}
                  style={{ ...inputStyle, fontFamily: "monospace", fontSize: 13, resize: "vertical" }}
                />
                <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)" }}>
                  Fetches each URL sequentially. Failed ones are reported below; successes are ingested immediately.
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <button style={btn("secondary")} onClick={() => setImportMode(null)}>
                    Cancel
                  </button>
                  <button style={btn("primary")} onClick={importBulkUrls} disabled={importBusy}>
                    {importBusy ? "Importing…" : "Import all"}
                  </button>
                </div>
              </div>
            )}

            {importMode === "pdf" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => importPdf(e.target.files?.[0])}
                  disabled={importBusy}
                  style={{ fontSize: 13 }}
                />
                <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)" }}>
                  Max 15MB. PDF text is extracted, chunked, and embedded. Image-only PDFs
                  won't yield text (no OCR yet).
                </div>
              </div>
            )}

            {importResults.length > 0 && (
              <div
                style={{
                  marginTop: 14,
                  borderTop: `1px solid ${BORDER}`,
                  paddingTop: 12,
                  fontSize: 13,
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 6, color: NAVY }}>Results</div>
                {importResults.map((r, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "4px 0",
                      color: r.ok === false ? "#991b1b" : NAVY,
                    }}
                  >
                    {r.ok === false ? "❌" : "✓"} {r.title || r.url}
                    {r.chunkCount !== undefined && (
                      <span style={{ color: "rgba(2,26,53,0.55)" }}>
                        {" "}
                        — {r.chunkCount} chunks
                      </span>
                    )}
                    {r.error && (
                      <span style={{ color: "#991b1b" }}> — {r.error}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

        {editing && (
          <div
            style={{
              background: "white",
              border: `1px solid ${BORDER}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <div style={{ fontWeight: 700, color: NAVY, marginBottom: 12 }}>
              {editing.id ? "Edit document" : "New document"}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <input
                placeholder="Title"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                style={inputStyle}
              />
              <input
                placeholder='Source (optional, e.g. "5c-framework", "discovery-call")'
                value={editing.source || ""}
                onChange={(e) => setEditing({ ...editing, source: e.target.value })}
                style={inputStyle}
              />
              <textarea
                placeholder="Content (Markdown or plain text). This gets chunked at ~600 chars and embedded."
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={14}
                style={{ ...inputStyle, fontFamily: "inherit", resize: "vertical" }}
              />
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button style={btn("secondary")} onClick={() => setEditing(null)}>
                  Cancel
                </button>
                <button style={btn("primary")} onClick={save}>
                  {editing.id ? "Save changes" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            background: "white",
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 140px 100px 180px",
              padding: "12px 16px",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 0.5,
              color: "rgba(2,26,53,0.5)",
              borderBottom: `1px solid ${BORDER}`,
            }}
          >
            <div>Title / Source</div>
            <div>Updated</div>
            <div>Chunks</div>
            <div style={{ textAlign: "right" }}>Actions</div>
          </div>
          {loading && (
            <div style={{ padding: 20, color: "rgba(2,26,53,0.6)", fontSize: 14 }}>
              Loading…
            </div>
          )}
          {!loading && documents.length === 0 && (
            <div style={{ padding: 20, color: "rgba(2,26,53,0.6)", fontSize: 14 }}>
              No documents yet. Click "Add document" to start.
            </div>
          )}
          {documents.map((d) => (
            <div
              key={d.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 140px 100px 180px",
                padding: "14px 16px",
                fontSize: 14,
                color: NAVY,
                borderBottom: `1px solid ${BORDER}`,
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{d.title}</div>
                {d.source && (
                  <div style={{ fontSize: 12, color: "rgba(2,26,53,0.55)" }}>
                    {d.source}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 12, color: "rgba(2,26,53,0.6)" }}>
                {new Date(d.created_at).toLocaleDateString()}
              </div>
              <div style={{ fontSize: 13 }}>{d.chunk_count}</div>
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                <button
                  style={btn("secondary")}
                  onClick={() =>
                    setEditing({
                      id: d.id,
                      title: d.title,
                      source: d.source || "",
                      content: d.content,
                    })
                  }
                >
                  Edit
                </button>
                <button style={btn("danger")} onClick={() => remove(d)}>
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

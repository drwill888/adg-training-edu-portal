// Coach Health dashboard — spend, activity, top users.
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AdminNav from "../../components/AdminNav";
import { useIsMobile } from "../../lib/useBreakpoint";

const ADMIN_EMAIL = "meier.will@gmail.com";
const NAVY = "#021A35";
const GOLD = "#FDD20D";
const CREAM = "#FDF8F0";
const BORDER = "rgba(2,26,53,0.12)";

function Stat({ label, value, sub }) {
  return (
    <div
      style={{
        background: "white",
        border: `1px solid ${BORDER}`,
        borderRadius: 12,
        padding: 16,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: 0.6,
          textTransform: "uppercase",
          color: "rgba(2,26,53,0.55)",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: NAVY }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "rgba(2,26,53,0.55)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

export default function CoachHealthAdmin() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user || null);
      setAuthChecked(true);
    });
  }, []);

  async function load() {
    setError("");
    try {
      const { data: s } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/coach-health", {
        headers: { Authorization: s.session ? `Bearer ${s.session.access_token}` : "" },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load");
      setData(json);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => {
    if (user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) load();
  }, [user]);

  if (!authChecked) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user)
    return (
      <div style={{ padding: 40 }}>
        Please <a href="/login">log in</a> to access this page.
      </div>
    );
  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase())
    return <div style={{ padding: 40 }}>Not authorized.</div>;

  const c = data?.config || {};
  const m = data?.month || {};
  const t = data?.today || {};
  const walletUsed = c.walletUsdPerMonth ? (m.cost || 0) / c.walletUsdPerMonth : 0;

  return (
    <main
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <AdminNav />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: isMobile ? "20px 14px" : "32px 24px" }}>
        <div style={{ marginBottom: 24 }}>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 28,
              color: NAVY,
              margin: 0,
            }}
          >
            Coach Health
          </h1>
          <p style={{ color: "rgba(2,26,53,0.6)", fontSize: 13, margin: "4px 0 0" }}>
            Ezra's spend, activity, and top users.
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

        {!data ? (
          <div>Loading…</div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
                gap: 12,
                marginBottom: 24,
              }}
            >
              <Stat
                label="Spend this month"
                value={`$${(m.cost || 0).toFixed(4)}`}
                sub={`of $${c.walletUsdPerMonth?.toFixed(2)} cap (${(walletUsed * 100).toFixed(1)}% used)`}
              />
              <Stat
                label="Spend today"
                value={`$${(t.cost || 0).toFixed(4)}`}
                sub={`${t.count || 0} replies today`}
              />
              <Stat label="Replies this month" value={m.count || 0} />
              <Stat label="Leads captured (mo)" value={m.leads || 0} />
              <Stat label="Unique IPs (mo)" value={m.ips || 0} />
              <Stat label="Unique emails (mo)" value={m.emails || 0} />
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  background: "white",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8, fontSize: 13 }}>
                  Top IPs (this month)
                </div>
                {(m.topIps || []).length === 0 && (
                  <div style={{ color: "rgba(2,26,53,0.55)", fontSize: 13 }}>None yet.</div>
                )}
                {(m.topIps || []).map((row) => (
                  <div
                    key={row.key}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}
                  >
                    <code style={{ color: "rgba(2,26,53,0.7)" }}>{row.key.slice(0, 12)}…</code>
                    <span style={{ fontWeight: 600 }}>{row.count}</span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: "white",
                  border: `1px solid ${BORDER}`,
                  borderRadius: 12,
                  padding: 16,
                }}
              >
                <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8, fontSize: 13 }}>
                  Top emails (this month)
                </div>
                {(m.topEmails || []).length === 0 && (
                  <div style={{ color: "rgba(2,26,53,0.55)", fontSize: 13 }}>None yet.</div>
                )}
                {(m.topEmails || []).map((row) => (
                  <div
                    key={row.key}
                    style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "4px 0" }}
                  >
                    <span>{row.key}</span>
                    <span style={{ fontWeight: 600 }}>{row.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "white",
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8, fontSize: 13 }}>
                Recent replies
              </div>
              {(data.recent || []).length === 0 && (
                <div style={{ color: "rgba(2,26,53,0.55)", fontSize: 13 }}>No usage yet.</div>
              )}
              {isMobile
                ? (data.recent || []).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        fontSize: 12,
                        padding: "10px 0",
                        borderBottom: `1px solid ${BORDER}`,
                        color: NAVY,
                      }}
                    >
                      <div style={{ fontWeight: 600 }}>
                        {r.email || (r.ip_hash ? `ip:${r.ip_hash.slice(0, 10)}…` : "—")}
                      </div>
                      <div style={{ color: "rgba(2,26,53,0.6)", marginTop: 2 }}>
                        {new Date(r.created_at).toLocaleString()}
                      </div>
                      <div style={{ marginTop: 4, display: "flex", gap: 10, flexWrap: "wrap", color: "rgba(2,26,53,0.75)" }}>
                        <span>{r.model || "—"}</span>
                        <span>{(r.prompt_tokens || 0) + (r.completion_tokens || 0)} tok</span>
                        <span>${Number(r.cost_usd || 0).toFixed(5)}</span>
                      </div>
                    </div>
                  ))
                : (data.recent || []).map((r) => (
                    <div
                      key={r.id}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "160px 1fr 100px 80px 80px",
                        gap: 8,
                        fontSize: 12,
                        padding: "6px 0",
                        borderBottom: `1px solid ${BORDER}`,
                        color: NAVY,
                      }}
                    >
                      <span>{new Date(r.created_at).toLocaleString()}</span>
                      <span style={{ color: "rgba(2,26,53,0.7)" }}>{r.email || (r.ip_hash ? `ip:${r.ip_hash.slice(0, 10)}…` : "—")}</span>
                      <span>{r.model || "—"}</span>
                      <span>{(r.prompt_tokens || 0) + (r.completion_tokens || 0)} tok</span>
                      <span>${Number(r.cost_usd || 0).toFixed(5)}</span>
                    </div>
                  ))}
            </div>

            <div
              style={{
                background: "white",
                border: `1px solid ${BORDER}`,
                borderRadius: 12,
                padding: 16,
                fontSize: 13,
              }}
            >
              <div style={{ fontWeight: 700, color: NAVY, marginBottom: 8 }}>Current settings</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "auto 1fr" : "1fr 1fr", gap: isMobile ? "6px 12px" : 8, color: "rgba(2,26,53,0.75)" }}>
                <div>Model</div><div>{c.model}</div>
                <div>Wallet cap</div><div>${c.walletUsdPerMonth}/month</div>
                <div>Per-IP daily cap</div><div>{c.perIpPerDay} messages</div>
                <div>Per-email daily cap</div><div>{c.perEmailPerDay} messages</div>
                <div>Reply max tokens</div><div>{c.maxReplyTokens}</div>
                <div>Pricing in / out</div>
                <div>${c.priceInPerM} / ${c.priceOutPerM} per 1M tokens</div>
              </div>
              <div style={{ marginTop: 10, fontSize: 12, color: "rgba(2,26,53,0.55)" }}>
                Override any of these in <code>.env.local</code> with: <code>COACH_MODEL</code>,
                <code> COACH_MAX_REPLY_TOKENS</code>, <code>COACH_WALLET_USD_PER_MONTH</code>,
                <code> COACH_PER_IP_PER_DAY</code>, <code>COACH_PER_EMAIL_PER_DAY</code>,
                <code> COACH_PRICE_IN_PER_M</code>, <code>COACH_PRICE_OUT_PER_M</code>.
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}

// Shared admin nav bar. Drop into the top of any admin page so all admin
// destinations are one click away.
import { useRouter } from "next/router";
import { useIsMobile } from "../lib/useBreakpoint";

const NAVY = "#021A35";
const GOLD = "#FDD20D";
const MUTED = "rgba(255,255,255,0.65)";
const BORDER = "rgba(255,255,255,0.12)";

const LINKS = [
  { href: "/admin", label: "5C Dashboard" },
  { href: "/admin/blueprint-applications", label: "Blueprint Apps" },
  { href: "/admin/coach-health", label: "Ezra · Health" },
  { href: "/admin/coach-kb", label: "Ezra · Knowledge" },
  { href: "/admin/coach-conversations", label: "Ezra · Conversations" },
  { href: "/admin?tab=ezra-edu", label: "Ezra · Edu" },
  { href: "/admin/edu-conversations", label: "Edu · Conversations" },
  { href: "/admin/edu-kb", label: "Edu · Knowledge" },
];

export default function AdminNav() {
  const router = useRouter();
  const isMobile = useIsMobile();
  return (
    <div
      style={{
        background: NAVY,
        padding: isMobile ? "12px 12px 0" : "16px 24px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        flexWrap: isMobile ? "nowrap" : "wrap",
        alignItems: isMobile ? "stretch" : "center",
        gap: isMobile ? 10 : 16,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div style={{ marginRight: isMobile ? 0 : "auto" }}>
        <a
          href="/admin"
          style={{
            color: GOLD,
            fontSize: isMobile ? 16 : 18,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ADG Admin
        </a>
      </div>
      <div
        style={{
          display: "flex",
          gap: isMobile ? 6 : 12,
          flexWrap: isMobile ? "nowrap" : "wrap",
          overflowX: isMobile ? "auto" : "visible",
          paddingBottom: isMobile ? 10 : 0,
          WebkitOverflowScrolling: "touch",
        }}
      >
        {LINKS.map((l) => {
          const active =
            router.pathname === l.href ||
            (l.href !== "/admin" && router.pathname.startsWith(l.href));
          return (
            <a
              key={l.href}
              href={l.href}
              style={{
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                padding: "6px 12px",
                borderRadius: 6,
                color: active ? NAVY : MUTED,
                background: active ? GOLD : "transparent",
                border: active ? "none" : `1px solid ${BORDER}`,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {l.label}
            </a>
          );
        })}

        {/* Divider */}
        <span style={{ color: BORDER, fontSize: 18, alignSelf: "center" }}>|</span>

        {/* External: Email + SMS tools */}
        {[
          { href: "https://adg-admin-tools.vercel.app/email", label: "✉ Email" },
          { href: "https://adg-admin-tools.vercel.app/sms", label: "📱 SMS" },
        ].map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              padding: "6px 12px",
              borderRadius: 6,
              color: GOLD,
              background: "transparent",
              border: `1px solid ${GOLD}55`,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {l.label} ↗
          </a>
        ))}
      </div>
    </div>
  );
}

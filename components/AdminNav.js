// Shared admin nav bar. Drop into the top of any admin page so all admin
// destinations are one click away.
import { useRouter } from "next/router";

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
];

export default function AdminNav() {
  const router = useRouter();
  return (
    <div
      style={{
        background: NAVY,
        padding: "16px 24px",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: 16,
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div style={{ marginRight: "auto" }}>
        <a
          href="/admin"
          style={{ color: GOLD, fontSize: 18, fontWeight: 700, textDecoration: "none" }}
        >
          ADG Admin
        </a>
      </div>
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
            }}
          >
            {l.label}
          </a>
        );
      })}
    </div>
  );
}

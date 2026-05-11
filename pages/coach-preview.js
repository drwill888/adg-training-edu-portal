import dynamic from "next/dynamic";

const WebsiteCoach = dynamic(() => import("../components/WebsiteCoach"), { ssr: false });

export default function CoachPreview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#021A35",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ textAlign: "center", color: "#FDF8F0", maxWidth: 560 }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✦</div>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#FDD20D",
            marginBottom: 12,
            letterSpacing: -0.5,
          }}
        >
          Website Coaching Agent
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.7, color: "rgba(253,248,240,0.75)", margin: 0 }}>
          The ADG Guide is live in the bottom-right corner. Click{" "}
          <strong style={{ color: "#FDD20D" }}>"Ask the ADG Guide"</strong> to start a
          conversation, test lead capture, and explore the knowledge base.
        </p>

        <div
          style={{
            marginTop: 40,
            background: "rgba(255,255,255,0.06)",
            borderRadius: 12,
            padding: 24,
            textAlign: "left",
          }}
        >
          <div
            style={{ fontSize: 12, fontWeight: 700, color: "#FDD20D", marginBottom: 14, letterSpacing: 1 }}
          >
            WHAT TO TEST
          </div>
          {[
            ["Chat + retrieval", "Ask about the 5C Blueprint or Discovery Conversation"],
            ["Soft lead form", "Appears automatically after 2 exchanges"],
            ["Hard gate", "Clear localStorage, send 6+ messages without submitting"],
            ["Email summary", 'Click "Email summary" in the chat header'],
          ].map(([title, desc]) => (
            <div
              key={title}
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 12,
                alignItems: "flex-start",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#FDD20D",
                  marginTop: 7,
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: "#FDF8F0" }}>{title}</div>
                <div style={{ fontSize: 13, color: "rgba(253,248,240,0.6)" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <WebsiteCoach />
    </div>
  );
}

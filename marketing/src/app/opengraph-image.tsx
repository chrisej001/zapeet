import { ImageResponse } from "next/og";

export const alt = "Zapeet — Get paid instantly. We’ll send the rider.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const C = {
  ink: "#1B1F3B",
  ink60: "#5C6079",
  marigold: "#F2A93B",
  marigoldInk: "#B97A1E",
  terracotta: "#D85A30",
  paper: "#F7F4EE",
};

/** Inter from Google Fonts so the ₦ sign and heavy weights match the site.
 * An old UA makes Google serve TTF, which Satori can read. */
async function interFonts() {
  try {
    return await Promise.all(
      ([600, 800] as const).map(async (weight) => {
        const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, {
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko)" },
        }).then((r) => r.text());
        const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
        if (!url) throw new Error("no ttf");
        const data = await fetch(url).then((r) => r.arrayBuffer());
        return { name: "Inter", data, weight, style: "normal" as const };
      }),
    );
  } catch {
    return undefined;
  }
}

function Dot({ color, bg }: { color: string; bg: string }) {
  return (
    <div style={{ display: "flex", width: 40, height: 40, borderRadius: 40, background: bg, alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", width: 14, height: 14, borderRadius: 14, background: color }} />
    </div>
  );
}

// Mirrors the landing hero: paper background with warm glows, the headline
// on the left and the payment-link card on the right.
export default async function OpengraphImage() {
  const rows = [
    { text: "Payment confirmed in seconds", color: C.marigoldInk, bg: "rgba(242,169,59,0.2)" },
    { text: "₦183,000 sent to your bank", color: C.marigoldInk, bg: "rgba(242,169,59,0.2)" },
    { text: "Rider dispatched — 12 min away", color: C.terracotta, bg: "rgba(216,90,48,0.15)" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          padding: "0 64px",
          gap: 48,
          background: C.paper,
          backgroundImage:
            "radial-gradient(circle at 92% 18%, rgba(242,169,59,0.3), rgba(247,244,238,0) 340px), radial-gradient(circle at 62% 95%, rgba(216,90,48,0.18), rgba(247,244,238,0) 320px)",
          fontFamily: "Inter",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 540 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <svg width={52} height={52} viewBox="0 0 34 34" fill="none">
              <rect x="0.5" y="0.5" width="33" height="33" rx="9" fill={C.ink} />
              <path d="M18.6 8.5L11.6 18.4H16.2L15 25.5L22.8 15H17.8L18.6 8.5Z" fill={C.marigold} />
            </svg>
            <div style={{ display: "flex", fontSize: 38, fontWeight: 800, color: C.ink, letterSpacing: -1 }}>zapeet</div>
          </div>
          <div style={{ display: "flex", marginTop: 40, fontSize: 20, fontWeight: 800, color: C.terracotta, letterSpacing: 2 }}>
            INSTANT PAYOUTS. AUTOMATED DELIVERY.
          </div>
          <div style={{ display: "flex", marginTop: 16, fontSize: 66, fontWeight: 800, color: C.ink, lineHeight: 1.05, letterSpacing: -2 }}>
            Get paid instantly. We’ll send the rider.
          </div>
          <div style={{ display: "flex", marginTop: 24, fontSize: 24, fontWeight: 600, color: C.ink60 }}>
            Built for Lagos vendors.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: 500,
            padding: "36px 40px",
            background: "white",
            borderRadius: 32,
            border: "2px solid rgba(27,31,59,0.1)",
            boxShadow: "0 36px 80px -30px rgba(27,31,59,0.4)",
          }}
        >
          <div style={{ display: "flex", fontSize: 16, fontWeight: 800, color: C.ink60, letterSpacing: 2 }}>ZAPEET LINK</div>
          <div style={{ display: "flex", marginTop: 20, fontSize: 62, fontWeight: 800, color: C.ink, letterSpacing: -2 }}>₦185,000</div>
          <div style={{ display: "flex", marginTop: 4, fontSize: 22, fontWeight: 600, color: C.ink60 }}>MacBook Air M2 · 13-inch</div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <div style={{ display: "flex", padding: "10px 18px", borderRadius: 999, background: C.marigold, color: C.ink, fontSize: 18, fontWeight: 600 }}>
              Instant payout
            </div>
            <div style={{ display: "flex", padding: "10px 18px", borderRadius: 999, border: "2px solid rgba(27,31,59,0.2)", color: C.ink60, fontSize: 18, fontWeight: 600 }}>
              Same-day delivery
            </div>
          </div>
          <div style={{ display: "flex", height: 2, background: "rgba(27,31,59,0.1)", marginTop: 26 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24 }}>
            {rows.map((r) => (
              <div key={r.text} style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Dot color={r.color} bg={r.bg} />
                <div style={{ display: "flex", fontSize: 21, fontWeight: 600, color: C.ink }}>{r.text}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: await interFonts() },
  );
}

import { ImageResponse } from "next/og";
import { OG, OG_SIZE, OgLogoMark, ogFonts } from "@/lib/og";

export const alt = "Zapeet — Get paid instantly. Delivery handled.";
export const size = OG_SIZE;
export const contentType = "image/png";

// Mirrors the splash screen at app.zapeet.app: ink background, glowing mark.
export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: OG.ink,
          backgroundImage: "radial-gradient(circle at 50% 40%, rgba(242,169,59,0.22), rgba(27,31,59,0) 380px)",
          fontFamily: "Inter",
        }}
      >
        <OgLogoMark size={150} />
        <div style={{ display: "flex", marginTop: 32, fontSize: 64, fontWeight: 800, color: OG.paper, letterSpacing: -2 }}>
          zapeet
        </div>
        <div style={{ display: "flex", marginTop: 16, fontSize: 34, fontWeight: 600, color: OG.marigold }}>
          Get paid instantly. Delivery handled.
        </div>
      </div>
    ),
    { ...size, fonts: await ogFonts() },
  );
}

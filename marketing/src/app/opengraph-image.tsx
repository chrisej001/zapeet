import { ImageResponse } from "next/og";

export const alt = "Zapeet — Insured checkout. Automated delivery.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "flex-start",
          background: "#1B1F3B",
          padding: "80px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 48 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#F2A93B",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
              color: "#1B1F3B",
            }}
          >
            Z
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, color: "#F7F4EE" }}>zapeet</div>
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 64,
            fontWeight: 800,
            color: "#F7F4EE",
            lineHeight: 1.15,
            maxWidth: 920,
          }}
        >
          Insured checkout. Automated delivery.
        </div>
        <div style={{ display: "flex", fontSize: 28, color: "#F2A93B", marginTop: 32, fontWeight: 600 }}>
          Built for Lagos vendors
        </div>
      </div>
    ),
    { ...size },
  );
}

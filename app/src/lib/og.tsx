/** Shared bits for the generated link-preview images (opengraph-image.tsx).
 * Satori only understands inline styles, so colours are repeated here from
 * globals.css rather than read from Tailwind. */
export const OG_SIZE = { width: 1200, height: 630 };

export const OG = {
  ink: "#1B1F3B",
  ink60: "#5C6079",
  marigold: "#F2A93B",
  marigoldInk: "#B97A1E",
  terracotta: "#D85A30",
  paper: "#F7F4EE",
};

export function OgLogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" fill="none">
      <rect x="0.5" y="0.5" width="33" height="33" rx="9" fill={OG.ink} />
      <path d="M18.6 8.5L11.6 18.4H16.2L15 25.5L22.8 15H17.8L18.6 8.5Z" fill={OG.marigold} />
    </svg>
  );
}

/** Inter, fetched from Google Fonts at render time so the ₦ sign and the
 * heavy weights match the real pages. Falls back to the built-in font. */
export async function ogFonts() {
  const weights = [600, 800] as const;
  try {
    const fonts = await Promise.all(
      weights.map(async (weight) => {
        const css = await fetch(`https://fonts.googleapis.com/css2?family=Inter:wght@${weight}`, {
          // An old UA makes Google serve TTF, which Satori can read (it can't read woff2).
          headers: { "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/534.30 (KHTML, like Gecko)" },
        }).then((r) => r.text());
        const url = css.match(/src: url\((.+?)\) format\('(?:truetype|opentype)'\)/)?.[1];
        if (!url) throw new Error("no ttf");
        const data = await fetch(url).then((r) => r.arrayBuffer());
        return { name: "Inter", data, weight, style: "normal" as const };
      }),
    );
    return fonts;
  } catch {
    return undefined;
  }
}

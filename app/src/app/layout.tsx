import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://app.zapeet.app"),
  title: "Zapeet",
  description: "Get paid instantly. Delivery handled.",
  openGraph: {
    type: "website",
    siteName: "Zapeet",
    title: "Zapeet",
    description: "Get paid instantly. Delivery handled.",
    locale: "en_NG",
  },
  twitter: { card: "summary_large_image" },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Zapeet",
  },
};

export const viewport: Viewport = {
  themeColor: "#1B1F3B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const SITE_URL = "https://zapeet.app";
const TITLE = "Zapeet — Insured checkout. Automated delivery.";
const DESCRIPTION =
  "Generate a payment link, get instant device cover and rider dispatch. Insured checkout and automated delivery for Lagos vendors.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: TITLE, template: "%s — Zapeet" },
  description: DESCRIPTION,
  keywords: [
    "Zapeet",
    "insured checkout",
    "device insurance Nigeria",
    "gadget insurance Lagos",
    "same-day delivery Lagos",
    "payment links Nigeria",
    "Lagos vendors",
    "insured delivery",
  ],
  authors: [{ name: "Zapeet" }],
  creator: "Zapeet",
  publisher: "Zapeet",
  applicationName: "Zapeet",
  category: "e-commerce",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Zapeet",
    title: TITLE,
    description: DESCRIPTION,
    locale: "en_NG",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Zapeet",
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: DESCRIPTION,
      email: "hello@zapeet.app",
      telephone: "+2348138693864",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Gbagada, Lagos",
        addressCountry: "NG",
      },
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Zapeet",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { SITE } from "@/content/site";
import { AnalyticsInit } from "@/components/analytics/AnalyticsInit";
import { AttributionCapture } from "@/components/analytics/AttributionCapture";
import { ConsentInit, PageContextInit } from "@/components/analytics/ConsentInit";
import { CookieConsentBanner } from "@/components/analytics/CookieConsentBanner";
import { GoogleTagManager, GtmNoScript } from "@/components/analytics/GoogleTagManager";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-inter",
});

// Brand first so it stays visible in a narrow browser tab.
const TITLE = "Best Solution | UAE Business Setup Cost Estimate";
const DESCRIPTION =
  "Estimate your UAE business setup cost in minutes, then review it with a dedicated Best Solution consultant. Transparent fees, confirmed in writing.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: TITLE,
  description: DESCRIPTION,
  robots: {
    index: false,
  },
  // Each page sets its own canonical (alternates) in its metadata.
  openGraph: {
    type: "website",
    siteName: SITE.name,
    title: TITLE,
    description: "Your UAE business setup, costed and planned before you begin.",
    images: [SITE.ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Your UAE business setup, costed and planned before you begin.",
    images: [SITE.ogImage],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#14253e",
};

/*
  Tracking matches best-solution.ae (shared container GTM-MLFW9XR). Order matters: page context and
  Consent Mode defaults in <head> first, then the Stape GTM loader after hydration.
*/
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: GTM Preview's Tag Assistant adds data-tag-assistant-* attributes to <html>
    // before React hydrates. This applies to this one element only, not to the page inside it.
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <PageContextInit />
        <ConsentInit />
      </head>
      <body>
        <GtmNoScript />
        {children}
        <CookieConsentBanner />
        <AnalyticsInit />
        <AttributionCapture />
        <GoogleTagManager />
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { SITE } from "@/content/site";
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

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={inter.variable} data-scroll-behavior="smooth">
      <body>
        {GTM_ID ? (
          <>
            <Script id="gtm" strategy="afterInteractive">
              {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM_ID}');`}
            </Script>
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
                title="Google Tag Manager"
              />
            </noscript>
          </>
        ) : null}
        <a className="skip-link" href="#calculator">
          Skip to the cost calculator
        </a>
        {children}
      </body>
    </html>
  );
}

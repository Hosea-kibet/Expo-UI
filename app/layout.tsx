import type { Metadata } from "next";
import Script from "next/script";
import { NavigationSplash } from "@/src/components/navigation-splash";
import { MetaPixel } from "@/src/components/meta-pixel";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.agriexpo.africa";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "2026 Africa International Agricultural Expo | AIAE",
  description:
    "Join the 2026 Africa International Agricultural Expo from 23–25 October at KICC, Nairobi. Discover exhibitors, speakers, partnerships, and visitor information.",
  applicationName: "Africa International Agricultural Expo",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: "/icon.svg",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Africa International Agricultural Expo",
    title: "2026 Africa International Agricultural Expo | AIAE",
    description:
      "Join the 2026 Africa International Agricultural Expo from 23–25 October at KICC, Nairobi. Explore exhibitors, speakers, partnerships, and visitor information.",
    locale: "en_KE",
  },
  twitter: {
    card: "summary",
    title: "2026 Africa International Agricultural Expo | AIAE",
    description:
      "Join the 2026 Africa International Agricultural Expo from 23–25 October at KICC, Nairobi.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="no-gsap">
      <body>
        <Script id="meta-pixel-base" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1053659194067112');
          `}
        </Script>
        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            alt=""
            src="https://www.facebook.com/tr?id=1053659194067112&ev=PageView&noscript=1"
          />
        </noscript>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  name: "Africa International Agricultural Expo",
                  alternateName: "AIAE",
                  url: new URL("/", siteUrl).toString(),
                },
                {
                  "@type": "Event",
                  name: "2026 Africa International Agricultural Expo",
                  alternateName: "2026 AIAE",
                  startDate: "2026-10-23",
                  endDate: "2026-10-25",
                  eventStatus: "https://schema.org/EventScheduled",
                  eventAttendanceMode:
                    "https://schema.org/OfflineEventAttendanceMode",
                  url: new URL("/", siteUrl).toString(),
                  image: new URL(
                    "/assets/logo-wordmark-dark.svg",
                    siteUrl,
                  ).toString(),
                  location: {
                    "@type": "Place",
                    name: "Kenyatta International Convention Centre (KICC)",
                    address: {
                      "@type": "PostalAddress",
                      addressLocality: "Nairobi",
                      addressCountry: "KE",
                    },
                  },
                  organizer: {
                    "@type": "Organization",
                    name: "Africa International Agricultural Expo",
                    url: new URL("/", siteUrl).toString(),
                    logo: new URL("/icon.svg", siteUrl).toString(),
                  },
                },
              ],
            }).replace(/</g, "\\u003c"),
          }}
        />
        <MetaPixel />
        <NavigationSplash />
        {children}
      </body>
    </html>
  );
}

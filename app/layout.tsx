import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "./brand.css";
import "./royal-food.css";
import "./customer-ui-fixes.css";
import "./checkout-enhancer.css";
import "./grocery-modern.css";
import "./grocery-contrast-fix.css";
import "./grocery-product-smooth.css";
import "./mobile-viewport-fix.css";
import PushNotifications from "./push-notifications";
import LeadershipFooter from "./components/founder/LeadershipFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://sabkadelivery.in"),
  title: {
    default: "Sabka Delivery",
    template: "%s | Sabka Delivery",
  },
  description:
    "Sabka Delivery is a local food, grocery and delivery service in Lala Bazar, Hailakandi, Assam. Owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
  keywords: [
    "Sabka Delivery",
    "Sabka Delivery owner",
    "Sabka Delivery founder",
    "Karan Nath",
    "Karan Nath Sabka Delivery",
    "Prem Kumar Nath",
    "Prem Kumar Nath Sabka Delivery",
    "Sabka Delivery Lala Bazar",
    "food delivery Lala Bazar",
    "grocery delivery Lala Bazar",
    "electronics delivery Lala Bazar",
    "delivery service Hailakandi",
  ],
  authors: [
    { name: "Prem Kumar Nath", url: "https://sabkadelivery.in/about" },
    { name: "Karan Nath", url: "https://sabkadelivery.in/founder" },
  ],
  creator: "Sabka Delivery",
  publisher: "Sabka Delivery",
  applicationName: "Sabka Delivery",
  alternates: { canonical: "/" },
  verification: { google: "cqL2BsLMTDXtjBuCw05kgol9rpdAvTeONcApvZrEniI" },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "48x48", type: "image/png" },
      { url: "/images/sabka-delivery-logo.png", sizes: "192x192", type: "image/png" },
      { url: "/images/sabka-delivery-logo.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.png",
    apple: [{ url: "/images/sabka-delivery-logo.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: "Sabka Delivery",
    description:
      "Sabka Delivery — owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
    url: "https://sabkadelivery.in",
    siteName: "Sabka Delivery",
    images: [
      {
        url: "/images/sabka-delivery-logo.png",
        width: 512,
        height: 512,
        alt: "Sabka Delivery Logo",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sabka Delivery",
    description:
      "Sabka Delivery is owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
    images: ["/images/sabka-delivery-logo.png"],
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Sabka Delivery" },
  formatDetection: { telephone: true, address: true, email: true },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "Food and Grocery Delivery",
  other: {
    "theme-color": "#ffffff",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://sabkadelivery.in/#website",
      url: "https://sabkadelivery.in/",
      name: "Sabka Delivery",
      alternateName: ["SabkaDelivery", "Sabka Delivery Lala Bazar"],
      publisher: { "@id": "https://sabkadelivery.in/#organization" },
      inLanguage: "en-IN",
    },
    {
      "@type": ["Organization", "DeliveryService"],
      "@id": "https://sabkadelivery.in/#organization",
      name: "Sabka Delivery",
      legalName: "Sabka Delivery",
      url: "https://sabkadelivery.in/",
      logo: "https://sabkadelivery.in/images/sabka-delivery-logo.png",
      image: "https://sabkadelivery.in/images/sabka-delivery-logo.png",
      description:
        "Sabka Delivery is a local food, grocery and delivery service in Lala Bazar, Hailakandi, Assam. The owner is Prem Kumar Nath, and the founders are Prem Kumar Nath and Karan Nath.",
      owner: {
        "@id": "https://sabkadelivery.in/#prem-kumar-nath",
      },
      founder: [
        {
          "@id": "https://sabkadelivery.in/#prem-kumar-nath",
        },
        {
          "@id": "https://sabkadelivery.in/#karan-nath",
        },
      ],
      foundingLocation: {
        "@type": "Place",
        name: "Lala Bazar, Hailakandi, Assam",
      },
      areaServed: {
        "@type": "Place",
        name: "Lala Bazar, Hailakandi, Assam",
      },
      address: {
        "@type": "PostalAddress",
        addressLocality: "Lala Bazar",
        addressRegion: "Assam",
        addressCountry: "IN",
      },
      contactPoint: {
        "@type": "ContactPoint",
        telephone: "+91-8011767897",
        contactType: "customer support",
        areaServed: "IN",
        availableLanguage: ["English", "Hindi", "Bengali"],
      },
    },
    {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/#karan-nath",
      name: "Karan Nath",
      url: "https://sabkadelivery.in/founder",
      jobTitle: "Founder",
      worksFor: { "@id": "https://sabkadelivery.in/#organization" },
      affiliation: { "@id": "https://sabkadelivery.in/#organization" },
      image: "https://sabkadelivery.in/founder/karan.jpg",
      description:
        "Karan Nath is a founder of Sabka Delivery. He co-founded Sabka Delivery with Prem Kumar Nath.",
    },
    {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/#prem-kumar-nath",
      name: "Prem Kumar Nath",
      url: "https://sabkadelivery.in/about",
      jobTitle: "Owner and Founder",
      worksFor: { "@id": "https://sabkadelivery.in/#organization" },
      affiliation: { "@id": "https://sabkadelivery.in/#organization" },
      image: "https://sabkadelivery.in/founder/prem.png",
      description:
        "Prem Kumar Nath is the owner and founder of Sabka Delivery. He co-founded Sabka Delivery with Karan Nath.",
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <script
          id="clear-stale-market-catalog"
          dangerouslySetInnerHTML={{
            __html:
              'try{localStorage.removeItem("sabka-delivery-market-catalog-v1")}catch(e){}',
          }}
        />
        <style
          id="critical-logo-size"
          dangerouslySetInnerHTML={{
            __html:
              ".logo>span.brand-mark{display:block;width:52px;height:52px;flex:0 0 52px;overflow:hidden}.logo>span.brand-mark img{display:block;width:100%;height:100%;object-fit:cover}@media(max-width:680px){.logo>span.brand-mark{width:40px;height:40px;flex-basis:40px}}",
          }}
        />
        <script
          id="sabka-delivery-organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PushNotifications />
        {children}
        <LeadershipFooter />
      </body>
    </html>
  );
}

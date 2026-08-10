import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "./brand.css";
import "./royal-food.css";
import "./customer-ui-fixes.css";
import "./checkout-enhancer.css";
import "./grocery-modern.css";
import "./grocery-contrast-fix.css";
import "./grocery-product-smooth.css";
import "./mobile-bottom-nav-fix.css";
import PushNotifications from "./push-notifications";
import LeadershipFooter from "./components/founder/LeadershipFooter";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://sabkadelivery.in"),
  title: {
    default: "Sabka Delivery",
    template: "%s | Sabka Delivery",
  },
  description:
    "Sabka Delivery is a local food, grocery and electronics delivery service in Lala Bazar, Hailakandi, Assam, founded by Karan Nath.",
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
    { name: "Karan Nath", url: "https://sabkadelivery.in/founder" },
    { name: "Prem Kumar Nath", url: "https://sabkadelivery.in/about" },
  ],
  creator: "Karan Nath",
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
      "Food, grocery and electronics delivery in Lala Bazar, founded by Karan Nath.",
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
    description: "Local delivery service in Lala Bazar, founded by Karan Nath.",
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

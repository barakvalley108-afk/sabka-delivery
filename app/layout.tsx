import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";
import "./brand.css";
import "./royal-food.css";

import CartFlightAnimation from "./components/cart-flight-animation";
import MobileCustomerNav from "./components/mobile-customer-nav";
import PwaRegister from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://sabkadelivery.in"),

  title: {
    default:
      "Sabka Delivery | Food, Grocery & Electronics Delivery in Lala Bazar",
    template: "%s | Sabka Delivery",
  },

  description:
    "Order food, grocery and electronics online from Sabka Delivery in Lala Bazar, Hailakandi, Assam. Fast, safe and reliable local delivery.",

  keywords: [
    "Sabka Delivery",
    "Sabka Delivery Lala Bazar",
    "food delivery Lala Bazar",
    "grocery delivery Lala Bazar",
    "electronics delivery Lala Bazar",
    "online food order Lala Bazar",
    "delivery service Hailakandi",
    "food delivery Assam",
    "grocery delivery Assam",
  ],

  authors: [
    {
      name: "Sabka Delivery",
      url: "https://sabkadelivery.in",
    },
  ],

  creator: "Sabka Delivery",
  publisher: "Sabka Delivery",
  applicationName: "Sabka Delivery",

  alternates: {
    canonical: "/",
  },

  verification: {
    google: "cqL2BsLMTDXtjBuCw05kgol9rpdAvTeONcApvZrEniI",
  },

  manifest: "/manifest.webmanifest",

  icons: {
    icon: [
      {
        url: "/favicon.png",
        sizes: "48x48",
        type: "image/png",
      },
      {
        url: "/images/sabka-delivery-logo.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/images/sabka-delivery-logo.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],

    shortcut: "/favicon.png",

    apple: [
      {
        url: "/images/sabka-delivery-logo.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },

  openGraph: {
    title:
      "Sabka Delivery | Food, Grocery & Electronics Delivery in Lala Bazar",

    description:
      "Order food, grocery and electronics online in Lala Bazar, Hailakandi. Fast, safe and reliable local delivery.",

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

    title:
      "Sabka Delivery | Food, Grocery & Electronics Delivery in Lala Bazar",

    description:
      "Order food, grocery and electronics online in Lala Bazar, Hailakandi.",

    images: ["/images/sabka-delivery-logo.png"],
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sabka Delivery",
  },

  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },

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

  category: "Food, Grocery and Electronics Delivery",

  other: {
    "theme-color": "#ffffff",
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
  },
};

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Sabka Delivery",
  alternateName: ["SabkaDelivery", "Sabka Delivery Lala"],
  url: "https://sabkadelivery.in/",
};

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "DeliveryService",
  name: "Sabka Delivery",
  url: "https://sabkadelivery.in/",
  logo: "https://sabkadelivery.in/images/sabka-delivery-logo.png",
  image: "https://sabkadelivery.in/images/sabka-delivery-logo.png",

  description:
    "Food, grocery and electronics delivery service in Lala Bazar, Hailakandi, Assam.",

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteJsonLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localBusinessJsonLd),
          }}
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegister />
        <CartFlightAnimation />
        {children}
        <MobileCustomerNav />
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./brand.css";
import "./royal-food.css";
import PwaRegister from "./pwa-register";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {metadataBase: new URL("https://sabkadelivery.in"),
  title: "SABKA DELIVERY — Food & Grocery in Lala Bazar",
  description: "Local restaurant food and daily grocery delivery across Lala Bazar, Hailakandi.",
  verification: {
    google: "cqL2BsLMTDXtjBuCw05kgol9rpdAvTeONcApvZrEniI",
  },
  applicationName: "Sabka Delivery",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sabka Delivery",
  },
  formatDetection: {
    telephone: true,
  },
  other: {
    "codex-preview": "development",
  },
 icons: {
  icon: [
    { url: "/images/sabka-delivery-logo.png", sizes: "32x32", type: "image/png" },
    { url: "/images/sabka-delivery-logo.png", sizes: "192x192", type: "image/png" }
  ],
  apple: "/images/sabka-delivery-logo.png",
},

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karan Nath | Founder | Sabka Delivery",
  description:
    "Official profile of Karan Nath, Founder of Sabka Delivery.",

  keywords: [
    "Karan Nath",
    "Sabka Delivery",
    "Founder",
    "Lala Bazar",
    "Hailakandi",
    "Assam",
  ],

  authors: [
    {
      name: "Karan Nath",
    },
  ],

  creator: "Sabka Delivery",

  openGraph: {
    title: "Karan Nath | Founder",
    description:
      "Founder of Sabka Delivery",
    images: ["/founder/karan.jpg"],
  },
};

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

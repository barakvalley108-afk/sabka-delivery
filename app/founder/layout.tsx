import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karan Nath | Founder & CEO | Sabka Delivery",
  description:
    "Official profile of Karan Nath, Founder & CEO of Sabka Delivery.",

  keywords: [
    "Karan Nath",
    "Sabka Delivery",
    "Founder",
    "CEO",
    "Owner",
    "Lala Bazar",
    "Hailakandi",
    "Assam",
  ],

  authors: [
    {
      name: "Karan Nath",
    },
  ],

  creator: "Karan Nath",

  openGraph: {
    title: "Karan Nath | Founder & CEO",
    description:
      "Founder & CEO of Sabka Delivery",
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

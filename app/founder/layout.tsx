import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner & Founders | Sabka Delivery",
  description:
    "Official leadership information for Sabka Delivery: Owner Prem Kumar Nath; Founders Prem Kumar Nath and Karan Nath.",
  keywords: [
    "Sabka Delivery",
    "Sabka Delivery owner",
    "Sabka Delivery founders",
    "Prem Kumar Nath",
    "Karan Nath",
    "Owner Prem Kumar Nath",
    "Founders Prem Kumar Nath Karan Nath",
    "Lala Bazar",
    "Hailakandi",
    "Assam",
  ],
  authors: [
    { name: "Prem Kumar Nath" },
    { name: "Karan Nath" },
  ],
  creator: "Sabka Delivery",
  publisher: "Sabka Delivery",
  openGraph: {
    title: "Owner & Founders | Sabka Delivery",
    description:
      "Sabka Delivery is owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
    images: ["/founder/prem.png", "/founder/karan.jpg"],
  },
};

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

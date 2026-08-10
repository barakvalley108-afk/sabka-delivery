import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owners, Founders & CEOs | Sabka Delivery",
  description:
    "Official leadership information for Sabka Delivery: Owners Karan Nath and Prem Kumar Nath; Founders Karan Nath and Prem Kumar Nath; CEOs Karan Nath and Prem Kumar Nath.",
  keywords: [
    "Sabka Delivery",
    "Sabka Delivery owner",
    "Sabka Delivery owners",
    "Sabka Delivery founders",
    "Sabka Delivery CEO",
    "Sabka Delivery CEOs",
    "Karan Nath",
    "Prem Kumar Nath",
    "Owner Karan Nath",
    "Owner Prem Kumar Nath",
    "Founder Karan Nath",
    "Founder Prem Kumar Nath",
    "CEO Karan Nath",
    "CEO Prem Kumar Nath",
    "Lala Bazar",
    "Hailakandi",
    "Assam",
  ],
  authors: [{ name: "Karan Nath" }, { name: "Prem Kumar Nath" }],
  creator: "Karan Nath and Prem Kumar Nath",
  publisher: "Sabka Delivery",
  openGraph: {
    title: "Owners, Founders & CEOs | Sabka Delivery",
    description:
      "Sabka Delivery is owned, founded and led by Karan Nath and Prem Kumar Nath.",
    images: ["/founder/karan.jpg", "/founder/prem.png"],
  },
};

export default function FounderLayout({ children }: { children: React.ReactNode }) {
  return children;
}

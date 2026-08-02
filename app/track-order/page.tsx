import type { Metadata } from "next";
import SeoLanding from "../components/seo-landing";

export const metadata: Metadata = {
  title: "Track Your Sabka Delivery Order",
  description: "Open Sabka Delivery and track your food, grocery or electronics order using your order details.",
  alternates: { canonical: "/track-order" },
};

export default function TrackOrderPage() {
  return <SeoLanding eyebrow="Sabka Delivery" title="Track Your Order" description="Open Sabka Delivery, go to History and check the latest status of your order." points={["Check accepted, confirmed and preparation status", "See out-for-delivery updates", "Use the same mobile number used at checkout"]} cta="Open Order History" />;
}

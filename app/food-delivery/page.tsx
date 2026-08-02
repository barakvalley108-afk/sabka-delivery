import type { Metadata } from "next";
import SeoLanding from "../components/seo-landing";

export const metadata: Metadata = {
  title: "Food Delivery in Lala Bazar",
  description: "Order restaurant food online with Sabka Delivery in Lala Bazar, Hailakandi, Assam.",
  alternates: { canonical: "/food-delivery" },
};

export default function FoodDeliveryPage() {
  return <SeoLanding eyebrow="Sabka Delivery" title="Food Delivery in Lala Bazar" description="Order local restaurant food online and get it delivered across supported areas in and around Lala Bazar." points={["Local restaurants and popular dishes", "Fast local delivery", "Cash on Delivery and supported UPI payment"]} cta="Order Food Now" />;
}

import type { Metadata } from "next";
import SeoLanding from "../components/seo-landing";

export const metadata: Metadata = {
  title: "Electronics Delivery in Lala Bazar",
  description: "Browse supported electronics and accessories with Sabka Delivery in Lala Bazar, Hailakandi, Assam.",
  alternates: { canonical: "/electronics-delivery" },
};

export default function ElectronicsDeliveryPage() {
  return <SeoLanding eyebrow="Sabka Delivery" title="Electronics Delivery in Lala Bazar" description="Browse available electronics, accessories and useful gadgets from supported local sellers." points={["Electronics and accessories", "Local availability", "Doorstep delivery in supported areas"]} cta="Browse Electronics" />;
}

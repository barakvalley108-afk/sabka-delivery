import type { Metadata } from "next";
import SeoLanding from "../components/seo-landing";

export const metadata: Metadata = {
  title: "Grocery Delivery in Lala Bazar",
  description: "Order grocery and daily essentials online with Sabka Delivery in Lala Bazar, Hailakandi, Assam.",
  alternates: { canonical: "/grocery-delivery" },
};

export default function GroceryDeliveryPage() {
  return <SeoLanding eyebrow="Sabka Delivery" title="Grocery Delivery in Lala Bazar" description="Shop grocery, packaged food and daily essentials from supported local stores and get convenient doorstep delivery." points={["Daily essentials and packaged grocery", "Local store availability", "Simple cart and checkout"]} cta="Shop Grocery Now" />;
}

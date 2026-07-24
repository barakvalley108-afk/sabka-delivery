import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms and Conditions — Sabka Delivery",
  description: "Terms for using Sabka Delivery.",
};

export default function TermsPage() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">← Back to Sabka Delivery</Link>
      <article>
        <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery" />
        <p className="legal-kicker">LAST UPDATED · 19 JULY 2026</p>
        <h1>Terms and Conditions</h1>
        <p>
          By using Sabka Delivery, you agree to provide accurate order, contact and
          delivery information and to use the service only for lawful purchases.
        </p>

        <h2>Orders and availability</h2>
        <p>
          Items, prices, stock, preparation times and store operating hours may change.
          An order is subject to store acceptance. If an item becomes unavailable, the
          order may be updated, rejected or refunded as applicable.
        </p>

        <h2>Payments and charges</h2>
        <p>
          The checkout total includes applicable item prices, discounts and delivery
          charges. Customers must verify the payee and exact amount in their UPI app
          before authorising payment. Never share a UPI PIN or OTP with a store, rider
          or support agent.
        </p>

        <h2>Cancellation</h2>
        <p>
          A customer can cancel while the order is still in a cancellable state shown
          in Order History. Cancellation may no longer be available after a store
          confirms or starts preparing the order.
        </p>

        <h2>Delivery</h2>
        <p>
          Delivery estimates are not guarantees and can change due to traffic, weather,
          store delays or address issues. Customers must remain reachable at the phone
          number supplied with the order.
        </p>

        <h2>Support</h2>
        <p>
          For order or account assistance, contact WhatsApp support at
          {" "}<a href="https://wa.me/918011767897">+91 80117 67897</a>.
        </p>
      </article>
    </main>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — Sabka Delivery",
  description: "How Sabka Delivery collects and uses information.",
};

export default function PrivacyPolicy() {
  return (
    <main className="legal-page">
      <Link className="legal-back" href="/">← Back to Sabka Delivery</Link>
      <article>
        <img src="/images/sabka-delivery-logo.png" alt="Sabka Delivery" />
        <p className="legal-kicker">LAST UPDATED · 19 JULY 2026</p>
        <h1>Privacy Policy</h1>
        <p>
          Sabka Delivery provides food and grocery ordering services in Lala Bazar,
          Hailakandi, Assam. This policy explains what information is handled when
          customers, stores and delivery partners use our website or Android apps.
        </p>

        <h2>Information we collect</h2>
        <ul>
          <li>Name, mobile number, delivery address and saved address details.</li>
          <li>Cart, order, coupon, payment method and order-status information.</li>
          <li>UPI transaction reference supplied for payment verification. We do not collect or store a UPI PIN.</li>
          <li>Store, restaurant and rider account information used to operate private panels.</li>
          <li>Foreground location when a customer sets a delivery location or a rider chooses to share live delivery location.</li>
          <li>Basic device, browser, session and security logs needed to protect accounts and diagnose problems.</li>
        </ul>

        <h2>How we use information</h2>
        <p>
          We use information to place and fulfil orders, assign stores and riders,
          calculate delivery charges, provide tracking and support, verify payments,
          prevent abuse, and maintain service records.
        </p>

        <h2>Information sharing</h2>
        <p>
          Relevant order details are shared with the selected store and assigned rider
          only as needed to prepare and deliver an order. Information may also be
          disclosed when required by law. We do not sell personal information.
        </p>

        <h2>Payments</h2>
        <p>
          UPI payments open in an installed payment app chosen by the customer. That
          provider processes the payment under its own terms. Sabka Delivery stores
          only the information needed to match and verify an order payment.
        </p>

        <h2>Retention and deletion</h2>
        <p>
          Order and transaction records are retained for service, fraud-prevention and
          legal requirements. To request correction or deletion of eligible personal
          information, contact support on WhatsApp at <a href="https://wa.me/918011767897">+91 80117 67897</a>.
        </p>

        <h2>Security and children</h2>
        <p>
          We use reasonable access controls and secure connections. No online system is
          completely risk-free. Sabka Delivery is not directed to children under 13,
          and children should use it only with a parent or guardian.
        </p>

        <h2>Contact</h2>
        <p>
          Sabka Delivery, Lala Bazar, Hailakandi District, Assam, India.<br />
          WhatsApp support: <a href="https://wa.me/918011767897">+91 80117 67897</a>
        </p>
      </article>
    </main>
  );
}

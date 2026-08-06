import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Karan Nath — Founder and Owner",
  description:
    "Karan Nath is the founder and owner of Sabka Delivery, a local food, grocery and electronics delivery service in Lala Bazar, Hailakandi, Assam.",
  keywords: [
    "Karan Nath",
    "Karan Nath Sabka Delivery",
    "Sabka Delivery founder",
    "Sabka Delivery owner",
  ],
  alternates: { canonical: "/founder" },
  openGraph: {
    title: "Karan Nath — Founder and Owner of Sabka Delivery",
    description:
      "Official founder profile of Karan Nath, founder and owner of Sabka Delivery.",
    url: "https://sabkadelivery.in/founder",
    siteName: "Sabka Delivery",
    type: "profile",
    images: [
      {
        url: "/images/sabka-delivery-logo.png",
        width: 512,
        height: 512,
        alt: "Sabka Delivery",
      },
    ],
  },
};

const founderSchema = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  "@id": "https://sabkadelivery.in/founder#profile-page",
  url: "https://sabkadelivery.in/founder",
  name: "Karan Nath — Founder and Owner of Sabka Delivery",
  mainEntity: {
    "@type": "Person",
    "@id": "https://sabkadelivery.in/#karan-nath",
    name: "Karan Nath",
    url: "https://sabkadelivery.in/founder",
    jobTitle: "Founder and Owner",
    description: "Karan Nath is the founder and owner of Sabka Delivery.",
    worksFor: {
      "@type": "Organization",
      "@id": "https://sabkadelivery.in/#organization",
      name: "Sabka Delivery",
      url: "https://sabkadelivery.in/",
    },
  },
};

export default function FounderPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f5f7f4",
        color: "#12241b",
        padding: "48px 20px",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
      />
      <article
        style={{
          maxWidth: 760,
          margin: "0 auto",
          background: "#ffffff",
          border: "1px solid #dce5df",
          borderRadius: 24,
          padding: "clamp(24px, 6vw, 54px)",
          boxShadow: "0 16px 50px rgba(18,36,27,.08)",
        }}
      >
        <a
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 10,
            color: "#137a48",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          ← Sabka Delivery
        </a>

        <img
          src="/images/sabka-delivery-logo.png"
          alt="Sabka Delivery logo"
          width={112}
          height={112}
          style={{ objectFit: "contain", marginTop: 32 }}
        />

        <p
          style={{
            margin: "28px 0 8px",
            color: "#137a48",
            fontWeight: 800,
            letterSpacing: ".12em",
            textTransform: "uppercase",
            fontSize: 13,
          }}
        >
          Official founder profile
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: "clamp(38px, 8vw, 68px)",
            lineHeight: 1,
            letterSpacing: "-.04em",
          }}
        >
          Karan Nath
        </h1>
        <h2
          style={{
            margin: "14px 0 0",
            fontSize: "clamp(20px, 4vw, 28px)",
            fontWeight: 700,
          }}
        >
          Founder and Owner of Sabka Delivery
        </h2>

        <p style={{ margin: "30px 0 0", fontSize: 18, lineHeight: 1.75, color: "#42544a" }}>
          Karan Nath is the founder and owner of Sabka Delivery, a local delivery
          platform serving Lala Bazar in Hailakandi, Assam. Sabka Delivery helps
          customers order food, groceries and electronics from local businesses.
        </p>

        <section
          style={{
            marginTop: 36,
            paddingTop: 28,
            borderTop: "1px solid #e3e9e5",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 22 }}>About Sabka Delivery</h3>
          <p style={{ margin: "12px 0 0", lineHeight: 1.7, color: "#58685f" }}>
            Sabka Delivery is based in Lala Bazar, Hailakandi, Assam and focuses on
            fast, safe and reliable local delivery.
          </p>
          <a
            href="/"
            style={{
              display: "inline-block",
              marginTop: 22,
              background: "#137a48",
              color: "#ffffff",
              textDecoration: "none",
              padding: "13px 20px",
              borderRadius: 12,
              fontWeight: 800,
            }}
          >
            Visit Sabka Delivery
          </a>
        </section>
      </article>
    </main>
  );
}

export default function FounderSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": "https://sabkadelivery.in/#karan-nath",
    name: "Karan Nath",
    jobTitle: "Founder",
    description:
      "Karan Nath is a founder of Sabka Delivery. He co-founded the company with Prem Kumar Nath.",
    image: "https://sabkadelivery.in/founder/karan.jpg",
    worksFor: {
      "@type": "Organization",
      "@id": "https://sabkadelivery.in/#organization",
      name: "Sabka Delivery",
    },
    alumniOf: {
      "@type": "School",
      name: "Primrose English Medium Senior Secondary School, Lala",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Lala Bazar",
      addressRegion: "Assam",
      addressCountry: "India",
    },
    url: "https://sabkadelivery.in/founder",
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}

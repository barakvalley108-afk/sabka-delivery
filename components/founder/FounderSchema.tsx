export default function FounderSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Karan Nath",
    jobTitle: "Founder & CEO",
    image: "https://sabkadelivery.in/founder/karan.jpg",
    worksFor: {
      "@type": "Organization",
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

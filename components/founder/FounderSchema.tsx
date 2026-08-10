export default function FounderSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "DeliveryService"],
        "@id": "https://sabkadelivery.in/#organization",
        name: "Sabka Delivery",
        url: "https://sabkadelivery.in/",
        description:
          "Sabka Delivery is owned by Prem Kumar Nath and founded by Prem Kumar Nath and Karan Nath.",
        owner: { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
        founder: [
          { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
          { "@id": "https://sabkadelivery.in/#karan-nath" },
        ],
      },
      {
        "@type": "Person",
        "@id": "https://sabkadelivery.in/#prem-kumar-nath",
        name: "Prem Kumar Nath",
        jobTitle: "Owner and Founder",
        description:
          "Prem Kumar Nath is the owner and one of the founders of Sabka Delivery.",
        image: "https://sabkadelivery.in/founder/prem.png",
        worksFor: { "@id": "https://sabkadelivery.in/#organization" },
        url: "https://sabkadelivery.in/about",
      },
      {
        "@type": "Person",
        "@id": "https://sabkadelivery.in/#karan-nath",
        name: "Karan Nath",
        jobTitle: "Founder",
        description:
          "Karan Nath is one of the founders of Sabka Delivery.",
        image: "https://sabkadelivery.in/founder/karan.jpg",
        worksFor: { "@id": "https://sabkadelivery.in/#organization" },
        url: "https://sabkadelivery.in/founder",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

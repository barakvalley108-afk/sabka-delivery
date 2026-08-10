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
          "Sabka Delivery is owned, founded and led by Karan Nath and Prem Kumar Nath.",
        owner: [
          { "@id": "https://sabkadelivery.in/#karan-nath" },
          { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
        ],
        founder: [
          { "@id": "https://sabkadelivery.in/#karan-nath" },
          { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
        ],
        ceo: [
          { "@id": "https://sabkadelivery.in/#karan-nath" },
          { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
        ],
      },
      {
        "@type": "Person",
        "@id": "https://sabkadelivery.in/#karan-nath",
        name: "Karan Nath",
        jobTitle: "Owner, Founder and CEO",
        description: "Karan Nath is an owner, founder and CEO of Sabka Delivery alongside Prem Kumar Nath.",
        image: "https://sabkadelivery.in/founder/karan.jpg",
        worksFor: { "@id": "https://sabkadelivery.in/#organization" },
        url: "https://sabkadelivery.in/founder",
      },
      {
        "@type": "Person",
        "@id": "https://sabkadelivery.in/#prem-kumar-nath",
        name: "Prem Kumar Nath",
        jobTitle: "Owner, Founder and CEO",
        description: "Prem Kumar Nath is an owner, founder and CEO of Sabka Delivery alongside Karan Nath.",
        image: "https://sabkadelivery.in/founder/prem.png",
        worksFor: { "@id": "https://sabkadelivery.in/#organization" },
        url: "https://sabkadelivery.in/about",
      },
    ],
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />;
}

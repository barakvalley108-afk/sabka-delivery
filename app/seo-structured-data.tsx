const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://sabkadelivery.in/#website",
      url: "https://sabkadelivery.in/",
      name: "Sabka Delivery",
      alternateName: ["SabkaDelivery", "Sabka Delivery Lala Bazar"],
      inLanguage: "en-IN",
      publisher: { "@id": "https://sabkadelivery.in/#organization" },
    },
    {
      "@type": ["Organization", "DeliveryService"],
      "@id": "https://sabkadelivery.in/#organization",
      name: "Sabka Delivery",
      legalName: "Sabka Delivery",
      url: "https://sabkadelivery.in/",
      logo: {
        "@type": "ImageObject",
        url: "https://sabkadelivery.in/images/sabka-delivery-logo.png",
      },
      owner: { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
      founder: [
        { "@id": "https://sabkadelivery.in/#prem-kumar-nath" },
        { "@id": "https://sabkadelivery.in/#karan-nath" },
      ],
    },
    {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/#karan-nath",
      name: "Karan Nath",
      url: "https://sabkadelivery.in/founder",
      jobTitle: "Founder",
      worksFor: { "@id": "https://sabkadelivery.in/#organization" },
      description: "Karan Nath is a founder of Sabka Delivery. He co-founded the company with Prem Kumar Nath.",
      image: "https://sabkadelivery.in/founder/karan.jpg",
    },
    {
      "@type": "Person",
      "@id": "https://sabkadelivery.in/#prem-kumar-nath",
      name: "Prem Kumar Nath",
      url: "https://sabkadelivery.in/about",
      jobTitle: "Owner and Founder",
      worksFor: { "@id": "https://sabkadelivery.in/#organization" },
      description: "Prem Kumar Nath is the owner and founder of Sabka Delivery. He co-founded the company with Karan Nath.",
      image: "https://sabkadelivery.in/founder/prem.png",
    },
    {
      "@type": "ItemList",
      name: "Sabka Delivery quick links",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Founder — Karan Nath", url: "https://sabkadelivery.in/founder" },
        { "@type": "ListItem", position: 2, name: "Food Delivery", url: "https://sabkadelivery.in/food-delivery" },
        { "@type": "ListItem", position: 3, name: "Grocery Delivery", url: "https://sabkadelivery.in/grocery-delivery" },
        { "@type": "ListItem", position: 4, name: "Electronics Delivery", url: "https://sabkadelivery.in/electronics-delivery" },
        { "@type": "ListItem", position: 5, name: "Track Order", url: "https://sabkadelivery.in/track-order" },
      ],
    },
  ],
};

export default function SeoStructuredData() {
  return (
    <script
      id="sabka-delivery-website-schema"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}

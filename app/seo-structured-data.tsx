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
      "@type": "Organization",
      "@id": "https://sabkadelivery.in/#organization",
      name: "Sabka Delivery",
      url: "https://sabkadelivery.in/",
      logo: {
        "@type": "ImageObject",
        url: "https://sabkadelivery.in/images/sabka-delivery-logo.png",
      },
    },
    {
      "@type": "ItemList",
      name: "Sabka Delivery quick links",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Food Delivery",
          url: "https://sabkadelivery.in/food-delivery",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Grocery Delivery",
          url: "https://sabkadelivery.in/grocery-delivery",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Electronics Delivery",
          url: "https://sabkadelivery.in/electronics-delivery",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "Track Order",
          url: "https://sabkadelivery.in/track-order",
        },
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

import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://sabkadelivery.in/",
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}

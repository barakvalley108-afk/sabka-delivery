import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://sabkadelivery.in";
  const now = new Date();

  return [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/food-delivery`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/grocery-delivery`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/electronics-delivery`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/track-order`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}

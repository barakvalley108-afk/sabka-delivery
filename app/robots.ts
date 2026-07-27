import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/super-admin/",
        "/panel/",
        "/api/",
      ],
    },
    sitemap: "https://sabkadelivery.in/sitemap.xml",
    host: "https://sabkadelivery.in",
  };
}

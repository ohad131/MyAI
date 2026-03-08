import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const origin = siteConfig.url?.origin;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: origin ? `${origin}/sitemap.xml` : undefined,
    host: origin,
  };
}
import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const ROUTES = [
  "",
  "/chat",
  "/code",
  "/images",
  "/gems",
  "/agents",
  "/memory",
  "/settings",
  "/design-system",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteConfig.url?.origin ?? "http://localhost:3000";
  const now = new Date();

  return ROUTES.map((route) => ({
    url: `${origin}${route}`,
    lastModified: now,
  }));
}
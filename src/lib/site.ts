export function parseSiteUrl(value: string | null | undefined): URL | null {
  if (!value) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

export const siteConfig = {
  name: "MyAI",
  description:
    "MyAI workspace for chat, code, images, agents, memory, and settings.",
  locale: "en_US",
  url: parseSiteUrl(process.env.NEXT_PUBLIC_SITE_URL),
};
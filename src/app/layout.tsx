import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import { siteConfig } from "@/lib/site";
import "@/index.css";

const themeInitScript = `
(() => {
  const root = document.documentElement;
  let mode = "system";

  try {
    const stored = localStorage.getItem("myai-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      mode = stored;
    }
  } catch {}

  const theme =
    mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : mode === "system"
        ? "light"
        : mode;

  root.classList.remove("light", "dark");
  root.classList.add(theme);
  root.dataset.themeMode = mode;
})();
`;

export const metadata: Metadata = {
  metadataBase: siteConfig.url ?? undefined,
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    type: "website",
    siteName: siteConfig.name,
    locale: siteConfig.locale,
    url: siteConfig.url?.toString(),
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  alternates: siteConfig.url ? { canonical: "/" } : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

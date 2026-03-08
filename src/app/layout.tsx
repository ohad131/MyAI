import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import { siteConfig } from "@/lib/site";
import "@/index.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem("myai-theme")||"dark";var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);}catch(e){document.documentElement.classList.add("dark");}})();`;

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
      <body suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
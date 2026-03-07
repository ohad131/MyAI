import type { Metadata } from "next";
import AppProviders from "@/components/AppProviders";
import "@/index.css";

const themeInitScript = `(function(){try{var t=localStorage.getItem("myai-theme")||"dark";var d=document.documentElement;d.classList.remove("light","dark");d.classList.add(t);}catch(e){document.documentElement.classList.add("dark");}})();`;

export const metadata: Metadata = {
  title: "MyAI",
  description: "MyAI web app",
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

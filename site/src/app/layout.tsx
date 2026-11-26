import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanilla & Somethin",
  description:
    "Vanilla & Somethin’ is an innovative architecture and design studio crafting timeless spaces that blend emotion, technology, and storytelling through architecture and furniture design.",
};

// Runs before paint so the stored/system theme never flashes (source: localStorage "theme").
const themeInit = `(function(){try{var t=localStorage.getItem("theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="antialiased">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body className="min-h-full bg-vs-bg text-vs-fg">{children}</body>
    </html>
  );
}

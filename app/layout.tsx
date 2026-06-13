import type { Metadata } from "next";

// After your first `npm run framer:export`, unframer writes src/framer/styles.css
// (Framer's global styles + fonts). Uncomment this line to load it site-wide:
// import "../src/framer/styles.css";

export const metadata: Metadata = {
  title: "Vanilla & Somethin",
  description:
    "Vanilla & Somethin' is an innovative architecture and design studio crafting timeless spaces that blend emotion, technology, and storytelling through architecture and furniture design.",
  metadataBase: new URL("https://www.vanillasometh.in"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

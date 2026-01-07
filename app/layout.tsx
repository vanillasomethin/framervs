import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vanilla & Somethin",
  description:
    "Vanilla & Somethin’ is an innovative architecture and design studio crafting timeless spaces that blend emotion, technology, and storytelling through architecture and furniture design.",
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

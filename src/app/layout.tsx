import type { Metadata } from "next";
import { Space_Grotesk, Fragment_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

const fragmentMono = Fragment_Mono({
  variable: "--font-fragment-mono",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Vanilla & Somethin",
  description:
    "Vanilla & Somethin' is an innovative architecture and design studio crafting timeless spaces that blend emotion, technology, and storytelling through architecture and furniture design.",
  openGraph: {
    title: "Vanilla & Somethin",
    description:
      "Vanilla & Somethin' is an innovative architecture and design studio crafting timeless spaces that blend emotion, technology, and storytelling through architecture and furniture design.",
    images: [
      {
        url: "https://framerusercontent.com/images/GfGHsUHib7Hu45pcUoEfLk9Fkk.jpg",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanilla & Somethin",
    description:
      "Vanilla & Somethin' is an innovative architecture and design studio crafting timeless spaces that blend emotion, technology, and storytelling through architecture and furniture design.",
    images: [
      "https://framerusercontent.com/images/GfGHsUHib7Hu45pcUoEfLk9Fkk.jpg",
    ],
  },
  icons: {
    icon: [
      {
        url: "https://framerusercontent.com/images/Z7GZxBTR11gVCaDzkL4WF3L9py8.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "https://framerusercontent.com/images/4ptIsxEBu3lnkNnvTf6AM5SO26Q.png",
        media: "(prefers-color-scheme: dark)",
      },
    ],
    apple:
      "https://framerusercontent.com/images/w7OfGnxhhblYl2ynuAjeFuUv0o.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spaceGrotesk.variable} ${fragmentMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

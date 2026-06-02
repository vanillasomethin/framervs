export const metadata = {
  title: "Vanilla & Somethin",
  description: "Architecture and interior design studio.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

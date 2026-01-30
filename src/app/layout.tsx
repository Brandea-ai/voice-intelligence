import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Voice Intelligence",
  description: "Sprache zu Text mit KI-Anreicherung",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}

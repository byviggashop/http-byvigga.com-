import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "By Vigga · Handmade Jewelry",
  description: "Håndlavede smykker med unikke designs. Bestil og betal med MobilePay efter aftale.",
  icons: {
    icon: "/assets/brand/favicon.svg",
    shortcut: "/assets/brand/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className="antialiased">{children}</body>
    </html>
  );
}

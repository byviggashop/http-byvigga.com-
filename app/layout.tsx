import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://byvigga.com"),
  title: "By Vigga | Håndlavede smykker",
  description: "Oplev By Viggas håndlavede smykker med unikke designs. Find armbånd, halskæder, ringe og øreringe, og bestil dit personlige smykke.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{url:"/favicon.svg",type:"image/svg+xml",sizes:"any"},{url:"/favicon-96x96.png",type:"image/png",sizes:"96x96"},{url:"/favicon.ico"}],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
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

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Silkscreen } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const silkscreen = Silkscreen({
  weight: "400",
  variable: "--font-silkscreen",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "NY26",
  description: "Rebooting the world for 2026.",
  openGraph: {
    title: "NY26",
    description: "Rebooting the world for 2026. Are you ready?",
    url: "https://ny26.com", // Replace with actual domain if known
    siteName: "NY26",
    images: [
      {
        url: "/ccc.jpg",
        width: 900,
        height: 900,
        alt: "NY26 System Reboot",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NY26",
    description: "Rebooting the world for 2026.",
    images: ["/ccc.jpg"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${silkscreen.variable} antialiased selection:bg-cyber-pink selection:text-white`}
      >
        <div className="noise-overlay" />
        <div className="scanline" />
        <script src="//cdn.jsdelivr.net/npm/eruda"></script>
        <script>eruda.init();</script>
        {children}
        <Analytics />
      </body>
    </html>
  );
}

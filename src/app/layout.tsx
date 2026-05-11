import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Caveat } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

const body = Inter({
  variable: "--font-body",
  weight: ["400", "500", "600"],
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["400", "600"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Marginalia & Co.",
  description: "A cozy reading room of your own.",
  manifest: "/manifest.webmanifest",
  applicationName: "Marginalia & Co.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Marginalia",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Marginalia & Co.",
    description: "A cozy reading room of your own.",
    siteName: "Marginalia & Co.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a0905",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-SG" className={`${display.variable} ${body.variable} ${caveat.variable} h-full antialiased`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="preconnect" href="https://books.google.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://books.google.com" />
        <link rel="dns-prefetch" href="https://covers.openlibrary.org" />
      </head>
      <body className="min-h-full bg-mahogany text-parchment font-body">{children}</body>
    </html>
  );
}

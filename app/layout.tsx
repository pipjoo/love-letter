import type { Metadata } from "next";
import { Cedarville_Cursive, Instrument_Sans, Instrument_Serif } from "next/font/google";
import { content } from "./content";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cedarville = Cedarville_Cursive({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-hand",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

const site = process.env.NEXT_PUBLIC_SITE_URL;

export const metadata: Metadata = {
  // Vercel fills this in itself; other hosts set NEXT_PUBLIC_SITE_URL so the preview image has a full URL
  metadataBase: site ? new URL(site) : undefined,
  title: content.meta.title,
  description: content.meta.description,
  // the image comes from opengraph-image.tsx
  openGraph: {
    title: content.meta.title,
    description: content.meta.description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: content.meta.title,
    description: content.meta.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable} ${instrumentSerif.variable} ${cedarville.variable}`}>
      <head>
        <style>{`:root{--table:${content.theme.table};--bg:${content.theme.table};--paper:${content.theme.paper};--paper-shade:${content.theme.paperShade};--ink:${content.theme.ink};--text:${content.theme.text};}`}</style>
      </head>
      <body>{children}</body>
    </html>
  );
}

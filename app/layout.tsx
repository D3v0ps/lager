import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import PwaRegister from "./_components/PwaRegister";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saldo — Operations, Portal & Bygg",
  description:
    "Det operativa navet för svenska företag. Lager, B2B-portal och projektledning för bygg — synkat med Fortnox.",
  manifest: "/manifest.webmanifest",
  applicationName: "Saldo",
  appleWebApp: {
    capable: true,
    title: "Saldo",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="sv"
      className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-amber focus:px-3 focus:py-2 focus:text-sm focus:text-black"
        >
          Hoppa till innehåll
        </a>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}

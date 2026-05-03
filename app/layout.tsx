import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Saldo — operativa navet för svenska e-handlare",
  description:
    "Saldo sköter lager, ordrar, inköp och frakt — synkat med Fortnox i bakgrunden. Inga dubbelregistreringar. Inga konnektor-avgifter.",
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
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Header from "./_components/Header";
import Footer from "./_components/Footer";

export const metadata: Metadata = {
  title: "Saldo — operativa navet för svenska e-handlare",
  description:
    "Saldo sköter lager, ordrar, inköp och frakt. Fortnox sköter bokföringen. Inga dubbelregistreringar, ingen integration att betala för.",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

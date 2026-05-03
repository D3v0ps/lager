import type { Metadata } from "next";
import Header from "./_components/Header";
import Footer from "./_components/Footer";

export const metadata: Metadata = {
  title: "Saldo — enkel lagerhantering för svenska företag",
  description:
    "Saldo hjälper svenska e-handlare och småföretag hålla ordning på sitt lager — utan krångel. Personlig svensk support hela vägen.",
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}

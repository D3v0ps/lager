import Link from "next/link";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <Link href="/app/" className="font-semibold text-lg">
            Saldo
          </Link>
          <nav className="flex gap-4 text-sm items-center">
            <Link href="/app/dashboard/" className="hover:underline">
              Dashboard
            </Link>
            <Link href="/app/" className="hover:underline">
              Produkter
            </Link>
            <Link href="/app/categories/" className="hover:underline">
              Kategorier
            </Link>
            <Link href="/app/movements/" className="hover:underline">
              Rörelser
            </Link>
            <Link href="/app/import/" className="hover:underline">
              Import
            </Link>
            <Link
              href="/app/products/new/"
              className="rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-3 py-1.5"
            >
              + Ny produkt
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
      </main>
    </>
  );
}

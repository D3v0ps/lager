import Link from "next/link";

export default function NotFound() {
  return (
    <div className="text-center py-16">
      <h1 className="text-3xl font-semibold mb-2">404</h1>
      <p className="text-neutral-600 dark:text-neutral-400 mb-6">
        Sidan hittades inte.
      </p>
      <Link
        href="/"
        className="inline-block rounded-md bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 text-white px-4 py-2"
      >
        Tillbaka till listan
      </Link>
    </div>
  );
}

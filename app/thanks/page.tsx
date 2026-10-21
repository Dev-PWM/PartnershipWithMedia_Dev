import Link from "next/link";

export const metadata = { title: "Thank you", robots: { index: false } };

export default function ThanksPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Thank you</h1>
      <p className="mt-4">
        Payment received. A confirmation is on its way to your inbox, and I&apos;ll be in touch shortly.
      </p>
      <Link href="/" className="mt-8 inline-block underline">
        Back to home
      </Link>
    </main>
  );
}

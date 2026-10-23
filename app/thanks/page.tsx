import Link from "next/link";
import { contact } from "@/lib/content";
import { billingPortalUrl } from "@/lib/site";

export const metadata = { title: "Thank you", robots: { index: false } };

// Checkout adds ?plan=subscription for the maintenance plan.
export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[] }> }) {
  const subscribed = (await searchParams).plan === "subscription";

  return (
    <main className="mx-auto max-w-xl px-6 py-32 text-center">
      <h1 className="text-3xl font-semibold">Thank you</h1>
      <p className="mt-4">
        Payment received. A confirmation is on its way to your inbox, and I&apos;ll be in touch shortly.
      </p>
      {subscribed && (
        <p className="mt-4">
          Your maintenance plan renews monthly. To cancel or update your card,{" "}
          {billingPortalUrl ? (
            <a href={billingPortalUrl} className="underline">
              use your billing page
            </a>
          ) : (
            <>
              email{" "}
              <a href={`mailto:${contact.email.toLowerCase()}`} className="underline">
                {contact.email.toLowerCase()}
              </a>
            </>
          )}
          .
        </p>
      )}
      <Link href="/" className="mt-8 inline-block underline">
        Back to home
      </Link>
    </main>
  );
}

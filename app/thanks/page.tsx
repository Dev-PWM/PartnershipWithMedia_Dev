import Link from "next/link";
import { contact } from "@/lib/content";
import { billingPortalUrl } from "@/lib/site";

export const metadata = { title: "Thank you", robots: { index: false } };

const button = "inline-block bg-accent text-bgdark font-black uppercase tracking-widest text-sm px-6 py-4 font-brutalist";
const ghost = "inline-block border-2 border-border text-textlight font-black uppercase tracking-widest text-sm px-6 py-4 font-brutalist hover:border-accent transition-colors";

// Checkout adds ?plan=subscription for the maintenance plan.
export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[] }> }) {
  const subscribed = (await searchParams).plan === "subscription";
  const email = contact.email.toLowerCase();

  return (
    <main className="mx-auto max-w-2xl px-6 py-32">
      <p className="text-accent text-xs font-black uppercase tracking-widest mb-4">
        {subscribed ? "Plan active" : "Payment confirmed"}
      </p>
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">Thank you</h1>
      <p className="text-muted text-lg font-bold leading-relaxed">
        {subscribed
          ? "Your Maintenance Plan is active. A welcome email with everything it covers is on its way to your inbox."
          : "Your payment went through. A confirmation with your next steps is on its way to your inbox, and I'll be in touch within one business day."}
      </p>

      {subscribed && (
        <div className="mt-10 border-2 border-border p-6">
          <h2 className="font-black uppercase tracking-wide font-brutalist mb-2">Managing your plan</h2>
          <p className="text-muted text-sm font-bold leading-relaxed">
            Your plan renews monthly until you cancel. You can cancel, update your card or download invoices any time
            {billingPortalUrl ? (
              <> from your billing page. If you cancel, your plan stays active until the end of the month you paid for.</>
            ) : (
              <> by emailing <a href={`mailto:${email}`} className="text-accent underline break-all">{email}</a>.</>
            )}
          </p>
        </div>
      )}

      <div className="mt-10 flex flex-wrap gap-4">
        {subscribed && billingPortalUrl ? (
          <a href={billingPortalUrl} className={button}>Manage your plan &rarr;</a>
        ) : null}
        <Link href="/" className={subscribed && billingPortalUrl ? ghost : button}>Back to home</Link>
      </div>

      <p className="mt-10 text-muted text-sm font-bold">
        Questions? Reply to any of my emails, or write to{" "}
        <a href={`mailto:${email}`} className="text-accent underline break-all">{email}</a>.
      </p>
    </main>
  );
}

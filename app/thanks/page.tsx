import Link from "next/link";
import { contact } from "@/lib/content";
import { billingPortalUrl } from "@/lib/site";
import { getStripe } from "@/lib/stripe";

export const metadata = { title: "Thank you", robots: { index: false } };

const button = "inline-block bg-accent text-bgdark font-black uppercase tracking-widest text-sm px-6 py-4 font-brutalist";
const ghost = "inline-block border-2 border-border text-textlight font-black uppercase tracking-widest text-sm px-6 py-4 font-brutalist hover:border-accent transition-colors";

// Bank payments (ACH debit, bank transfer) finish Checkout before the money arrives: the session is complete but unpaid,
// and the confirmation email only goes out once it clears (the webhook's async_payment_succeeded). Ask Stripe which case
// this is, so the page never says "payment confirmed" too early. Any doubt (no id, a lookup error) falls back to the
// usual message, which is right for cards, wallets and pay-later options. Only the status is used; nothing about the
// buyer is shown.
async function paymentPending(sessionId: unknown) {
  if (typeof sessionId !== "string" || !/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return false;
  try {
    const session = await getStripe().checkout.sessions.retrieve(sessionId);
    return session.status === "complete" && session.payment_status === "unpaid";
  } catch {
    return false;
  }
}

// Checkout adds ?session_id=… to every return, and &plan=subscription for the maintenance plan.
export default async function ThanksPage({ searchParams }: { searchParams: Promise<{ plan?: string | string[]; session_id?: string | string[] }> }) {
  const params = await searchParams;
  const subscribed = params.plan === "subscription";
  const pending = await paymentPending(params.session_id);
  const email = contact.email.toLowerCase();

  return (
    <main className="mx-auto max-w-2xl px-6 py-32">
      <p className="text-accent text-xs font-black uppercase tracking-widest mb-4">
        {pending ? "Payment processing" : subscribed ? "Plan active" : "Payment confirmed"}
      </p>
      <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">Thank you</h1>
      <p className="text-muted text-lg font-bold leading-relaxed">
        {pending
          ? "Your order is in. Bank payments take a few business days to clear. If you chose a bank transfer, send it using the details Stripe just gave you. As soon as the money arrives, you'll get a confirmation email with your next steps."
          : subscribed
            ? "Your Maintenance Plan is active. A welcome email with everything it covers is on its way to your inbox."
            : "Your payment went through. A confirmation with your next steps is on its way to your inbox, and I'll be in touch within one business day."}
      </p>

      {subscribed && !pending && (
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

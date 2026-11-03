import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AgreementText from "@/components/AgreementText";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SignAgreement from "@/components/SignAgreement";
import { AGREEMENTS, CURRENT_AGREEMENT, signingOpen } from "@/lib/agreement";
import { contact, hosting, orderScope } from "@/lib/content";
import { offerName } from "@/lib/emails";
import { findOrder, formatMoney, isOrderToken, ordersEnabled, type OrderView } from "@/lib/orders";
import type { Offer } from "@/lib/stripe";

// A buyer's private order page, reached only from the link in their confirmation email. The token in the address is
// the only key (next.config.ts serves this route with no-referrer, no-store and noindex), so nothing here is public.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your order", robots: { index: false, follow: false } };

const BUILD_STEPS = ["paid", "agreement_signed", "kickoff", "in_build", "in_review", "live"] as const;
const STEP_LABELS: Record<(typeof BUILD_STEPS)[number], string> = {
  paid: "Paid", agreement_signed: "Agreement signed", kickoff: "Kickoff", in_build: "In build", in_review: "Your review", live: "Live",
};
const date = (iso: string) => new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Los_Angeles" });

export default async function OrderPage({ params }: PageProps<"/orders/[token]">) {
  const { token } = await params;
  if (!ordersEnabled() || !isOrderToken(token)) notFound();
  let order: OrderView | null;
  try {
    order = await findOrder(token);
  } catch (err) {
    console.error("Order page: lookup failed.", err);
    return (
      <Shell>
        <h1 className="text-4xl font-black uppercase tracking-tight font-brutalist">Order page unavailable</h1>
        <p className="mt-6 text-muted font-bold leading-relaxed">
          Your order is safe, but this page couldn&apos;t load right now. Please try again in a few minutes, or email{" "}
          <a className="text-accent underline break-all" href={`mailto:${contact.email.toLowerCase()}`}>{contact.email.toLowerCase()}</a>.
        </p>
      </Shell>
    );
  }
  if (!order) notFound();

  const signed = order.agreement;
  const agreement = (signed && AGREEMENTS[signed.version]) || CURRENT_AGREEMENT;
  const steps = BUILD_STEPS.filter((s) => order.requires_agreement || s !== "agreement_signed");
  const reached = steps.indexOf(order.status as (typeof steps)[number]);
  const halted = ["on_hold", "cancelled", "refunded"].includes(order.status);
  const awaitingSignature = order.requires_agreement && !signed && order.status === "paid";

  return (
    <Shell>
      <p className="text-muted text-sm font-bold uppercase tracking-widest">Order {order.code}</p>
      <h1 className="mt-3 text-4xl md:text-5xl font-black uppercase tracking-tight font-brutalist">{offerName(order.offer as Offer)}</h1>
      <p className="mt-2 text-2xl font-black text-accent font-brutalist">{formatMoney(order.amount_cents, order.currency)}</p>
      {order.client_site && <p className="mt-4 font-bold">For <span className="text-accent">{order.client_site}</span></p>}

      <section aria-labelledby="status-heading" className="mt-12">
        <h2 id="status-heading" className="text-xs font-black uppercase tracking-widest text-muted">Status</h2>
        <p className="mt-2 text-2xl font-black uppercase font-brutalist" role="status">{order.status_label}</p>
        {halted && (
          <p className="mt-3 text-sm font-bold text-muted">
            {order.status === "on_hold" ? "This project is paused. Check the latest update below or reply to any of my emails." : "This order is closed. Reply to any of my emails with questions."}
          </p>
        )}
        {order.live_url && (
          <p className="mt-3 font-bold">Your site: <a className="text-accent underline break-all" href={order.live_url}>{order.live_url}</a></p>
        )}
        {!halted && (
          <ol className="mt-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {steps.map((s, i) => (
              <li key={s} className={`border-2 p-3 text-xs font-black uppercase tracking-widest ${i <= reached ? "border-accent text-textlight" : "border-border text-muted"}`}>
                <span className="sr-only">{i < reached ? "Done: " : i === reached ? "Current: " : "Upcoming: "}</span>
                {STEP_LABELS[s]}
              </li>
            ))}
          </ol>
        )}
      </section>

      {awaitingSignature && (
        <section aria-labelledby="sign-heading" className="mt-16 border-2 border-accent p-6 md:p-8">
          <h2 id="sign-heading" className="text-2xl font-black uppercase font-brutalist">Sign your agreement</h2>
          <p className="mt-3 text-muted font-bold leading-relaxed">Read the agreement below. Work on your project starts once it&apos;s signed.</p>
          <Scope offer={order.offer} />
          <div className="mt-8"><AgreementText agreement={agreement} /></div>
          <div className="mt-10">
            {signingOpen(agreement) ? (
              <SignAgreement token={token} version={agreement.version} defaultName={order.buyer_name ?? ""} />
            ) : (
              <p role="status" className="font-bold">
                Signing isn&apos;t open on this page yet. Reply to your confirmation email and I&apos;ll sort it out with you.
              </p>
            )}
          </div>
        </section>
      )}

      {signed && (
        <section aria-labelledby="signed-heading" className="mt-16">
          <h2 id="signed-heading" className="text-2xl font-black uppercase font-brutalist">Your signed agreement</h2>
          <p className="mt-3 text-muted font-bold">
            Signed by {signed.signer_name} on {date(signed.signed_at)} (version {signed.version}).
          </p>
          <p className="mt-1 text-xs text-muted font-bold break-all">Record fingerprint (SHA-256): {signed.sha256}</p>
          <Scope offer={order.offer} />
          <details className="mt-6 border-2 border-border p-6">
            <summary className="cursor-pointer font-black uppercase tracking-widest text-sm">Read the agreement</summary>
            <div className="mt-6"><AgreementText agreement={agreement} /></div>
          </details>
        </section>
      )}

      <section aria-labelledby="updates-heading" className="mt-16">
        <h2 id="updates-heading" className="text-2xl font-black uppercase font-brutalist">Updates</h2>
        <ol className="mt-6 space-y-4">
          {[...order.events].reverse().map((e, i) => (
            <li key={i} className="border-l-4 border-accent pl-4">
              <p className="font-black">{e.title}</p>
              {e.detail && <p className="text-muted font-bold whitespace-pre-line">{e.detail}</p>}
              <p className="text-xs text-muted font-bold uppercase tracking-widest mt-1">{date(e.created_at)}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="hosting-heading" className="mt-16">
        <h2 id="hosting-heading" className="text-2xl font-black uppercase font-brutalist">Hosting and your domain</h2>
        <ul className="mt-4 space-y-2">
          {hosting.points.map((p) => (
            <li key={p} className="font-bold text-muted"><span aria-hidden="true" className="text-accent mr-2">+</span>{p}</li>
          ))}
        </ul>
      </section>

      <p className="mt-16 text-sm text-muted font-bold">
        This page is private to you; please don&apos;t share its link. Questions? Reply to any of my emails or write to{" "}
        <a className="text-accent underline break-all" href={`mailto:${contact.email.toLowerCase()}`}>{contact.email.toLowerCase()}</a>.{" "}
        <Link href="/how-it-works" className="underline">How it works</Link>
      </p>
    </Shell>
  );
}

// The package scope recorded with the signature: shown before signing and alongside the signed copy.
function Scope({ offer }: { offer: string }) {
  const scope = orderScope(offer);
  return (
    <div className="mt-8 border-2 border-border p-6">
      <h3 className="text-xs font-black uppercase tracking-widest text-muted">What&apos;s included</h3>
      <p className="mt-3 font-bold leading-relaxed">{scope.description}</p>
      {scope.timeline && <p className="mt-3 text-sm font-bold">Typical timeline: <span className="text-accent">{scope.timeline}</span></p>}
      {scope.youProvide.length > 0 && (
        <ul className="mt-3 space-y-1">
          {scope.youProvide.map((x) => (
            <li key={x} className="text-sm font-bold text-muted"><span aria-hidden="true" className="text-accent mr-2">+</span>{x}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main id="main" className="max-w-4xl mx-auto px-6 py-16 md:py-24">{children}</main>
      <Footer />
    </>
  );
}

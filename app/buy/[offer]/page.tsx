import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutButton from "@/components/CheckoutButton";
import { canPayOverTime, deliveryProcess, maintenance, packageDetails, packages, payOverTime } from "@/lib/content";
import { orderFlowLive } from "@/lib/orders";
import { cleanClientSite } from "@/lib/checkout";
import { isOffer } from "@/lib/stripe";

export const metadata = { title: "Confirm your purchase", robots: { index: false, follow: false } };

// /buy/<offer>?site=<client hostname>: where a client's own site sends them to buy or upgrade
// (for example a link in their dashboard). It only shows the offer; Stripe Checkout starts when
// they press Buy, so link previews and crawlers never create a session.
export default async function BuyPage({ params, searchParams }: PageProps<"/buy/[offer]">) {
  const { offer } = await params;
  const site = cleanClientSite((await searchParams).site);
  const item = packages.find((p) => p.offer === offer) ?? (offer === maintenance.offer ? { ...maintenance, price: `${maintenance.price}/${maintenance.interval}` } : undefined);
  if (!isOffer(offer) || !item) notFound();
  const details = offer in packageDetails ? packageDetails[offer as keyof typeof packageDetails] : undefined;
  const ordersOn = orderFlowLive();
  const delivery = deliveryProcess(ordersOn);

  return (
    <main className="mx-auto max-w-xl px-6 py-32">
      <p className="text-muted text-sm font-bold uppercase tracking-widest">Confirm your purchase</p>
      <h1 className="mt-3 text-4xl font-black uppercase tracking-tight font-brutalist">{item.name}</h1>
      <p className="mt-2 text-3xl font-black text-accent font-brutalist">{item.price}</p>
      {site && (
        <p className="mt-6 font-bold">
          For <span className="text-accent">{site}</span>
        </p>
      )}
      {"tagline" in item && <p className="mt-6 text-xl font-black leading-snug">{item.tagline}</p>}
      <p className="mt-4 text-muted leading-relaxed font-bold">{item.body}</p>
      {"bestFor" in item && <p className="mt-3 font-bold"><span className="text-accent uppercase tracking-widest text-xs">Best for: </span>{item.bestFor}</p>}
      {"tagline" in item && <p className="mt-3 text-sm text-muted font-bold">{canPayOverTime(item.price) ? payOverTime : "Paid in full at checkout."}</p>}
      {/* Build packages: how delivery works, shown before payment so nothing about hosting or signing is a surprise. */}
      {details && (
        <section aria-labelledby="process-heading" className="mt-10 border-2 border-border p-6">
          <h2 id="process-heading" className="text-xs font-black uppercase tracking-widest text-muted">Before you buy</h2>
          <p className="mt-3 text-sm font-bold">Typical timeline: <span className="text-accent">{details.timeline}</span></p>
          <ol className="mt-4 space-y-2 list-decimal list-inside text-sm font-bold">
            {delivery.steps.map((s) => (
              <li key={s.title}>{s.title}: <span className="text-muted">{s.body}</span></li>
            ))}
          </ol>
          <ul className="mt-4 space-y-1 text-sm font-bold text-muted">
            {delivery.hostingPoints.slice(0, 2).map((p) => (
              <li key={p}><span aria-hidden="true" className="text-accent mr-2">+</span>{p}</li>
            ))}
          </ul>
          <p className="mt-4 text-sm font-bold">
            <Link href={`/how-it-works#${offer}`} className="text-accent underline">What you&apos;ll provide</Link>
            {ordersOn && (
              <>
                {" · "}
                <Link href="/agreement" className="text-accent underline">The agreement you&apos;ll sign</Link>
              </>
            )}
          </p>
        </section>
      )}
      <div className="mt-10">
        <CheckoutButton offer={offer} site={site}>
          Buy {item.name}
        </CheckoutButton>
      </div>
      <Link href="/#pricing" className="mt-8 inline-block underline">
        Compare all packages
      </Link>
    </main>
  );
}

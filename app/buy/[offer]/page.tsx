import Link from "next/link";
import { notFound } from "next/navigation";
import CheckoutButton from "@/components/CheckoutButton";
import { maintenance, packages } from "@/lib/content";
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
      <p className="mt-6 text-muted leading-relaxed font-bold">{item.body}</p>
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

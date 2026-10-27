import { contact, deposit, maintenance, packages } from "@/lib/content";
import { billingPortalUrl } from "@/lib/site";
import CheckoutButton from "./CheckoutButton";

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-24 md:py-32 border-t-2 border-border">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 id="pricing-heading" className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">
            Packages
          </h2>
          <p className="text-muted text-xl max-w-2xl mx-auto">
            Every build has a fixed price, paid once, so you know the cost up front. Ongoing care is monthly. Not sure which fits?{" "}
            <a href="#contact" className="text-accent underline">Ask me first.</a>
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {packages.map((p) => (
            <div key={p.offer} className="bg-surface service-card p-8 flex flex-col">
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight font-brutalist">{p.name}</h3>
              <p className="text-4xl font-black text-accent mb-6 font-brutalist">{p.price}</p>
              <p className="text-muted text-sm leading-relaxed font-bold mb-10 grow">{p.body}</p>
              <CheckoutButton offer={p.offer}>Buy {p.name}</CheckoutButton>
            </div>
          ))}
        </div>
        <div className="mt-8 border-2 border-border p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
          <p className="text-muted text-sm leading-relaxed font-bold">
            <span className="text-textlight font-black uppercase font-brutalist text-lg block mb-2">
              Custom project · <span className="text-accent">{deposit.price}</span> deposit
            </span>
            {deposit.body}
          </p>
          <CheckoutButton offer={deposit.offer}>Pay deposit</CheckoutButton>
        </div>
        <div className="mt-8 border-2 border-accent p-8 grid md:grid-cols-[1fr_16rem] gap-8 items-start">
          <div>
            <h3 className="text-textlight font-black uppercase font-brutalist text-lg mb-2">
              {maintenance.name} · <span className="text-accent">{maintenance.price}</span>/{maintenance.interval}
            </h3>
            <p className="text-muted text-sm leading-relaxed font-bold mb-6">{maintenance.body}</p>
            <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mb-6">
              {maintenance.perks.map((perk) => (
                <li key={perk} className="text-sm font-bold text-textlight">
                  <span aria-hidden="true" className="text-accent mr-2">+</span>
                  {perk}
                </li>
              ))}
            </ul>
            <p className="text-muted text-xs leading-relaxed font-bold">{maintenance.fairUse}</p>
          </div>
          <div>
            <CheckoutButton offer={maintenance.offer}>Subscribe monthly</CheckoutButton>
            {/* Auto-renewal terms sit next to the button on purpose (California's auto-renewal law). */}
            <p className="mt-3 text-xs text-muted font-bold leading-relaxed">
              {maintenance.price} charged every {maintenance.interval} until you cancel. Cancel anytime{" "}
              {billingPortalUrl ? (
                <>
                  from your{" "}
                  <a href={billingPortalUrl} className="text-accent underline">
                    billing page
                  </a>
                </>
              ) : (
                <>
                  by emailing{" "}
                  <a href={`mailto:${contact.email.toLowerCase()}`} className="text-accent underline break-all">
                    {contact.email.toLowerCase()}
                  </a>
                </>
              )}
              .
            </p>
          </div>
        </div>
        <p className="text-xs text-muted mt-8 text-center font-bold uppercase tracking-wide">
          Secure checkout by Stripe.
        </p>
      </div>
    </section>
  );
}

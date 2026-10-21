import { deposit, packages } from "@/lib/content";
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
            Fixed prices, paid once. Not sure which fits? <a href="#contact" className="text-accent underline">Ask first.</a>
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
        <p className="text-xs text-muted mt-8 text-center font-bold uppercase tracking-wide">
          Secure checkout by Stripe.
        </p>
      </div>
    </section>
  );
}

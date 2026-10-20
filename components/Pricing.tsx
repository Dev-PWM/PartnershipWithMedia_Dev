import { FaCheck } from "react-icons/fa6";
import { pricing } from "@/lib/content";
import CheckoutButton from "./CheckoutButton";

export default function Pricing() {
  return (
    <section id="pricing" aria-labelledby="pricing-heading" className="py-24 md:py-32 border-t-2 border-border">
      <div className="max-w-5xl mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 id="pricing-heading" className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">
            Engagements
          </h2>
          <p className="text-muted text-xl max-w-2xl mx-auto">
            Two ways to work together. Not sure which fits? <a href="#contact" className="text-accent underline">Ask first.</a>
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          {pricing.map((p) => (
            <div key={p.offer} className="bg-surface service-card p-10 flex flex-col">
              <h3 className="text-2xl font-black mb-4 uppercase tracking-tight font-brutalist">{p.name}</h3>
              <p className="mb-6 font-brutalist">
                <span className="text-5xl font-black text-accent">{p.price}</span>{" "}
                <span className="text-muted font-bold uppercase text-sm">{p.cadence}</span>
              </p>
              <p className="text-muted text-sm leading-relaxed font-bold mb-6">{p.body}</p>
              <ul className="space-y-3 mb-10 grow">
                {p.includes.map((item) => (
                  <li key={item} className="flex gap-3 items-center text-sm font-bold">
                    <FaCheck aria-hidden="true" className="text-accent shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <CheckoutButton offer={p.offer}>{p.cta}</CheckoutButton>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted mt-8 text-center font-bold uppercase tracking-wide">
          Secure checkout by Stripe.
        </p>
      </div>
    </section>
  );
}

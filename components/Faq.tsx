import { homeFaq } from "@/lib/faq";

export default function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-heading" className="py-24 md:py-32 border-t-2 border-border">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-16 text-center">
          <h2 id="faq-heading" className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">
            Questions
          </h2>
          <p className="text-muted text-xl">What Los Angeles business owners ask before starting a website or app.</p>
        </div>
        <div className="space-y-4">
          {homeFaq.map(({ q, a }) => (
            <details key={q} className="bg-surface border-2 border-border p-6 group">
              <summary className="cursor-pointer text-lg md:text-xl font-black uppercase tracking-tight font-brutalist list-none flex justify-between gap-6">
                <h3>{q}</h3>
                <span aria-hidden className="text-accent group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-muted font-bold leading-relaxed">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

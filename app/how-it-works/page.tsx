import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { contact, deliveryProcess, hosting, nextSteps, packageDetails, packages } from "@/lib/content";
import { orderFlowLive } from "@/lib/orders";

export const metadata: Metadata = {
  title: "How it works",
  description: "What happens after you choose a package: payment, your service agreement, the build, hosting and your domain.",
  alternates: { canonical: "/how-it-works" },
};

const builds = packages.filter((p): p is typeof p & { offer: keyof typeof packageDetails } => p.offer in packageDetails);

export default function HowItWorksPage() {
  const ordersOn = orderFlowLive();
  const { steps, hostingPoints } = deliveryProcess(ordersOn);
  return (
    <>
      <Header />
      <main id="main" className="max-w-5xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 font-brutalist">How it works</h1>
        <p className="text-muted text-xl max-w-2xl">
          A fixed price, a signed agreement, and one person building your project from first call to launch.
        </p>

        <ol className={`mt-16 grid gap-4 ${steps.length === 5 ? "md:grid-cols-5" : "md:grid-cols-4"}`}>
          {steps.map((s, i) => (
            <li key={s.title} className="bg-surface border-2 border-border p-6">
              <p className="text-accent font-black font-brutalist text-3xl">{i + 1}</p>
              <h2 className="mt-3 font-black uppercase tracking-wide">{s.title}</h2>
              <p className="mt-2 text-sm text-muted font-bold leading-relaxed">{s.body}</p>
            </li>
          ))}
        </ol>

        <section aria-labelledby="hosting-heading" className="mt-24">
          <h2 id="hosting-heading" className="text-3xl md:text-4xl font-black uppercase font-brutalist">Hosting and your domain</h2>
          <p className="mt-4 text-muted text-lg font-bold">{hosting.summary}</p>
          <ul className="mt-6 space-y-3">
            {hostingPoints.map((p) => (
              <li key={p} className="font-bold"><span aria-hidden="true" className="text-accent mr-2">+</span>{p}</li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="packages-heading" className="mt-24">
          <h2 id="packages-heading" className="text-3xl md:text-4xl font-black uppercase font-brutalist">Package by package</h2>
          <div className="mt-10 space-y-10">
            {builds.map((p) => (
              <article key={p.offer} id={p.offer} className="border-2 border-border p-6 md:p-8 scroll-mt-28">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-black uppercase font-brutalist">{p.name}</h3>
                  <p className="text-2xl font-black text-accent font-brutalist">{p.price}</p>
                </div>
                <p className="mt-3 font-black leading-snug">{p.tagline}</p>
                <p className="mt-2 text-muted font-bold leading-relaxed">{p.body}</p>
                <p className="mt-2 font-bold"><span className="text-accent uppercase tracking-widest text-xs">Best for: </span>{p.bestFor}</p>
                <p className="mt-4 text-sm font-black uppercase tracking-widest">Typical timeline: <span className="text-accent">{packageDetails[p.offer].timeline}</span></p>
                <div className="mt-6 grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted">What you provide</h4>
                    <ul className="mt-3 space-y-2">
                      {packageDetails[p.offer].youProvide.map((x) => (
                        <li key={x} className="text-sm font-bold"><span aria-hidden="true" className="text-accent mr-2">+</span>{x}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-muted">{ordersOn ? "After you sign" : "After you pay"}</h4>
                    <ol className="mt-3 space-y-2 list-decimal list-inside">
                      {nextSteps[p.offer].map((s) => (
                        <li key={s.title} className="text-sm font-bold">{s.title}: <span className="text-muted">{s.body}</span></li>
                      ))}
                    </ol>
                  </div>
                </div>
                <Link href={`/buy/${p.offer}`} className="mt-8 inline-block bg-accent text-black px-6 py-3 font-black uppercase tracking-widest text-sm brutalist-button">
                  Choose {p.name}
                </Link>
              </article>
            ))}
          </div>
        </section>

        {ordersOn && (
        <section aria-labelledby="agreement-heading" className="mt-24">
          <h2 id="agreement-heading" className="text-3xl md:text-4xl font-black uppercase font-brutalist">The agreement</h2>
          <p className="mt-4 text-muted font-bold leading-relaxed max-w-3xl">
            After you pay, your confirmation email links to a private order page where you read and sign the service agreement.
            It covers what I deliver, your materials, hosting, ownership, and cancellations. Build work starts only once it&apos;s signed.{" "}
            <Link href="/agreement" className="text-accent underline">Read the agreement</Link>.
          </p>
        </section>
        )}

        <p className="mt-24 text-muted font-bold">
          Questions before you buy? <Link href="/#contact" className="text-accent underline">Send me a message</Link> or write to{" "}
          <a href={`mailto:${contact.email.toLowerCase()}`} className="text-accent underline break-all">{contact.email.toLowerCase()}</a>.
        </p>
      </main>
      <Footer />
    </>
  );
}

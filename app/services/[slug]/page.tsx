import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { getCaseStudy, packageDetails, packages, payOverTimeLine } from "@/lib/content";
import { getServicePage, serviceContactHref, servicePages } from "@/lib/servicePages";
import { siteName, siteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return servicePages.map((s) => ({ slug: s.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = getServicePage((await params).slug);
  if (!page) return {};
  const url = `/services/${page.slug}`;
  return {
    title: page.title,
    description: page.description,
    alternates: { canonical: url },
    openGraph: { title: page.title, description: page.description, url, type: "website" },
    twitter: { title: page.title, description: page.description },
  };
}

const eyebrow = "text-accent font-black uppercase tracking-widest text-xs mb-6 block";
const sectionHeading = "text-3xl md:text-5xl font-black tracking-tighter uppercase mb-10";

export default async function ServicePage({ params }: Props) {
  const page = getServicePage((await params).slug);
  if (!page) notFound();

  const study = page.caseStudy ? getCaseStudy(page.caseStudy) : undefined;
  const fits = packages.filter((p) => (page.packageIds as string[]).includes(p.offer));
  const others = servicePages.filter((s) => s.slug !== page.slug);
  const url = `${siteUrl}/services/${page.slug}`;

  // Service + FAQ structured data. Google no longer shows FAQ rich results for most sites, but the markup still
  // tells search engines exactly which questions this page answers.
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.h1,
      description: page.description,
      url,
      areaServed: { "@type": "City", name: "Los Angeles" },
      provider: { "@type": "ProfessionalService", name: siteName, url: siteUrl },
      ...(fits.length && {
        offers: fits.map((p) => ({
          "@type": "Offer",
          name: p.name,
          price: p.price.replace(/[^0-9.]/g, ""),
          priceCurrency: "USD",
        })),
      }),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: page.faq.map(({ q, a }) => ({
        "@type": "Question",
        name: q,
        acceptedAnswer: { "@type": "Answer", text: a },
      })),
    },
  ];

  return (
    <>
      <Header />
      <main id="main" className="font-brutalist">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <article>
          <header className="py-16 md:py-24 border-b-2 border-border">
            <div className="max-w-7xl mx-auto px-6">
              <Link
                href="/#services"
                className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted hover:text-accent mb-12"
              >
                <FaArrowLeft aria-hidden /> All services
              </Link>
              <span className={eyebrow}>{page.eyebrow}</span>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.95] mb-10">
                {page.h1}
                <span className="text-accent">.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted font-medium leading-relaxed max-w-3xl mb-12 font-sans">
                {page.intro}
              </p>
              <Link
                href={serviceContactHref(page)}
                className="inline-flex items-center gap-3 bg-accent text-black px-8 py-5 text-sm font-black uppercase tracking-widest brutalist-button"
              >
                Start a project <FaArrowRight aria-hidden />
              </Link>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24 space-y-20 md:space-y-28">
            <div className="grid md:grid-cols-2 gap-16 md:gap-20">
              <section>
                <h2 className={eyebrow}>Who_It&apos;s_For:</h2>
                <ul className="space-y-4">
                  {page.forWho.map((item) => (
                    <li key={item} className="border-l-4 border-accent pl-4 text-lg font-bold text-muted leading-relaxed font-sans">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
              <section>
                <h2 className={eyebrow}>What_You_Get:</h2>
                <ul className="space-y-4">
                  {page.includes.map((item) => (
                    <li key={item} className="border-l-4 border-accent pl-4 text-lg font-bold text-muted leading-relaxed font-sans">
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <section aria-labelledby="pricing-heading">
              <h2 id="pricing-heading" className={sectionHeading}>Pricing</h2>
              {page.pricingNote && (
                <p className="text-lg text-muted font-bold leading-relaxed max-w-3xl mb-10 font-sans">{page.pricingNote}</p>
              )}
              <div className="grid md:grid-cols-2 gap-8">
                {fits.map((p) => (
                  <div key={p.offer} className="bg-surface service-card p-8 flex flex-col">
                    <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{p.name}</h3>
                    <p className="text-4xl font-black text-accent mb-4">{p.price}</p>
                    <p className="text-muted text-sm leading-relaxed font-bold mb-4 font-sans">{p.body}</p>
                    <p className="text-sm font-bold mb-2 font-sans">
                      <span className="text-accent uppercase tracking-widest text-xs">Timeline</span>
                      <br />
                      {packageDetails[p.offer as keyof typeof packageDetails].timeline}
                    </p>
                    <p className="text-xs text-muted font-bold mt-auto pt-4 font-sans">{payOverTimeLine(p.price)}</p>
                  </div>
                ))}
              </div>
              <p className="mt-8 text-sm font-bold text-muted font-sans">
                Compare every package on the <Link href="/#pricing" className="text-accent underline">pricing section</Link>, or read{" "}
                <Link href="/how-it-works" className="text-accent underline">how a project works</Link>, including hosting and your domain.
              </p>
            </section>

            {study && (
              <section>
                <h2 className={eyebrow}>Related_Project:</h2>
                <Link href={`/work/${study.slug}`} className="block bg-surface service-card p-8 md:p-10 group">
                  <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter mb-4 group-hover:text-accent">
                    {study.name}
                  </h3>
                  <p className="text-muted font-bold leading-relaxed max-w-3xl mb-6 font-sans">{study.summary}</p>
                  <span className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-accent">
                    Read the case study <FaArrowRight aria-hidden />
                  </span>
                </Link>
              </section>
            )}

            <section aria-labelledby="faq-heading">
              <h2 id="faq-heading" className={sectionHeading}>Questions</h2>
              <div className="space-y-4 max-w-4xl">
                {page.faq.map(({ q, a }) => (
                  <details key={q} className="bg-surface border-2 border-border p-6 group">
                    <summary className="cursor-pointer text-lg md:text-xl font-black uppercase tracking-tight list-none flex justify-between gap-6">
                      <h3>{q}</h3>
                      <span aria-hidden className="text-accent group-open:rotate-45 transition-transform">+</span>
                    </summary>
                    <p className="mt-4 text-muted font-bold leading-relaxed font-sans">{a}</p>
                  </details>
                ))}
              </div>
            </section>

            <nav aria-label="Other services">
              <h2 className={eyebrow}>Other_Services:</h2>
              <ul className="flex flex-wrap gap-4">
                {others.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={`/services/${s.slug}`}
                      className="inline-block px-4 py-3 border-2 border-accent text-accent text-xs font-black uppercase tracking-widest hover:bg-accent hover:text-black"
                    >
                      {s.h1}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </article>
      </main>
      <Footer />
    </>
  );
}

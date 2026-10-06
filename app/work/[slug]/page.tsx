import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SiteImage from "@/components/SiteImage";
import { caseStudies, getCaseStudy, projectKey } from "@/lib/content";
import { siteName, siteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  const title = `${study.name}: ${study.title}`;
  return {
    title,
    description: study.summary,
    alternates: { canonical: `/work/${study.slug}` },
    openGraph: { title, description: study.summary, url: `/work/${study.slug}`, type: "article" },
    twitter: { title, description: study.summary },
  };
}

const eyebrow = "text-accent font-black uppercase tracking-widest text-xs mb-6 block";

export default async function CaseStudyPage({ params }: Props) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();

  const index = caseStudies.indexOf(study);
  const next = caseStudies[(index + 1) % caseStudies.length];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: `${study.name}: ${study.title}`,
    abstract: study.summary,
    url: `${siteUrl}/work/${study.slug}`,
    dateCreated: study.year,
    keywords: study.tech.join(", "),
    creator: { "@type": "Organization", name: siteName, url: siteUrl },
  };

  return (
    <>
      <Header />
      <main id="main" className="font-brutalist">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <article>
          <header className="py-16 md:py-24 border-b-2 border-border">
            <div className="max-w-7xl mx-auto px-6">
              <Link
                href="/#work"
                className="inline-flex items-center gap-3 text-xs font-black uppercase tracking-widest text-muted hover:text-accent mb-12"
              >
                <FaArrowLeft aria-hidden /> Back to Project Log
              </Link>
              <span className={eyebrow}>
                {study.kind === "concept" ? "Concept_Build" : "Case_Shipment_Log"} / {study.cardTitle}
              </span>
              <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-10">
                {study.name}
                <span className="text-accent">.</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted font-medium leading-relaxed max-w-3xl mb-12">
                {study.summary}
              </p>
              <dl className="grid sm:grid-cols-3 gap-6 max-w-3xl mb-12">
                {[
                  ["Type", study.kind === "concept" ? "Concept build" : "Client project"],
                  ["Role", study.role],
                  ["Year", study.year],
                ].map(([k, v]) => (
                  <div key={k} className="border-l-4 border-accent pl-4">
                    <dt className="text-xs font-black uppercase tracking-widest text-muted mb-1">{k}</dt>
                    <dd className="font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
              <ul className="flex flex-wrap gap-4" aria-label="Tech stack">
                {study.tech.map((t) => (
                  <li key={t} className="px-4 py-2 border-2 border-accent text-accent text-xs font-black uppercase">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </header>

          <div className="max-w-7xl mx-auto px-6 py-16 md:py-24">
            <div className="border-4 border-white bg-bgdark p-2 shadow-[12px_12px_0px_#CCFF00] md:shadow-[20px_20px_0px_#CCFF00] mb-20 md:mb-32">
              <SiteImage
                className="w-full aspect-[4/3] md:aspect-[16/9] object-cover grayscale"
                src={study.image}
                alt={study.imageAlt}
                width={1200}
                height={900}
                sizes="(min-width: 1280px) 1232px, 100vw"
                priority
              />
            </div>

            {study.kind === "concept" && (
              <p className="mb-16 max-w-3xl border-2 border-border bg-surface p-6 text-sm font-bold text-muted leading-relaxed">
                <span className="text-accent">NOTE //</span> This is a concept build: a self-initiated
                project that shows how I would architect this kind of product. It is not a client
                engagement, and the targets below are design goals, not reported results.
              </p>
            )}

            <div className="grid md:grid-cols-2 gap-16 md:gap-20 mb-20 md:mb-32">
              <section>
                <h2 className={eyebrow}>Technical_Hurdle:</h2>
                <p className="text-lg text-muted leading-relaxed font-bold">{study.challenge}</p>
              </section>
              <section>
                <h2 className={eyebrow}>Execution_Resolution:</h2>
                <p className="text-lg text-muted leading-relaxed font-bold">{study.solution}</p>
              </section>
            </div>

            <section className="mb-20 md:mb-32">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-12">
                The Approach
              </h2>
              <ol className="grid md:grid-cols-3 gap-8">
                {study.approach.map((step, i) => (
                  <li key={step.title} className="bg-surface service-card p-8 md:p-10">
                    <span className="block text-accent text-5xl font-black tracking-tighter mb-6">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-4">{step.title}</h3>
                    <p className="text-muted text-sm leading-relaxed font-bold">{step.body}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section className="mb-20 md:mb-32">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase mb-12">
                {study.kind === "concept" ? "Design Targets" : "Results"}
              </h2>
              <ul className="space-y-4 max-w-3xl">
                {study.targets.map((t) => (
                  <li key={t} className="flex gap-4 text-lg font-bold">
                    <span className="text-accent" aria-hidden>
                      &#47;&#47;
                    </span>
                    {t}
                  </li>
                ))}
              </ul>
            </section>

            <section className="bg-accent text-black border-4 border-white p-8 sm:p-12 md:p-16 flex flex-col lg:flex-row lg:items-center justify-between gap-10">
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-[0.9]">
                Need something
                <br />
                like this?
              </h2>
              <Link
                href={`/?project=${projectKey(study.presetProject)}#contact`}
                className="self-start lg:self-auto bg-black text-accent px-10 py-5 font-black uppercase tracking-widest text-sm text-center"
              >
                INIT_CONSULTATION
              </Link>
            </section>
          </div>
        </article>

        <nav aria-label="Next case study" className="border-t-2 border-border">
          <Link
            href={`/work/${next.slug}`}
            className="group max-w-7xl mx-auto px-6 py-16 flex items-center justify-between gap-6"
          >
            <span>
              <span className="block text-xs font-black uppercase tracking-widest text-muted mb-2">
                Next_Log
              </span>
              <span className="text-3xl md:text-5xl font-black tracking-tighter uppercase group-hover:text-accent transition-colors">
                {next.name} / {next.cardTitle}
              </span>
            </span>
            <FaArrowRight aria-hidden className="text-3xl text-accent shrink-0 group-hover:translate-x-2 transition-transform" />
          </Link>
        </nav>
      </main>
      <Footer />
    </>
  );
}

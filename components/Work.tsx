import Link from "next/link";
import { caseStudies } from "@/lib/content";
import SiteImage from "./SiteImage";

export default function Work() {
  return (
    <section id="work" className="py-24 md:py-32 bg-white text-black font-brutalist">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between md:items-end mb-16 md:mb-24 gap-10">
          <h2 className="text-6xl md:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
            Project
            <br />
            Log_001
          </h2>
          <p className="text-lg font-bold max-w-sm border-l-4 border-black pl-8">
            Concept builds that show how I architect real products, from data model to
            the last pixel.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {caseStudies.map((study) => (
            <article key={study.slug}>
              <Link href={`/work/${study.slug}`} className="group block">
                <div className="border-4 border-black mb-8 overflow-hidden bg-white shadow-[12px_12px_0px_#CCFF00] group-hover:shadow-none group-hover:translate-x-3 group-hover:translate-y-3 group-focus-visible:shadow-none transition-all duration-300">
                  <SiteImage
                    className="w-full h-72 object-cover grayscale"
                    src={study.image}
                    alt={study.imageAlt}
                    width={1200}
                    height={900}
                    sizes="(min-width: 768px) 33vw, 100vw"
                  />
                </div>
                <h3 className="text-3xl font-black mb-2 uppercase tracking-tighter">
                  {study.cardTitle}
                </h3>
                <span className="inline-block bg-black text-accent px-3 py-1 text-xs font-black uppercase tracking-widest">
                  {study.kind === "concept" ? "Concept Build" : "Tech Case Study"} / {study.name}
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

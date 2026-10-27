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
            Three projects, three different businesses: a custom website, a connected
            restaurant system, and a native iPad app, each designed and built from the ground up.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-12">
          {caseStudies.map((study, index) => (
            <article key={study.slug} className="min-w-0">
              <Link href={`/work/${study.slug}`} className="group block">
                <div className="border-4 border-black mb-8 overflow-hidden bg-white shadow-[12px_12px_0px_#CCFF00] group-hover:shadow-none group-hover:translate-x-3 group-hover:translate-y-3 group-focus-visible:shadow-none transition-all duration-300">
                  <SiteImage
                    className="w-full aspect-[4/3] object-contain"
                    src={study.image}
                    alt={study.imageAlt}
                    width={1600}
                    height={1200}
                    sizes="(min-width: 1280px) 368px, (min-width: 768px) 30vw, 100vw"
                  />
                </div>
                <span className="inline-block bg-black text-accent px-3 py-1 text-xs font-black uppercase tracking-widest mb-4">
                  {String(index + 1).padStart(2, "0")} / {study.cardTitle}
                </span>
                <h3 className="text-3xl font-black mb-4 uppercase tracking-tighter group-hover:underline underline-offset-4">
                  {study.name}
                </h3>
                <p className="text-sm font-medium leading-relaxed text-neutral-600 mb-5">{study.summary}</p>
                <span className="text-xs font-black uppercase tracking-widest border-b-2 border-black pb-1">Explore project <span aria-hidden>↗</span></span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

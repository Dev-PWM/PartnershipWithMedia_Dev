import { about } from "@/lib/content";
import SiteImage from "./SiteImage";

export default function About() {
  return (
    <section id="about" className="py-24 md:py-32 border-t-2 border-border">
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-[5fr_7fr] gap-20 items-center">
        <div className="relative max-w-md mx-auto lg:mx-0 w-full">
          <div className="relative border-4 border-white bg-bgdark p-2 transform -rotate-2 hover:rotate-0 transition-transform duration-500 shadow-[-20px_20px_0px_#CCFF00]">
            <SiteImage
              className="w-full aspect-[9/11] object-cover grayscale"
              src={about.image}
              alt={about.imageAlt}
              width={900}
              height={1100}
              sizes="(min-width: 1024px) 450px, 90vw"
            />
          </div>
          <div className="absolute -bottom-6 right-0 bg-accent text-black px-4 py-2 text-xs font-black uppercase tracking-widest font-brutalist border-2 border-black">
            {about.location}
          </div>
        </div>

        <div>
          <span className="text-accent font-black uppercase tracking-widest text-xs mb-6 block font-brutalist">
            About_The_Architect
          </span>
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-10 font-brutalist">
            {about.heading[0]}
            <br />
            <span className="text-accent">{about.heading[1]}</span>
          </h2>
          <div className="space-y-6 mb-14">
            {about.paragraphs.map((p) => (
              <p key={p} className="text-lg text-muted leading-relaxed font-medium">
                {p}
              </p>
            ))}
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {about.principles.map(({ label, body }) => (
              <div key={label} className="bg-surface service-card p-6">
                <h3 className="text-lg font-black uppercase tracking-tight font-brutalist mb-3">
                  <span className="text-accent">/</span> {label}
                </h3>
                <p className="text-muted text-sm leading-relaxed font-bold">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { heroImage } from "@/lib/content";
import { PresetLink } from "./ProjectType";
import SiteImage from "./SiteImage";

export default function Hero() {
  return (
    <section className="relative lg:min-h-[750px] flex items-center pt-16 md:pt-24 pb-16 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-3 bg-surface border-2 border-border px-4 py-2 mb-10">
              <span className="pulse-dot" />
              <span className="text-xs font-black uppercase tracking-widest">
                In-Progress: Responding to Inquiries
              </span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-[5.5rem] font-black tracking-tighter leading-[0.85] mb-10 uppercase font-brutalist">
              I BUILD &amp; FIX <br />
              <span className="text-accent">DIGITAL</span> PLATFORMS.
            </h1>
            <p className="text-xl text-muted mb-12 leading-relaxed max-w-xl font-medium">
              Rescue mission for a broken site? Architectural build for a new app?{" "}
              <span className="text-textlight">Direct partnership, zero fluff.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-6">
              <PresetLink
                preset="Fix / Enhance my website"
                className="bg-accent text-black px-10 py-5 text-lg font-black uppercase tracking-widest brutalist-button text-center"
              >
                Get Site Fixed
              </PresetLink>
              <PresetLink
                preset="Build a new website"
                className="bg-surface border-2 border-accent text-accent px-10 py-5 text-lg font-black uppercase tracking-widest brutalist-button text-center"
              >
                Start New Project
              </PresetLink>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
            <div className="relative border-4 border-white bg-bgdark p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500 shadow-[20px_20px_0px_#CCFF00]">
              <SiteImage
                className="w-full h-[500px] object-cover grayscale"
                src={heroImage}
                alt="High-contrast close-up of computer hardware with neon lighting"
                width={1200}
                height={1000}
                sizes="(min-width: 1280px) 600px, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

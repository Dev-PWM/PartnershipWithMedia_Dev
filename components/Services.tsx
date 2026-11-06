import Link from "next/link";
import { FaApple, FaArrowRight, FaCode, FaLayerGroup, FaWrench } from "react-icons/fa6";
import { services, type ServiceIcon } from "@/lib/content";

const icons: Record<ServiceIcon, React.ComponentType<{ className?: string }>> = {
  wrench: FaWrench,
  code: FaCode,
  apple: FaApple,
  layers: FaLayerGroup,
};

export default function Services() {
  return (
    <section id="services" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">
            What I Build
          </h2>
          <p className="text-muted text-xl max-w-2xl mx-auto">
            Practical software for small businesses, from the website customers see to the tools your team uses every day.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map(({ icon, slug, title, body }) => {
            const Icon = icons[icon];
            return (
              <Link key={title} href={`/services/${slug}`} className="bg-surface service-card p-10 group flex flex-col">
                <div className="w-16 h-16 bg-accent flex items-center justify-center text-black mb-10">
                  <Icon className="text-2xl" />
                </div>
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tight font-brutalist">
                  {title}
                </h3>
                <p className="text-muted text-sm leading-relaxed font-bold mb-8">{body}</p>
                <span className="mt-auto inline-flex items-center gap-2 text-accent text-xs font-black uppercase tracking-widest">
                  Learn more <FaArrowRight aria-hidden />
                </span>
              </Link>
            );
          })}
        </div>
        <p className="mt-12 text-center text-muted font-bold">
          Need a brand-new website?{" "}
          <Link href="/services/website-design" className="text-accent underline">
            See small business website design
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

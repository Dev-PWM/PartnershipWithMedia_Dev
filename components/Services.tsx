import { FaApple, FaCode, FaLayerGroup, FaWrench } from "react-icons/fa6";
import { services, type ServiceIcon } from "@/lib/content";

const icons: Record<ServiceIcon, React.ComponentType<{ className?: string }>> = {
  wrench: FaWrench,
  code: FaCode,
  apple: FaApple,
  layers: FaLayerGroup,
};

export default function Services() {
  return (
    <section id="services" className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-20 text-center">
          <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase font-brutalist mb-6">
            Core Capabilities
          </h2>
          <p className="text-muted text-xl max-w-2xl mx-auto">
            High-performance engineering for businesses that need results, not excuses.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map(({ icon, title, body }) => {
            const Icon = icons[icon];
            return (
              <div key={title} className="bg-surface service-card p-10 group">
                <div className="w-16 h-16 bg-accent flex items-center justify-center text-black mb-10">
                  <Icon className="text-2xl" />
                </div>
                <h3 className="text-2xl font-black mb-6 uppercase tracking-tight font-brutalist">
                  {title}
                </h3>
                <p className="text-muted text-sm leading-relaxed font-bold">{body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

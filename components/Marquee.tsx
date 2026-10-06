import { techStack } from "@/lib/content";

export default function Marquee() {
  // The list renders twice so the -50% translate loops seamlessly; per-item
  // padding (not flex gap) keeps both halves exactly the same width.
  const items = [...techStack, ...techStack];
  return (
    <section className="ticker-container py-10 border-y-4 border-white bg-accent overflow-hidden font-brutalist">
      <div className="flex w-max items-center animate-marquee whitespace-nowrap">
        {items.map((item, i) => (
          <div
            key={i}
            aria-hidden={i >= techStack.length}
            className="pr-20 text-black text-2xl font-black uppercase tracking-tighter italic"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}

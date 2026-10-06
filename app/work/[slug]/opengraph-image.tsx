import { caseStudies, getCaseStudy } from "@/lib/content";
import { ogCard, ogSize } from "@/lib/og";

export const alt = "PWM_DEV case study";
export const size = ogSize;
export const contentType = "image/png";

export function generateStaticParams() {
  return caseStudies.map((c) => ({ slug: c.slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const study = getCaseStudy((await params).slug)!;
  return ogCard({
    kicker: study.kind === "concept" ? "CONCEPT BUILD" : "CASE STUDY",
    lines: [study.name.toUpperCase(), study.cardTitle.toUpperCase()],
    footer: study.tech.join(" / ").toUpperCase(),
  });
}

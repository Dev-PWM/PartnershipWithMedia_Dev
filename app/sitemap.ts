import type { MetadataRoute } from "next";
import { caseStudies } from "@/lib/content";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    ...caseStudies.map((c) => ({
      url: `${siteUrl}/work/${c.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

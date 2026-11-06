import type { MetadataRoute } from "next";
import { CURRENT_AGREEMENT } from "@/lib/agreement";
import { caseStudies } from "@/lib/content";
import { servicePages } from "@/lib/servicePages";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "monthly", priority: 1 },
    ...servicePages.map((s) => ({
      url: `${siteUrl}/services/${s.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...caseStudies.map((c) => ({
      url: `${siteUrl}/work/${c.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.7,
    })),
    { url: `${siteUrl}/how-it-works`, changeFrequency: "monthly", priority: 0.6 },
    // The agreement is listed once its terms are approved; until then the page is a noindexed draft.
    ...(CURRENT_AGREEMENT.approved ? [{ url: `${siteUrl}/agreement`, changeFrequency: "yearly" as const, priority: 0.3 }] : []),
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}

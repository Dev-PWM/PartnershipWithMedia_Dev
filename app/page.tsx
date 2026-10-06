import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import { ProjectTypeProvider } from "@/components/ProjectType";
import Services from "@/components/Services";
import Work from "@/components/Work";
import { about, services } from "@/lib/content";
import { siteDescription, siteName, siteUrl } from "@/lib/site";

// Structured data so search engines understand who this is and what's offered.
const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfessionalService",
  name: siteName,
  alternateName: "Partnership With Media",
  url: siteUrl,
  image: `${siteUrl}/opengraph-image`,
  description: siteDescription,
  areaServed: { "@type": "City", name: "Los Angeles" },
  address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressRegion: "CA", addressCountry: "US" },
  knowsAbout: ["Next.js", "React", "Swift", "SwiftUI", "Node.js", "PostgreSQL", "Web performance"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services",
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, description: s.body },
    })),
  },
};

export default function Home() {
  return (
    <ProjectTypeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
        <Services />
        <About />
        <Work />
        <Contact />
      </main>
      <Footer />
    </ProjectTypeProvider>
  );
}

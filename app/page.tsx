import About from "@/components/About";
import Coffee from "@/components/Coffee";
import Contact from "@/components/Contact";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Pricing from "@/components/Pricing";
import { ProjectTypeProvider } from "@/components/ProjectType";
import Services from "@/components/Services";
import Work from "@/components/Work";
import { about, services } from "@/lib/content";
import { homeFaq } from "@/lib/faq";
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
  serviceType: ["Web design", "Website development", "Web application development", "iOS and macOS app development"],
  address: { "@type": "PostalAddress", addressLocality: "Los Angeles", addressRegion: "CA", addressCountry: "US" },
  knowsAbout: ["Next.js", "React", "Swift", "SwiftUI", "Node.js", "PostgreSQL", "Web performance"],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Services",
    itemListElement: services.map((s) => ({
      "@type": "Offer",
      itemOffered: { "@type": "Service", name: s.title, description: s.body, url: `${siteUrl}/services/${s.slug}` },
    })),
  },
};

// Google shows FAQ rich results only for a few kinds of sites now, but the markup still tells search engines which
// questions this page answers.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: homeFaq.map(({ q, a }) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
};

export default function Home() {
  return (
    <ProjectTypeProvider>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <Header />
      <main id="main">
        <Hero />
        <Marquee />
        <Services />
        <About />
        <Work />
        <Pricing />
        <Faq />
        <Contact />
        <Coffee />
      </main>
      <Footer />
    </ProjectTypeProvider>
  );
}

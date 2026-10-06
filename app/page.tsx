import About from "@/components/About";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import { ProjectTypeProvider } from "@/components/ProjectType";
import Services from "@/components/Services";
import Work from "@/components/Work";

export default function Home() {
  return (
    <ProjectTypeProvider>
      <Header />
      <main>
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

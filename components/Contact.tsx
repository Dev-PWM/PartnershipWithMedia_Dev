import { FaEnvelope, FaGithub } from "react-icons/fa6";
import { contact } from "@/lib/content";
import ContactForm from "./ContactForm";

export default function Contact() {
  return (
    <section id="contact" className="py-24 md:py-32 font-brutalist">
      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 lg:gap-32">
        <div>
          <h2 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase mb-12">
            Init
            <br />
            Inquiry.
          </h2>
          <div className="space-y-8">
            <a href={`mailto:${contact.email.toLowerCase()}`} className="flex items-center gap-6 group">
              <span className="w-16 h-16 shrink-0 border-4 border-accent flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                <FaEnvelope className="text-2xl" />
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tighter break-all">
                {contact.email}
              </span>
            </a>
            <a
              href={`https://${contact.github.toLowerCase()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-6 group"
            >
              <span className="w-16 h-16 shrink-0 border-4 border-accent flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-black transition-all">
                <FaGithub className="text-2xl" />
              </span>
              <span className="text-xl sm:text-2xl font-black tracking-tighter break-all">
                {contact.github}
              </span>
            </a>
          </div>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}

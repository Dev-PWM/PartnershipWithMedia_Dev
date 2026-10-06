import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How PWM_DEV handles the information you send through this site.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main id="main" className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <span className="text-accent font-black uppercase tracking-widest text-xs mb-6 block font-brutalist">
          Privacy_V1.0
        </span>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-12 font-brutalist">
          Privacy
        </h1>
        <div className="space-y-6 text-lg text-muted leading-relaxed [&_strong]:text-textlight">
          <p>
            <strong>What I collect.</strong> Only what you type into the contact form: your name,
            email address, project type and message. There are no tracking cookies or analytics on
            this site.
          </p>
          <p>
            <strong>How it&apos;s used.</strong> Your message is delivered to my inbox by email
            (sent through Resend) so I can reply to your inquiry. It isn&apos;t sold, shared for
            marketing, or added to a mailing list.
          </p>
          <p>
            <strong>Retention.</strong> Inquiries stay in my email for as long as they&apos;re
            useful for our conversation or project. Ask and I&apos;ll delete them.
          </p>
          <p>
            <strong>Questions or deletion requests.</strong> Reply to any email from me or send a
            new message through the contact form.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

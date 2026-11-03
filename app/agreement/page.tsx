import type { Metadata } from "next";
import AgreementText from "@/components/AgreementText";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { CURRENT_AGREEMENT } from "@/lib/agreement";

// The current agreement, readable before buying. Until it is approved it is labeled a draft and kept out of search.
export const metadata: Metadata = {
  title: "Service agreement",
  description: "The agreement PWM_DEV clients sign before build work starts.",
  alternates: { canonical: "/agreement" },
  robots: CURRENT_AGREEMENT.approved ? undefined : { index: false, follow: false },
};

export default function AgreementPage() {
  return (
    <>
      <Header />
      <main id="main" className="max-w-3xl mx-auto px-6 py-16 md:py-24">
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-8 font-brutalist">Service agreement</h1>
        {!CURRENT_AGREEMENT.approved && (
          <p role="note" className="mb-10 border-2 border-accent p-4 font-bold">
            Draft. These terms are being finalized and are not yet in effect. Clauses marked &ldquo;to be confirmed&rdquo; may change.
          </p>
        )}
        <p className="mb-10 text-muted font-bold leading-relaxed">
          You sign this after paying, on the private order page linked from your confirmation email. Your signed copy shows
          the exact version you agreed to.
        </p>
        <AgreementText agreement={CURRENT_AGREEMENT} />
      </main>
      <Footer />
    </>
  );
}

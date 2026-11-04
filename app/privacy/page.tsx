import type { Metadata } from "next";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { orderFlowLive } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How PWM_DEV handles the information you send through this site.",
  alternates: { canonical: "/privacy" },
};

// Order and signature records only exist once the order system is switched on (README), so the policy only
// describes them from then on.
export default function PrivacyPage() {
  const orders = orderFlowLive();
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
            <strong>What I collect.</strong> What you type into the contact form: your name, email
            address, project type and message.
            {orders && (
              <>
                {" "}If you buy a package, I also keep an order record: your name and email as given at
                checkout, the package, the amount paid, the website it&apos;s for, and your project&apos;s status.
              </>
            )}{" "}
            There are no tracking cookies or analytics on this site.
          </p>
          <p>
            <strong>Payments.</strong> Stripe processes payments and sends receipts. I never see or
            store your card details.
          </p>
          {orders && <p>
            <strong>Your signed agreement.</strong> When you sign the service agreement I record the
            name you typed, the time, the agreement version, your browser name, and a scrambled
            fingerprint of your network address (not the address itself), so the signature can be
            verified later.
          </p>}
          <p>
            <strong>How it&apos;s used.</strong> Messages are delivered to my inbox by email (sent
            through Resend) so I can reply.
            {orders && (
              <>
                {" "}Order records are stored in a private database (Supabase) that only this site&apos;s server
                can reach, and are used to deliver your project and show its status on your private order page.
              </>
            )}{" "}
            Nothing is sold, shared for marketing, or added to a mailing list.
          </p>
          <p>
            <strong>Retention.</strong> Inquiries stay in my email for as long as they&apos;re useful
            for our conversation or project. Ask and I&apos;ll delete them. Payment records
            {orders ? " and signed agreements are" : " are"} kept as business and legal records for as long as
            the law requires or a dispute could arise{orders ? ", and signed agreements cannot be edited after signing" : ""}.
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

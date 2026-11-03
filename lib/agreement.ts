import { createHash } from "node:crypto";

// The service agreement a buyer signs on their private order page after paying, before build work starts.
//
// Every version stays in AGREEMENTS so an order always shows the exact text it was signed under. To change the
// terms, add a new version with a new date rather than editing a signed one, then point CURRENT at it.
//
// `approved` stays false until you have read the terms and (strongly recommended) had an attorney review them.
// While it is false, signing only works with Stripe test keys, so no real buyer can sign a draft. Clauses marked
// `draft: true` are business terms that still need your decision; they show a "to be confirmed" marker.

export type AgreementSection = { heading: string; body: string[]; draft?: true };
export type Agreement = { version: string; approved: boolean; title: string; sections: AgreementSection[] };

const v20261103: Agreement = {
  version: "2026-11-03",
  approved: false,
  title: "PWM_DEV Service Agreement",
  sections: [
    {
      heading: "1. Who this is between",
      body: [
        "This agreement is between PWM_DEV, an independent developer in Los Angeles (\"I\", \"me\"), and the client who signs it (\"you\").",
        "It covers the package named on your order page, for the amount you paid at checkout.",
      ],
    },
    {
      heading: "2. What I deliver",
      body: [
        "I build the package named on your order page. Its description, typical timeline and the materials you provide, as shown when you sign, are recorded with your signature and included in your signed copy.",
        "Anything outside that description, such as extra pages, features or integrations, is quoted separately before I start it.",
      ],
    },
    {
      heading: "3. Payment",
      body: [
        "You pay the package price in full through Stripe before work begins. A project deposit is credited toward the project it reserved.",
        "Stripe processes your payment and sends your receipt. I never see or store your card details.",
      ],
    },
    {
      heading: "4. How the work runs",
      body: [
        "Within one business day of your signature I contact you to start. I need the materials listed for your package; the schedule moves with them.",
        "Timelines shown before purchase are typical estimates, not deadlines.",
        "Each package includes the review rounds described for it. Origin includes one round of changes. Further changes are quoted before I make them.",
      ],
    },
    {
      heading: "5. Your materials",
      body: [
        "You confirm you have the right to use the text, images, logos and other materials you send me, and that using them on your site is lawful.",
      ],
    },
    {
      heading: "6. Hosting and your domain",
      body: [
        "I host your site on my hosting account and handle its setup.",
        "Your domain name is registered in your name and belongs to you. You pay its yearly renewal directly to the registrar.",
      ],
    },
    {
      heading: "7. Hosting after launch",
      draft: true,
      body: [
        "Hosting is included for 12 months after launch. After that it continues as part of the Maintenance Plan, or I hand the site files over to you to host elsewhere.",
      ],
    },
    {
      heading: "8. Ownership",
      body: [
        "Once you have paid in full, you own the content and the design made specifically for your site.",
        "I keep ownership of my general tools, code and methods that are not specific to you, and you may use them as part of your site.",
        "I may show your finished project in my portfolio unless you ask me not to.",
      ],
    },
    {
      heading: "9. Cancellations and refunds",
      draft: true,
      body: [
        "If you cancel before I start work, I refund your payment in full.",
        "After work has started, I refund the part of the price for work not yet done. A project deposit is not refundable once the scope call has taken place.",
      ],
    },
    {
      heading: "10. Limits",
      draft: true,
      body: [
        "I do my work carefully and professionally, but I cannot promise specific business results such as sales or search rankings.",
        "My total responsibility under this agreement is limited to the amount you paid for the package.",
      ],
    },
    {
      heading: "11. Ending the agreement",
      draft: true,
      body: [
        "Either of us can end this agreement with written notice by email. If hosting ends, I give you at least 30 days' notice and a copy of your site files.",
      ],
    },
    {
      heading: "12. Your information",
      body: ["I keep your information private and use it only to deliver your project, as described in the privacy policy."],
    },
    {
      heading: "13. Governing law",
      draft: true,
      body: ["This agreement is governed by the laws of the State of California."],
    },
    {
      heading: "14. Signing electronically",
      body: [
        "Typing your full name and confirming below is your electronic signature. It has the same effect as signing on paper.",
        "You agree to receive this agreement and related notices electronically. You can ask me for a paper copy at any time.",
      ],
    },
  ],
};

export const AGREEMENTS: Record<string, Agreement> = { [v20261103.version]: v20261103 };
export const CURRENT_AGREEMENT = v20261103;

// Signing is open once the terms are approved, or at any time in Stripe test mode so the flow can be tried end to end.
export function signingOpen(agreement: Agreement = CURRENT_AGREEMENT) {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return agreement.approved || key.startsWith("sk_test_") || key.startsWith("rk_test_");
}

// What the signature covers: this version's exact text plus the order it applies to. Stored with the signature so
// the record shows precisely what was agreed, even if the site's copy changes later.
export type OrderScope = { description: string; timeline: string; youProvide: string[] };

export function agreementDigest(a: Agreement, order: { code: string; offer: string; amountCents: number | null; currency: string | null; signerName: string; scope: OrderScope }) {
  const canonical = JSON.stringify({
    version: a.version,
    title: a.title,
    sections: a.sections.map((s) => ({ heading: s.heading, body: s.body })),
    order: { code: order.code, offer: order.offer, amountCents: order.amountCents, currency: order.currency, scope: order.scope },
    signerName: order.signerName,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function agreementPlainText(a: Agreement) {
  return [a.title, `Version ${a.version}`, "", ...a.sections.flatMap((s) => [s.heading, ...s.body, ""])].join("\n");
}

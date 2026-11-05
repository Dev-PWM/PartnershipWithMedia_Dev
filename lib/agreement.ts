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
// `keyTerms` is a plain-English summary shown above the full text. It repeats the sections below and adds no terms;
// if the two ever differ, the full sections govern.
export type Agreement = { version: string; approved: boolean; title: string; keyTerms: string[]; sections: AgreementSection[] };

const v20261103: Agreement = {
  version: "2026-11-03",
  // Approved by the owner on 2026-11-03. No attorney review yet.
  approved: true,
  title: "PWM_DEV Service Agreement",
  keyTerms: [
    "You pay the package price once, through Stripe, before work begins.",
    "I build the package named on your order, with the materials you provide and the review rounds listed for it.",
    "Anything beyond that scope is quoted to you before I start it.",
    "Timelines are estimates. Your materials keep the schedule moving.",
    "Your domain is registered in your name and belongs to you. You pay its yearly renewal.",
    "Hosting is included for 12 months after launch. After that it continues on the Maintenance Plan, or I hand your site files over.",
    "Cancel before work starts for a full refund. After that, you're refunded for the work not yet done.",
    "You can ask for a paper copy at any time, and either of us can raise questions by replying to our emails.",
  ],
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
        "Your domain name is registered in your name and belongs to you. You pay its yearly renewal directly to the registrar, and you are responsible for keeping it renewed. If it expires, I cannot guarantee it can be recovered, and any cost of restoring or replacing it is yours.",
      ],
    },
    {
      heading: "7. Hosting after launch",
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
      body: [
        "If you cancel before I start work, I refund your payment in full.",
        "After work has started, I refund the part of the price for work not yet done. A project deposit is not refundable once the scope call has taken place.",
      ],
    },
    {
      heading: "10. Limits",
      body: [
        "I do my work carefully and professionally, but I cannot promise specific business results such as sales or search rankings.",
        "My total responsibility under this agreement is limited to the amount you paid for the package.",
      ],
    },
    {
      heading: "11. Ending the agreement",
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
      body: ["This agreement is governed by the laws of the State of California."],
    },
    {
      heading: "14. Signing electronically",
      body: [
        "Typing your full name and confirming below is your electronic signature. It has the same effect as signing on paper.",
        "You agree to receive this agreement and related notices electronically. You can ask me for a paper copy at any time.",
      ],
    },
    {
      heading: "15. Maintenance Plan work for non-members",
      body: [
        "After launch, work covered by the Maintenance Plan, such as content changes, updates and small features, is included for plan members.",
        "If you are not on the plan, you can request that work as a one-time job. Each request starts with a $150 deposit paid before work begins, and any time beyond what the deposit covers is quoted to you first.",
        "If you join the Maintenance Plan within 30 days of paying that deposit, the full $150 is credited as your first 3 months of membership. Joining the plan is always optional.",
      ],
    },
  ],
};

// 2026-11-05: adds the $150 Start Deposit (work starts on it, balance due before launch) and the 24-Hour Care Pass
// (replaces the per-request deposit for non-members, and drops the 30-day credit), and says both are final.
// Every section not listed in `changed` is the 2026-11-03 text, word for word.
const changed: Record<string, string[]> = {
  "1. Who this is between": [
    "This agreement is between PWM_DEV, an independent developer in Los Angeles (\"I\", \"me\"), and the client who signs it (\"you\").",
    "It covers the package named on your order page, for the amount you paid at checkout. If you started with the Start Deposit, it covers the package and price we agree in writing before I start.",
  ],
  "3. Payment": [
    "You pay the package price in full through Stripe before work begins, or you start with the $150 Start Deposit.",
    "With the Start Deposit, we agree your package and its price in writing (by email) before I start, and the $150 counts toward that price. You pay the rest by an invoice I send through Stripe after you have reviewed your finished preview and before your site goes live. I put your site live only once it is paid in full.",
    "If you pay with Klarna, Klarna pays me in full and your payments to Klarna are between you and Klarna.",
    "Stripe processes your payment and sends your receipt. I never see or store your card details.",
  ],
  "9. Cancellations and refunds": [
    "If you cancel a package before I start work, I refund your payment in full.",
    "After work has started, I refund the part of the price for work not yet done.",
    "The $150 Start Deposit and the $150 24-Hour Care Pass are final and not refundable. They pay for my time and the tools your project needs from the moment you pay.",
  ],
  "15. Maintenance Plan work for non-members": [
    "After launch, work covered by the Maintenance Plan, such as content changes, updates and small features, is included for plan members every month until they cancel.",
    "If you are not on the plan, you can buy a 24-Hour Care Pass for $150. Every change of that kind you ask for in the 24 hours after paying is included. Brand-new builds, such as adding a store or an app, are quoted separately.",
    "The pass ends 24 hours after you pay. Joining the Maintenance Plan later is always optional and costs its regular monthly price.",
  ],
};

const v20261105: Agreement = {
  version: "2026-11-05",
  // Approved by the owner on 2026-11-05. No attorney review yet.
  approved: true,
  title: v20261103.title,
  keyTerms: [
    "Pay the package price once, through Stripe, before work begins. Or start with a $150 Start Deposit and pay the rest before your site goes live.",
    "I build the package named on your order (or agreed in writing after a Start Deposit), with the materials you provide and the review rounds listed for it.",
    "Anything beyond that scope is quoted to you before I start it.",
    "Timelines are estimates. Your materials keep the schedule moving.",
    "Your domain is registered in your name and belongs to you. You pay its yearly renewal.",
    "Hosting is included for 12 months after launch. After that it continues on the Maintenance Plan, or I hand your site files over.",
    "Cancel a package before work starts for a full refund. After that, you're refunded for the work not yet done. The Start Deposit and the 24-Hour Care Pass are final.",
    "You can ask for a paper copy at any time, and either of us can raise questions by replying to our emails.",
  ],
  sections: v20261103.sections.map((s) => (changed[s.heading] ? { heading: s.heading, body: changed[s.heading] } : s)),
};

// 2026-11-05b: the Start Deposit becomes a paid preview (final, not credited toward the package), Klarna and Affirm are
// named, and the Maintenance Plan's limits are spelled out (it covers the package you have; upgrades cost the bigger
// package's price; new features are quoted; a Care Pass lasts 24 hours only). No one signed 2026-11-05.
// Every section not listed in `changedB` is the 2026-11-05 text, word for word.
const changedB: Record<string, string[]> = {
  "1. Who this is between": [
    "This agreement is between PWM_DEV, an independent developer in Los Angeles (\"I\", \"me\"), and the client who signs it (\"you\").",
    "It covers the package named on your order page, for the amount you paid at checkout. For a Start Deposit, it covers the preview described in section 3.",
  ],
  "3. Payment": [
    "You pay the package price in full through Stripe before work begins.",
    "Or you can start with the $150 Start Deposit: I build a preview of the package you choose (Origin, Nexus or Aura) so you can see it before you buy. The $150 pays for that work and the tools behind it. It is final, and it does not count toward the package price.",
    "If you then buy the package, you pay its full price before I finish it and put it live. If you don't, the preview is not put live, and its design and code stay mine.",
    "If you pay with Klarna or Affirm, they pay me in full, and your payments to them are between you and them.",
    "Stripe processes your payment and sends your receipt. I never see or store your card details.",
  ],
  "15. Maintenance Plan work for non-members": [
    "Plan members get the work the plan covers, such as content changes, updates and small fixes, every month until they cancel.",
    "The plan looks after the package you have. Moving up to a bigger package costs that package's full price, and new features such as a shopping cart, client portal, admin tools or an app are quoted separately before I start.",
    "If you are not on the plan, you can buy a 24-Hour Care Pass for $150. Every change of that kind you ask for in the 24 hours after paying is included. When the 24 hours are up, the pass ends, and any further change needs a new pass.",
    "The pass is final and not refundable. Joining the Maintenance Plan later is always optional and costs its regular monthly price.",
  ],
};

const v20261105b: Agreement = {
  version: "2026-11-05b",
  // Approved by the owner on 2026-11-05. No attorney review yet.
  approved: true,
  title: v20261105.title,
  keyTerms: [
    "Pay the package price once, through Stripe, before work begins. Or pay a $150 Start Deposit to see a preview first; it's final and doesn't count toward the package price.",
    "I build the package named on your order, with the materials you provide and the review rounds listed for it.",
    "Anything beyond that scope is quoted to you before I start it.",
    "Timelines are estimates. Your materials keep the schedule moving.",
    "Your domain is registered in your name and belongs to you. You pay its yearly renewal.",
    "Hosting is included for 12 months after launch. After that it continues on the Maintenance Plan, or I hand your site files over.",
    "The Maintenance Plan looks after the package you have. Bigger packages cost their full price, and new features are quoted. A Care Pass lasts 24 hours.",
    "Cancel a package before work starts for a full refund. After that, you're refunded for the work not yet done. The Start Deposit and the 24-Hour Care Pass are final.",
    "You can ask for a paper copy at any time, and either of us can raise questions by replying to our emails.",
  ],
  sections: v20261105.sections.map((s) => (changedB[s.heading] ? { heading: s.heading, body: changedB[s.heading] } : s)),
};

export const AGREEMENTS: Record<string, Agreement> = {
  [v20261103.version]: v20261103,
  [v20261105.version]: v20261105,
  [v20261105b.version]: v20261105b,
};
export const CURRENT_AGREEMENT = v20261105b;

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

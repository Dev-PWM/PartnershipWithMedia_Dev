import { renderEmail, type EmailContent } from "@/lib/email-template";
import { maintenance, packages, type ProjectType } from "@/lib/content";
import type { Offer } from "@/lib/stripe";
import { billingPortalUrl, siteUrl } from "@/lib/site";

// The words of every email the site sends. Layout lives in email-template.ts.

const firstName = (name?: string | null) => (name || "").trim().split(/\s+/)[0]?.slice(0, 40) || "";
const hello = (name?: string | null) => (firstName(name) ? `Hi ${firstName(name)},` : "Hi there,");

// Next steps per offer, so the buyer knows exactly what happens after paying.
const nextSteps: Record<Offer, { title: string; body: string }[]> = {
  origin: [
    { title: "Kickoff email", body: "Within one business day I'll send a short questionnaire about your business, your customers and the pages you need." },
    { title: "Your content", body: "Send your logo, photos and any text you already have. No copy yet? I'll draft it for you to approve." },
    { title: "Build and review", body: "You get a private preview link to review on your phone and computer, with a round of changes included." },
    { title: "Launch", body: "I connect your domain and put the site live, then walk you through anything you want to update yourself." },
  ],
  nexus: [
    { title: "Discovery call", body: "Within one business day I'll reach out to book a call about the data, views and people your dashboard serves." },
    { title: "Blueprint", body: "You get a short plan of the screens and how information flows, so we agree on scope before code is written." },
    { title: "Build and review", body: "I build it in steps and share a private preview at each one, so you can steer as it takes shape." },
    { title: "Launch and handover", body: "We go live together, and you get a walkthrough so your team is comfortable from day one." },
  ],
  aura: [
    { title: "Discovery call", body: "Within one business day I'll reach out to map your products, checkout and the client portal you have in mind." },
    { title: "Accounts setup", body: "We connect your own payment and email accounts, so your customers pay you directly and receipts come from you." },
    { title: "Build and review", body: "You get private previews of the storefront and portal at each milestone, with changes included along the way." },
    { title: "Launch and handover", body: "We test real orders end to end, put it live on your domain, and I show you how to run it day to day." },
  ],
  matrix: [
    { title: "Discovery workshop", body: "Within one business day I'll reach out to schedule a workshop covering your web portal, admin tools and app." },
    { title: "Architecture plan", body: "You get a written plan for the system, the app and the milestones before anything is built." },
    { title: "Milestone builds", body: "Each milestone ships to a private preview, and the app goes to TestFlight so you can try it on your own devices." },
    { title: "Launch", body: "I handle App Store submission and the web launch, then stay on hand while your customers settle in." },
  ],
  project_deposit: [
    { title: "Your spot is held", body: "The deposit reserves your place on my schedule and covers the tools your project needs to start." },
    { title: "Scope and quote", body: "Within one business day I'll reach out to talk through your idea and send a fixed quote." },
    { title: "Credit applied", body: "The deposit counts toward your project total, so you never pay it twice." },
  ],
  maintenance_monthly: [
    { title: "You're covered", body: "From today I keep your site's security, framework and hosting tools up to date." },
    { title: "Ask any time", body: "Need a text, photo or color change, or a small new feature? Reply to this email and it's included." },
    { title: "Monthly billing", body: "Your plan renews monthly through Stripe, and you can cancel or update your card whenever you like." },
  ],
};

const offerName = (offer: Offer) =>
  packages.find((p) => p.offer === offer)?.name
  ?? (offer === "maintenance_monthly" ? maintenance.name : offer === "project_deposit" ? "Project deposit" : offer);

// To the buyer, right after Stripe confirms payment.
export function purchaseThankYou(p: { offer: Offer; name?: string | null; amount: string; site?: string; receiptUrl?: string }) {
  const name = offerName(p.offer);
  const subscribing = p.offer === "maintenance_monthly";
  const content: EmailContent = {
    preheader: subscribing ? "Your maintenance plan is active. Here's what it covers." : `Your ${name} payment is confirmed. Here's what happens next.`,
    eyebrow: subscribing ? "Plan active" : "Payment confirmed",
    title: subscribing ? "You're covered." : p.offer === "project_deposit" ? "Your spot is saved." : `Let's build your ${name}.`,
    intro: [
      hello(p.name),
      subscribing
        ? "Thank you for joining the maintenance plan. Your site now has someone looking after it every month."
        : "Thank you for choosing PWM_DEV. Your payment went through, and your project is officially on my schedule.",
    ],
    details: [
      ["Package", name],
      ["Paid", p.amount + (subscribing ? " / month" : "")],
      ...(p.site ? [["Website", p.site] as [string, string]] : []),
    ],
    steps: nextSteps[p.offer],
    button: subscribing && billingPortalUrl ? { label: "Manage your plan", url: billingPortalUrl } : { label: "Visit PWM_DEV", url: siteUrl },
    outro: ["Stripe sends your official receipt separately. Keep this email for the next steps, and reply any time with questions."],
    signoff: "Talk soon,\nPWM_DEV",
  };
  return { subject: subscribing ? "Your PWM_DEV maintenance plan is active" : `You're in: ${name} with PWM_DEV`, ...renderEmail(content) };
}

// To whoever filled in the contact form. It never repeats their message: the address is whatever
// they typed, so echoing text back would let anyone send their words to a stranger from this domain.
export function contactAutoReply(p: { name: string; projectType: ProjectType }) {
  const content: EmailContent = {
    preheader: "Thanks for reaching out. I'll reply within one business day.",
    eyebrow: "Message received",
    title: "Thanks for reaching out.",
    intro: [
      hello(p.name),
      "Your message landed in my inbox. I read every one myself and reply within one business day, usually sooner.",
    ],
    details: [["Topic", p.projectType]],
    steps: [
      { title: "I review your message", body: "I look at what you need and any links you shared, so my reply is specific to your project." },
      { title: "We talk it through", body: "I'll reply with questions or suggest a short call to understand your goals and timeline." },
      { title: "You get a clear plan", body: "A fixed price and timeline, with no surprises, before any work starts." },
    ],
    button: { label: "See packages", url: `${siteUrl}/#pricing` },
    outro: ["Didn't send this? You can ignore this email; nothing else will be sent."],
    signoff: "Talk soon,\nPWM_DEV",
  };
  return { subject: "Got your message, I'll be in touch soon", ...renderEmail(content) };
}

// To you, the site owner.
export function ownerNotice(p: { eyebrow: string; title: string; intro: string; details: [string, string][]; button?: { label: string; url: string }; note?: string }) {
  return renderEmail({
    preheader: p.intro,
    eyebrow: p.eyebrow,
    title: p.title,
    intro: [p.intro],
    details: p.details,
    button: p.button,
    outro: p.note ? p.note.split(/\n+/).map((l) => l.trim()).filter(Boolean) : undefined,
  });
}

import { renderEmail, type EmailContent } from "@/lib/email-template";
import { carePass, deposit, maintenance, nextSteps, packages, type ProjectType } from "@/lib/content";
import type { Offer } from "@/lib/stripe";
import { billingPortalUrl, siteUrl } from "@/lib/site";

// The words of every email the site sends. Layout lives in email-template.ts.

const firstName = (name?: string | null) => (name || "").trim().split(/\s+/)[0]?.slice(0, 40) || "";
const hello = (name?: string | null) => (firstName(name) ? `Hi ${firstName(name)},` : "Hi there,");

export const offerName = (offer: Offer) =>
  packages.find((p) => p.offer === offer)?.name
  ?? (offer === maintenance.offer ? maintenance.name : offer === deposit.offer ? deposit.name : offer === carePass.offer ? carePass.name : offer);

// To the buyer, right after Stripe confirms payment.
// `order` is set when order records are on: the email then links the buyer's private order page, where build packages
// are signed before work starts.
export function purchaseThankYou(p: { offer: Offer; name?: string | null; amount: string; site?: string; receiptUrl?: string; order?: { code: string; url: string; needsSignature: boolean } }) {
  const name = offerName(p.offer);
  const subscribing = p.offer === "maintenance_monthly";
  const content: EmailContent = {
    preheader: subscribing ? "Your maintenance plan is active. Here's what it covers." : `Your ${name} payment is confirmed. Here's what happens next.`,
    eyebrow: subscribing ? "Plan active" : "Payment confirmed",
    title: subscribing ? "You're covered." : p.offer === deposit.offer ? "Your spot is saved." : p.offer === carePass.offer ? "Your Care Pass is on." : `Let's build your ${name}.`,
    intro: [
      hello(p.name),
      subscribing
        ? "Thank you for joining the maintenance plan. Your site now has someone looking after it every month."
        : "Thank you for choosing PWM_DEV. Your payment went through, and your project is officially on my schedule.",
      ...(p.order?.needsSignature
        ? ["One step before I start: review and sign your service agreement on your private order page. It takes a minute, and the same page shows where your project stands from here on."]
        : []),
    ],
    details: [
      ["Package", name],
      ["Paid", p.amount + (subscribing ? " / month" : "")],
      ...(p.site ? [["Website", p.site] as [string, string]] : []),
      ...(p.order ? [["Order", p.order.code] as [string, string]] : []),
    ],
    steps: p.order?.needsSignature
      ? [{ title: "Sign your agreement", body: "Open your order page, read the agreement and sign it with your name. Work begins once it's signed." }, ...nextSteps[p.offer]]
      : nextSteps[p.offer],
    button: p.order
      ? { label: p.order.needsSignature ? "Review and sign" : "View your order", url: p.order.url }
      : subscribing && billingPortalUrl ? { label: "Manage your plan", url: billingPortalUrl } : { label: "Visit PWM_DEV", url: siteUrl },
    outro: [
      // Every one-time buyer hears why the plan matters; subscribers already have it.
      ...(subscribing ? [] : [maintenance.pitch]),
      "Stripe sends your official receipt separately. Keep this email for the next steps, and reply any time with questions.",
      ...(p.order ? ["Your order link is private to you. Please don't forward it."] : []),
    ],
    signoff: "Best regards,\nPWM_DEV",
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
    signoff: "Best regards,\nPWM_DEV",
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

// To a buyer who paid for a build package but hasn't signed yet. `final` is the second and last reminder.
export function signingReminder(p: { name?: string | null; offer: Offer; code: string; orderUrl: string; final: boolean }) {
  const name = offerName(p.offer);
  const content: EmailContent = {
    preheader: `One quick step before I start your ${name}: sign your agreement.`,
    eyebrow: p.final ? "Last reminder" : "One step left",
    title: "Ready when you are.",
    intro: [
      hello(p.name),
      `Your ${name} is paid and on my schedule. The only thing left before I start is your signature on the service agreement.`,
      p.final
        ? "I'm holding your spot, but work can't begin until it's signed. If something in the agreement doesn't look right, just reply and we'll sort it out."
        : "It takes about a minute: read it on your order page and type your name to sign.",
    ],
    details: [["Order", p.code], ["Package", name]],
    button: { label: "Review and sign", url: p.orderUrl },
    outro: ["Questions about anything in it? Reply to this email.", "Your order link is private to you. Please don't forward it."],
    signoff: "Best regards,\nPWM_DEV",
  };
  return { subject: p.final ? `Still need your signature: ${p.code}` : `One step left before I start: ${p.code}`, ...renderEmail(content) };
}

// To the buyer right after they sign: their copy of exactly what they agreed to.
export function agreementSignedCopy(p: { name: string; offer: Offer; code: string; amount: string; version: string; sha256: string; signedAt: string; orderUrl: string; agreementText: string }) {
  const content: EmailContent = {
    preheader: `Your signed service agreement for order ${p.code}.`,
    eyebrow: "Agreement signed",
    title: "You're all set.",
    intro: [hello(p.name), "Thanks for signing. Here's your copy of the service agreement. I'll be in touch within one business day to start."],
    details: [
      ["Order", p.code],
      ["Package", offerName(p.offer)],
      ["Paid", p.amount],
      ["Signed by", p.name],
      ["Signed at", p.signedAt],
      ["Agreement version", p.version],
      ["Record fingerprint (SHA-256)", p.sha256],
    ],
    button: { label: "View your order", url: p.orderUrl },
    outro: ["The full agreement text is below and on your order page. Your order link is private to you. Please don't forward it.", ...p.agreementText.split("\n").filter(Boolean)],
    signoff: "Best regards,\nPWM_DEV",
  };
  return { subject: `Your signed agreement: ${p.code}`, ...renderEmail(content) };
}

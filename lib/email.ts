import { contact } from "@/lib/content";

const ownerAddress = () => process.env.CONTACT_TO_EMAIL?.trim() || contact.email.toLowerCase();

// Sends one email through Resend. Returns false (and logs) when Resend isn't configured; throws on a Resend error
// so callers that must not lose the message (the Stripe webhook) can fail and be retried.
// Resend's test sender (onboarding@resend.dev) only delivers to the account owner: customer emails need
// CONTACT_FROM_EMAIL set to an address on a domain verified in Resend.
export async function sendEmail(m: { to: string | string[]; subject: string; html: string; text: string; replyTo?: string; idempotencyKey?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("sendEmail: RESEND_API_KEY is not set.", m.subject);
    return false;
  }
  const from = process.env.CONTACT_FROM_EMAIL ?? "PWM_DEV Site <onboarding@resend.dev>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Resend drops repeats of the same key for 24h, which covers Stripe retries.
      ...(m.idempotencyKey && { "Idempotency-Key": m.idempotencyKey }),
    },
    body: JSON.stringify({
      from,
      to: Array.isArray(m.to) ? m.to : [m.to],
      subject: m.subject,
      html: m.html,
      text: m.text,
      ...(m.replyTo && { reply_to: m.replyTo }),
    }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
  return true;
}

// To the site owner. `html` is optional so plain notices still work.
export async function notifyOwner(subject: string, text: string, idempotencyKey?: string, html?: string, replyTo?: string) {
  const sent = await sendEmail({
    to: ownerAddress().split(",").map((s) => s.trim()),
    subject,
    text,
    html: html ?? `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!)}</pre>`,
    idempotencyKey,
    replyTo,
  });
  if (!sent) console.error("notifyOwner: not sent.", subject);
}

export { ownerAddress };

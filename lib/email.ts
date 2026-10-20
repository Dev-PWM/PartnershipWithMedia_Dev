import { contact } from "@/lib/content";

// Sends a plain-text email to the site owner through Resend. Same env vars and
// defaults as the contact form.
export async function notifyOwner(subject: string, text: string, idempotencyKey?: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("notifyOwner: RESEND_API_KEY is not set.", subject);
    return;
  }
  const to = process.env.CONTACT_TO_EMAIL?.trim() || contact.email.toLowerCase();
  const from = process.env.CONTACT_FROM_EMAIL ?? "PWM_DEV Site <onboarding@resend.dev>";

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      // Resend drops repeats of the same key for 24h, which covers Stripe retries.
      ...(idempotencyKey && { "Idempotency-Key": idempotencyKey }),
    },
    body: JSON.stringify({ from, to: to.split(",").map((s) => s.trim()), subject, text }),
  });
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`);
}

import { NextResponse } from "next/server";
import { HONEYPOT_FIELD, validateContact } from "@/lib/contact";
import { contact } from "@/lib/content";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Bots fill every field; pretend it worked so they don't retry.
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD]) {
    return NextResponse.json({ ok: true });
  }

  const { data, errors } = validateContact(body);
  if (!data) return NextResponse.json({ errors }, { status: 422 });

  const apiKey = process.env.RESEND_API_KEY;
  // The public contact address is the safe default. Keeping it in one place
  // prevents the hyphenated and non-hyphenated domains from drifting apart.
  const to = process.env.CONTACT_TO_EMAIL?.trim() || contact.email.toLowerCase();
  const from = process.env.CONTACT_FROM_EMAIL ?? "PWM_DEV Site <onboarding@resend.dev>";
  if (!apiKey) {
    console.error("Contact form: RESEND_API_KEY is not set.");
    return NextResponse.json(
      { error: `The contact form isn't connected yet. Please email ${to} directly.` },
      { status: 503 },
    );
  }

  const text = [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Project: ${data.projectType}`,
    "",
    data.message,
  ].join("\n");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: to.split(",").map((s) => s.trim()),
      reply_to: data.email,
      subject: `New inquiry: ${data.projectType} (${data.name})`,
      text,
      html: `<pre style="font-family:inherit;white-space:pre-wrap">${escapeHtml(text)}</pre>`,
    }),
  });

  if (!res.ok) {
    console.error("Contact form: Resend error", res.status, await res.text());
    return NextResponse.json(
      { error: "Couldn't send right now. Please try again or email directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

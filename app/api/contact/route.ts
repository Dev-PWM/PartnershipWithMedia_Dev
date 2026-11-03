import { NextResponse } from "next/server";
import { HONEYPOT_FIELD, validateContact } from "@/lib/contact";
import { notifyOwner, ownerAddress, sendEmail } from "@/lib/email";
import { contactAutoReply, ownerNotice } from "@/lib/emails";
import { GuardError, clientIp, guardResponse, rateLimit, readGuardedJson } from "@/lib/request-guard";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await readGuardedJson(request);
    // Every accepted message is an email to the owner: 5 per address per 10 minutes.
    rateLimit(`contact:${clientIp(request)}`, 5, 10 * 60_000);
  } catch (err) {
    if (err instanceof GuardError) return guardResponse(err);
    throw err;
  }

  // Bots fill every field; pretend it worked so they don't retry.
  if (typeof body[HONEYPOT_FIELD] === "string" && body[HONEYPOT_FIELD]) {
    return NextResponse.json({ ok: true });
  }

  const { data, errors } = validateContact(body);
  if (!data) return NextResponse.json({ errors }, { status: 422 });

  const to = ownerAddress();
  if (!process.env.RESEND_API_KEY) {
    console.error("Contact form: RESEND_API_KEY is not set.");
    return NextResponse.json(
      { error: `The contact form isn't connected yet. Please email ${to} directly.` },
      { status: 503 },
    );
  }

  const text = [`Name: ${data.name}`, `Email: ${data.email}`, `Project: ${data.projectType}`, "", data.message].join("\n");
  const notice = ownerNotice({
    eyebrow: "New inquiry",
    title: data.projectType,
    intro: `${data.name} sent a message through the contact form. Reply to this email to answer them directly.`,
    details: [["Name", data.name], ["Email", data.email], ["Project", data.projectType]],
    note: data.message,
  });
  try {
    await notifyOwner(`New inquiry: ${data.projectType} (${data.name})`, text, undefined, notice.html, data.email);
  } catch (err) {
    console.error("Contact form: Resend error", err);
    return NextResponse.json(
      { error: "Couldn't send right now. Please try again or email directly." },
      { status: 502 },
    );
  }

  // The visitor's confirmation. Your copy already went out, so a failure here is logged, not shown.
  const reply = contactAutoReply({ name: data.name, projectType: data.projectType });
  await sendEmail({ to: data.email, subject: reply.subject, html: reply.html, text: reply.text, replyTo: to.split(",")[0].trim() })
    .catch((err) => console.error("Contact form: auto-reply failed", err));

  return NextResponse.json({ ok: true });
}

import { contact } from "@/lib/content";
import { siteName, siteUrl } from "@/lib/site";

// Branded HTML emails in the site's look: near-black panel, lime accent, heavy uppercase headings.
// Built for email clients, not browsers: tables and inline styles only, no web fonts or external CSS
// (Gmail strips <style> blocks in some views), max 600px wide, and a plain-text twin for every message.

export type EmailContent = {
  preheader: string;                    // the grey preview line inboxes show after the subject
  eyebrow: string;                      // small lime label above the title
  title: string;
  intro: string[];                      // opening paragraphs
  details?: [label: string, value: string][];
  steps?: { title: string; body: string }[];
  button?: { label: string; url: string };
  outro?: string[];
  signoff?: string;
};

const C = { page: "#0a0a0a", panel: "#111111", card: "#1a1a1a", border: "#2a2a2a", accent: "#ccff00", text: "#f3f4f6", muted: "#9a9a9a", ink: "#0a0a0a" };
const SANS = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";
const HEAD = "'Space Grotesk', 'Arial Black', Helvetica, Arial, sans-serif";

export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const para = (t: string) =>
  `<p style="margin:0 0 16px;font:400 16px/1.6 ${SANS};color:${C.text};">${escapeHtml(t)}</p>`;

export function renderEmail(c: EmailContent): { html: string; text: string } {
  const email = contact.email.toLowerCase();
  const details = c.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;border:1px solid ${C.border};border-collapse:collapse;">
${c.details.map(([k, v], i) => `<tr><td style="padding:12px 16px;${i ? `border-top:1px solid ${C.border};` : ""}font:700 11px/1.4 ${SANS};letter-spacing:1.5px;text-transform:uppercase;color:${C.muted};width:38%;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:12px 16px;${i ? `border-top:1px solid ${C.border};` : ""}font:600 15px/1.5 ${SANS};color:${C.text};">${escapeHtml(v)}</td></tr>`).join("\n")}
</table>`
    : "";
  const steps = c.steps?.length
    ? `<p style="margin:8px 0 12px;font:700 11px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.accent};">What happens next</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
${c.steps.map((s, i) => `<tr><td style="width:44px;padding:0 0 18px;vertical-align:top;"><div style="width:32px;height:32px;line-height:32px;text-align:center;background:${C.accent};color:${C.ink};font:900 15px/32px ${HEAD};">${i + 1}</div></td><td style="padding:2px 0 18px;vertical-align:top;"><p style="margin:0 0 4px;font:800 15px/1.4 ${HEAD};text-transform:uppercase;letter-spacing:.5px;color:${C.text};">${escapeHtml(s.title)}</p><p style="margin:0;font:400 15px/1.55 ${SANS};color:${C.muted};">${escapeHtml(s.body)}</p></td></tr>`).join("\n")}
</table>`
    : "";
  const button = c.button
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 28px;"><tr><td style="background:${C.accent};"><a href="${escapeHtml(c.button.url)}" style="display:inline-block;padding:15px 28px;font:900 14px/1 ${HEAD};letter-spacing:2px;text-transform:uppercase;color:${C.ink};text-decoration:none;">${escapeHtml(c.button.label)} &rarr;</a></td></tr></table>`
    : "";

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark light"><meta name="supported-color-schemes" content="dark light"><title>${escapeHtml(c.title)}</title></head>
<body style="margin:0;padding:0;background:${C.page};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};">${escapeHtml(c.preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page};"><tr><td align="center" style="padding:32px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:${C.panel};border:1px solid ${C.border};">
<tr><td style="height:6px;background:${C.accent};font-size:0;line-height:0;">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 0;">
  <a href="${siteUrl}" style="font:900 20px/1 ${HEAD};letter-spacing:1px;color:${C.text};text-decoration:none;">${escapeHtml(siteName)}<span style="color:${C.accent};">.</span></a>
</td></tr>
<tr><td style="padding:32px 32px 8px;">
  <p style="margin:0 0 12px;font:700 11px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${C.accent};">${escapeHtml(c.eyebrow)}</p>
  <h1 style="margin:0 0 20px;font:900 30px/1.1 ${HEAD};letter-spacing:-.5px;text-transform:uppercase;color:${C.text};">${escapeHtml(c.title)}</h1>
  ${c.intro.map(para).join("\n  ")}
  ${details}
  ${steps}
  ${button}
  ${(c.outro || []).map(para).join("\n  ")}
  ${c.signoff ? `<p style="margin:8px 0 0;font:400 16px/1.6 ${SANS};color:${C.text};">${escapeHtml(c.signoff).replace(/\n/g, "<br>")}</p>` : ""}
</td></tr>
<tr><td style="padding:28px 32px 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.border};"><tr><td style="padding-top:20px;font:400 13px/1.6 ${SANS};color:${C.muted};">
    Questions? Just reply to this email, or write to <a href="mailto:${email}" style="color:${C.accent};text-decoration:none;">${email}</a>.<br>
    <a href="${siteUrl}" style="color:${C.muted};">${escapeHtml(siteUrl.replace(/^https?:\/\//, ""))}</a> &middot; Independent developer, Los Angeles
  </td></tr></table>
</td></tr>
</table>
</td></tr></table>
</body></html>`;

  const text = [
    c.title.toUpperCase(),
    "",
    ...c.intro,
    ...(c.details?.length ? ["", ...c.details.map(([k, v]) => `${k}: ${v}`)] : []),
    ...(c.steps?.length ? ["", "WHAT HAPPENS NEXT", ...c.steps.map((s, i) => `${i + 1}. ${s.title}: ${s.body}`)] : []),
    ...(c.button ? ["", `${c.button.label}: ${c.button.url}`] : []),
    ...(c.outro?.length ? ["", ...c.outro] : []),
    ...(c.signoff ? ["", c.signoff] : []),
    "",
    "--",
    `${siteName} · ${siteUrl}`,
    `Questions? Reply to this email or write to ${email}.`,
  ].join("\n");

  return { html, text };
}

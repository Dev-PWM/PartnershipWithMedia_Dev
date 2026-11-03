// Owner tool for client orders. Runs on your own machine with the Supabase secret key; there is no admin web page.
//
//   npm run orders -- list
//   npm run orders -- status PWM-ABCD2345 kickoff "Questionnaire sent to your inbox."
//   npm run orders -- status PWM-ABCD2345 live "Your site is live." --url https://example.com
//
// Statuses: kickoff, in_build, in_review, live, on_hold, cancelled, refunded, and paid (only to resume an order paused
// before it was signed). The database refuses moves that make no
// sense, and refuses to start build work on a package until its agreement is signed. A note becomes an update on the
// buyer's order page, so write it for them.
import { readFileSync } from "node:fs";

for (const file of [".env.local", ".env"]) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, "$2");
    }
  } catch {}
}

const url = process.env.SUPABASE_URL?.trim().replace(/\/$/, "");
const key = process.env.SUPABASE_SECRET_KEY?.trim();
if (!url || !key) {
  console.error("Set SUPABASE_URL and SUPABASE_SECRET_KEY (in .env.local) first.");
  process.exit(1);
}

async function rpc(fn, args = {}) {
  const headers = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args) });
  if (!res.ok) throw new Error(`${fn} failed (${res.status}): ${await res.text()}`);
  return res.json();
}

const money = (cents, currency) => (cents == null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "usd" }).format(cents / 100));
const [command, ...rest] = process.argv.slice(2);

if (command === "list") {
  const rows = await rpc("list_client_orders");
  if (!rows.length) console.log("No orders yet.");
  for (const o of rows) {
    console.log([o.code, o.offer.padEnd(19), o.status.padEnd(16), money(o.amount_cents, o.currency).padStart(10), o.signed ? "signed  " : "unsigned", o.created_at.slice(0, 10), o.buyer_name || "-", o.buyer_email || "-"].join("  "));
  }
} else if (command === "status") {
  const urlFlag = rest.indexOf("--url");
  const liveUrl = urlFlag >= 0 ? rest.splice(urlFlag, 2)[1] : null;
  const [code, status, ...noteParts] = rest;
  if (!/^PWM-[A-Z2-7]{8}$/.test(code || "") || !status) {
    console.error('Usage: npm run orders -- status PWM-XXXXXXXX <status> ["note for the buyer"] [--url https://...]');
    process.exit(1);
  }
  if (liveUrl && !/^https:\/\/[^\s]+$/.test(liveUrl)) {
    console.error("--url must be an https:// address.");
    process.exit(1);
  }
  const r = await rpc("set_client_order_status", { p_code: code, p_status: status, p_note: noteParts.join(" ") || null, p_live_url: liveUrl });
  const messages = {
    updated: `${code}: ${r.from} -> ${r.to}. The buyer sees this on their order page.`,
    not_found: `No order ${code}.`,
    invalid_transition: `${code} can't go from ${r.from} to ${r.to}.`,
    agreement_required: `${code} needs a signed agreement before ${r.to}.`,
  };
  console.log(messages[r.result] || JSON.stringify(r));
  process.exit(r.result === "updated" ? 0 : 1);
} else {
  console.error("Commands: list | status <code> <status> [note] [--url https://...]");
  process.exit(1);
}

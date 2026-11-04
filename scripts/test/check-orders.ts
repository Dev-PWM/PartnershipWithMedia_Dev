// Runs the real route handlers (Stripe webhook, agreement signing) with Stripe's real signature check, Resend
// captured in memory, and every Supabase RPC executed by real Postgres (PGlite) on the real migration.
// Run with `npm test`.
import { PGlite } from "@electric-sql/pglite";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SUPABASE_URL = "https://db.test";
const WEBHOOK_SECRET = "whsec_test_orders";
Object.assign(process.env, { STRIPE_SECRET_KEY: "sk_test_orders", STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET, RESEND_API_KEY: "re_test", CONTACT_TO_EMAIL: "owner@pwm.test" });
delete process.env.NEXT_PUBLIC_SITE_URL;
const enableOrders = () => Object.assign(process.env, { SUPABASE_URL, SUPABASE_SECRET_KEY: "sb_secret_test", ORDER_LINK_SECRET: "x".repeat(40) });
const disableOrders = () => { delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.ORDER_LINK_SECRET; };

// --- Postgres behind a fake PostgREST ---
let db: PGlite;
async function freshDb() {
  db = new PGlite();
  await db.exec("create role anon nologin; create role authenticated nologin; create role service_role nologin; grant usage on schema public to anon, authenticated, service_role; alter default privileges in schema public grant all on tables to anon, authenticated, service_role; alter default privileges in schema public grant all on functions to anon, authenticated, service_role;");
  const dir = path.join(root, "supabase/migrations");
  for (const f of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) await db.exec(await readFile(path.join(dir, f), "utf8"));
}
const TABLE_FUNCTIONS = new Set(["record_client_order", "list_client_orders"]);
let dbDown = false;
const rpcCalls: string[] = [];

type Email = { to: string[]; subject: string; html: string; text: string; key: string | null };
const emails: Email[] = [];
const sentKeys = new Set<string>();

globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  if (url.startsWith(`${SUPABASE_URL}/rest/v1/rpc/`)) {
    const fn = url.split("/").at(-1)!;
    rpcCalls.push(fn);
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("apikey"), "sb_secret_test");
    assert.equal(headers.get("authorization"), null, "a new-format secret key must not be sent as a bearer token");
    if (dbDown) return new Response('{"message":"unavailable"}', { status: 503 });
    const args = JSON.parse(String(init?.body)) as Record<string, unknown>;
    const names = Object.keys(args);
    const call = `public.${fn}(${names.map((n, i) => `${n} => $${i + 1}`).join(", ")})`;
    const values = names.map((n) => args[n] as never);
    const result = TABLE_FUNCTIONS.has(fn) ? (await db.query(`select * from ${call}`, values)).rows : (await db.query<{ r: unknown }>(`select ${call} as r`, values)).rows[0].r;
    return Response.json(result);
  }
  if (url === "https://api.resend.com/emails") {
    const key = new Headers(init?.headers).get("idempotency-key");
    if (key && sentKeys.has(key)) return Response.json({ id: "duplicate-ignored" });
    if (key) sentKeys.add(key);
    const body = JSON.parse(String(init?.body));
    emails.push({ to: body.to, subject: body.subject, html: body.html, text: body.text, key });
    return Response.json({ id: `email_${emails.length}` });
  }
  throw new Error(`Unexpected fetch in test: ${url}`);
}) as typeof fetch;

// Imported by URL: Node runs the .ts sources directly, which TypeScript's own import checking doesn't allow.
type Handler = (request: Request) => Promise<Response>;
const route = (rel: string) => import(new URL(rel, import.meta.url).href) as Promise<{ POST: Handler }>;
const { POST: webhook } = await route("../../app/api/stripe/webhook/route.ts");
const { POST: sign } = await route("../../app/api/orders/sign/route.ts");
const { GET: reminders } = (await import(new URL("../../app/api/cron/signing-reminders/route.ts", import.meta.url).href)) as { GET: Handler };
process.env.CRON_SECRET = "cron_test_secret";
const runReminders = (auth = "Bearer cron_test_secret") => reminders(new Request("http://localhost:3000/api/cron/signing-reminders", { headers: { authorization: auth } }));
const ageOrders = (days: number) => db.query(`update public.client_orders set created_at = now() - interval '${days} days'`);
const stripe = new Stripe("sk_test_orders");
// The live agreement object, so the draft gate can be exercised whatever the real approval state is.
const { CURRENT_AGREEMENT } = (await import(new URL("../../lib/agreement.ts", import.meta.url).href)) as { CURRENT_AGREEMENT: { approved: boolean } };
const APPROVED = CURRENT_AGREEMENT.approved;

let eventSeq = 0;
function stripeEvent(session: Record<string, unknown>, type = "checkout.session.completed", id = `evt_${++eventSeq}`) {
  const payload = JSON.stringify({ id, object: "event", type, data: { object: { object: "checkout.session", payment_status: "paid", amount_total: 55000, currency: "usd", customer_details: { name: "Ada Client", email: "ada@example.com" }, ...session } } });
  const header = stripe.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
  return () => webhook(new Request("http://localhost:3000/api/stripe/webhook", { method: "POST", headers: { "stripe-signature": header }, body: payload }));
}
let ipSeq = 0;
const signRequest = (body: Record<string, unknown>, origin = "http://localhost:3000") =>
  sign(new Request("http://localhost:3000/api/orders/sign", {
    method: "POST",
    headers: { "content-type": "application/json", origin, "x-real-ip": `198.51.100.${++ipSeq % 250}`, "user-agent": "check-orders" },
    body: JSON.stringify(body),
  }));
const tokenFrom = (e: Email | undefined) => e?.text.match(/\/orders\/([A-Za-z0-9_-]{43})/)?.[1];
const count = async (sql: string) => (await db.query<{ n: number }>(sql)).rows[0].n;

async function reset() {
  await freshDb();
  emails.length = 0;
  sentKeys.clear();
  rpcCalls.length = 0;
  dbDown = false;
  process.env.STRIPE_SECRET_KEY = "sk_test_orders";
  CURRENT_AGREEMENT.approved = APPROVED;
  enableOrders();
}

let passed = 0;
async function check(name: string, fn: () => Promise<void>) {
  await reset();
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}

await check("with Supabase unset the webhook behaves exactly as before: two emails, no order link, no database", async () => {
  disableOrders();
  const res = await stripeEvent({ id: "cs_test_plain", metadata: { offer: "origin" } })();
  assert.equal(res.status, 200);
  assert.equal(rpcCalls.length, 0);
  assert.equal(emails.length, 2);
  const buyer = emails.find((e) => e.to.includes("ada@example.com"));
  assert(buyer && !tokenFrom(buyer) && !/sign/i.test(buyer.subject));
});

await check("a paid Origin order is recorded once and the buyer gets a private link to sign", async () => {
  const send = stripeEvent({ id: "cs_test_origin1", metadata: { offer: "origin", client_site: "example.com" } });
  assert.equal((await send()).status, 200);
  assert.equal((await send()).status, 200);   // Stripe redelivering the same event
  assert.equal(await count("select count(*)::int as n from public.client_orders"), 1);
  assert.equal(await count("select count(*)::int as n from public.client_order_events"), 1);
  const buyer = emails.filter((e) => e.to.includes("ada@example.com"));
  assert.equal(buyer.length, 1, "the retry emailed the buyer again");
  assert(tokenFrom(buyer[0]), "buyer email has no order link");
  assert(/Review and sign/.test(buyer[0].text) && /PWM-[A-Z2-7]{8}/.test(buyer[0].text));
  const owner = emails.find((e) => e.to.includes("owner@pwm.test"))!;
  assert(!tokenFrom(owner), "the owner notice should not carry the buyer's private link when the buyer has it");
});

await check("a second webhook delivery for the same session (new event id) reuses the same order and link", async () => {
  await stripeEvent({ id: "cs_test_twice", metadata: { offer: "nexus" } }, "checkout.session.completed", "evt_a")();
  await stripeEvent({ id: "cs_test_twice", metadata: { offer: "nexus" } }, "checkout.session.async_payment_succeeded", "evt_b")();
  assert.equal(await count("select count(*)::int as n from public.client_orders"), 1);
  const links = emails.filter((e) => e.to.includes("ada@example.com")).map(tokenFrom);
  assert.equal(new Set(links).size, 1, "two deliveries produced different links");
});

await check("when Stripe has no buyer email the order is kept and the link goes to the owner", async () => {
  await stripeEvent({ id: "cs_test_noemail", metadata: { offer: "aura" }, customer_details: { name: null, email: null }, amount_total: null, currency: null })();
  assert.equal(await count("select count(*)::int as n from public.client_orders"), 1);
  assert.equal(emails.length, 1);
  assert(tokenFrom(emails[0]), "owner was not given the order link");
});

await check("with live Stripe keys and an unapproved agreement, a sale behaves exactly as before", async () => {
  CURRENT_AGREEMENT.approved = false;
  process.env.STRIPE_SECRET_KEY = "sk_live_orders";
  const res = await stripeEvent({ id: "cs_live_draft", metadata: { offer: "origin" } })();
  assert.equal(res.status, 200);
  assert.equal(rpcCalls.length, 0, "an order was recorded that nobody could sign");
  assert.equal(emails.length, 2);
  const buyer = emails.find((e) => e.to.includes("ada@example.com"))!;
  assert(!tokenFrom(buyer) && !/sign/i.test(buyer.text), "the buyer was told to sign an agreement that can't be signed");
});

await check("a missing link secret skips the order but still sends the purchase emails", async () => {
  process.env.ORDER_LINK_SECRET = "short";
  const res = await stripeEvent({ id: "cs_test_nosecret", metadata: { offer: "origin" } })();
  assert.equal(res.status, 200);
  assert.equal(rpcCalls.length, 0);
  assert.equal(emails.length, 2);
  assert(!emails.some(tokenFrom));
});

await check("a database outage fails the webhook before any email, so Stripe's retry sends them once", async () => {
  dbDown = true;
  const send = stripeEvent({ id: "cs_test_down", metadata: { offer: "origin" } });
  assert.equal((await send().catch(() => new Response(null, { status: 500 }))).status, 500);
  assert.equal(emails.length, 0);
  dbDown = false;
  assert.equal((await send()).status, 200);
  assert.equal(emails.length, 2);
  assert(tokenFrom(emails.find((e) => e.to.includes("ada@example.com"))));
});

await check("another site's session on the shared Stripe account creates nothing", async () => {
  const res = await stripeEvent({ id: "cs_test_nick", metadata: { order_id: "11111111-1111-4111-8111-111111111111", order_code: "NP-123456" } })();
  assert.equal(res.status, 200);
  assert.equal(rpcCalls.length, 0);
  assert.equal(emails.length, 0);
});

async function paidOrder(offer = "origin", id = `cs_test_${offer}_${++eventSeq}`) {
  await stripeEvent({ id, metadata: { offer } })();
  const token = tokenFrom(emails.filter((e) => e.to.includes("ada@example.com")).at(-1));
  emails.length = 0;
  return token!;
}

await check("the buyer signs once; the record covers this order and both sides get a copy", async () => {
  const token = await paidOrder();
  const res = await signRequest({ token, version: "2026-11-03", name: "  Ada   Client ", consent: true });
  assert.equal(res.status, 200, await res.clone().text());
  const sig = (await db.query<{ signer_name: string; agreement_sha256: string; ip_hash: string }>("select * from public.client_agreements")).rows[0];
  assert.equal(sig.signer_name, "Ada Client");
  assert.match(sig.ip_hash, /^[0-9a-f]{64}$/);
  assert.equal((await db.query<{ status: string }>("select status from public.client_orders")).rows[0].status, "agreement_signed");
  const copy = emails.find((e) => e.to.includes("ada@example.com"))!;
  assert(copy.text.includes(sig.agreement_sha256) && copy.text.includes("Governing law"), "buyer copy lacks the fingerprint or full text");
  assert(copy.text.includes("A polished one-page website") && copy.text.includes("Typical timeline"), "buyer copy lacks the package scope");
  assert(emails.some((e) => e.to.includes("owner@pwm.test") && /^Agreement signed — PWM-/.test(e.subject)));
  const again = await signRequest({ token, version: "2026-11-03", name: "Someone Else", consent: true });
  assert.equal((await again.json()).alreadySigned, true);
  assert.equal(await count("select count(*)::int as n from public.client_agreements"), 1);
  assert.equal(emails.length, 2, "a repeat signature sent more email");
});

await check("five simultaneous signatures record one agreement and one buyer copy", async () => {
  const token = await paidOrder("aura");
  const results = await Promise.all(Array.from({ length: 5 }, () => signRequest({ token, version: "2026-11-03", name: "Ada Client", consent: true })));
  assert(results.every((r) => r.status === 200));
  assert.equal(await count("select count(*)::int as n from public.client_agreements"), 1);
  assert.equal(emails.filter((e) => e.to.includes("ada@example.com")).length, 1);
});

await check("bad signing requests are refused and record nothing", async () => {
  const token = await paidOrder();
  const cases: [Record<string, unknown>, number, string?][] = [
    [{ token, version: "2026-11-03", name: "Ada Client", consent: false }, 400],
    [{ token, version: "2026-11-03", name: "Ada Client", consent: "true" }, 400],
    [{ token, version: "2026-11-03", name: "1", consent: true }, 400],
    [{ token, version: "2026-11-03", name: "12345", consent: true }, 400],
    [{ token, version: "2025-01-01", name: "Ada Client", consent: true }, 409],
    [{ token: "x".repeat(43), version: "2026-11-03", name: "Ada Client", consent: true }, 404],
    [{ token: "../../etc", version: "2026-11-03", name: "Ada Client", consent: true }, 404],
    [{ token, version: "2026-11-03", name: "Ada Client", consent: true }, 403, "https://evil.example"],
  ];
  for (const [body, status, origin] of cases) assert.equal((await signRequest(body, origin)).status, status, JSON.stringify(body));
  assert.equal(await count("select count(*)::int as n from public.client_agreements"), 0);
});

await check("the maintenance plan has no agreement to sign", async () => {
  const token = await paidOrder("maintenance_monthly");
  assert.equal((await signRequest({ token, version: "2026-11-03", name: "Ada Client", consent: true })).status, 409);
});

await check("an unapproved agreement cannot be signed with live Stripe keys", async () => {
  const token = await paidOrder();
  CURRENT_AGREEMENT.approved = false;
  process.env.STRIPE_SECRET_KEY = "sk_live_orders";
  const res = await signRequest({ token, version: "2026-11-03", name: "Ada Client", consent: true });
  assert.equal(res.status, 403);
  assert.equal(await count("select count(*)::int as n from public.client_agreements"), 0);
});

await check("an approved agreement runs the full flow with live Stripe keys", async () => {
  CURRENT_AGREEMENT.approved = true;
  process.env.STRIPE_SECRET_KEY = "sk_live_orders";
  await stripeEvent({ id: "cs_live_approved", metadata: { offer: "origin" } })();
  const token = tokenFrom(emails.find((e) => e.to.includes("ada@example.com")));
  assert(token, "a live sale did not get an order link");
  assert.equal((await signRequest({ token, version: "2026-11-03", name: "Ada Client", consent: true })).status, 200);
  assert.equal(await count("select count(*)::int as n from public.client_agreements"), 1);
});

await check("signing during a database outage reports a retryable error", async () => {
  const token = await paidOrder();
  dbDown = true;
  assert.equal((await signRequest({ token, version: "2026-11-03", name: "Ada Client", consent: true })).status, 503);
});

await check("signing reminders: refused without the cron secret", async () => {
  assert.equal((await runReminders("Bearer wrong")).status, 401);
  assert.equal((await runReminders("")).status, 401);
});

await check("signing reminders go out on day 2 and day 5, then the owner hears on day 7, each once", async () => {
  const token = await paidOrder();
  await ageOrders(1);
  await runReminders();
  assert.equal(emails.length, 0, "reminded too early");
  await ageOrders(2);
  await runReminders();
  await runReminders();   // a rerun the same day
  assert.equal(emails.length, 1);
  assert.deepEqual(emails[0].to, ["ada@example.com"]);
  assert.equal(tokenFrom(emails[0]), token, "reminder link isn't the buyer's order link");
  await ageOrders(5);
  await runReminders();
  assert.equal(emails.length, 2);
  assert(/Still need your signature/.test(emails[1].subject));
  await ageOrders(7);
  await runReminders();
  await runReminders();
  assert.equal(emails.length, 3);
  assert(emails[2].to.includes("owner@pwm.test") && /^Unsigned for 7 days/.test(emails[2].subject));
  assert.equal(await count("select count(*)::int as n from public.client_order_events where not client_visible"), 3);
});

await check("an order that missed runs catches up one step per day, not all at once", async () => {
  await paidOrder();
  await ageOrders(10);
  await runReminders();
  assert.equal(emails.length, 1);
});

await check("signed orders, maintenance plans and orders without a buyer email get no buyer reminders", async () => {
  const token = await paidOrder();
  await signRequest({ token, version: "2026-11-03", name: "Ada Client", consent: true });
  await paidOrder("maintenance_monthly");
  await stripeEvent({ id: "cs_test_rem_noemail", metadata: { offer: "aura" }, customer_details: { name: null, email: null } })();
  emails.length = 0;
  await ageOrders(3);
  await runReminders();
  await runReminders();
  assert.equal(emails.length, 1, JSON.stringify(emails.map((e) => e.subject)));
  assert(emails[0].to.includes("owner@pwm.test") && tokenFrom(emails[0]), "owner should get the link to pass on");
});

console.log(`${passed} order handler checks passed`);

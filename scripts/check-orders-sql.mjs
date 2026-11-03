// Applies supabase/migrations to a throwaway in-process Postgres (PGlite) and checks the order rules in SQL itself:
// one order per Stripe session, no work before a signature, one signature per order, append-only records, and no
// access for the anon/authenticated roles. PGlite has a single connection, so concurrent callers run one after the
// other here; the `for update` row lock is what serializes them on real Postgres.
import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const db = new PGlite();
// Supabase grants anon and authenticated access to new tables and functions by default; mirror that so the
// migration's revokes are what keeps them out.
await db.exec("create role anon nologin; create role authenticated nologin; create role service_role nologin; grant usage on schema public to anon, authenticated, service_role; alter default privileges in schema public grant all on tables to anon, authenticated, service_role; alter default privileges in schema public grant all on functions to anon, authenticated, service_role;");
const dir = path.join(root, "supabase/migrations");
for (const file of (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort()) await db.exec(await readFile(path.join(dir, file), "utf8"));

let passed = 0;
async function check(name, fn) {
  await fn();
  passed++;
  console.log(`PASS ${name}`);
}
const hex = (c) => c.repeat(64);
const one = async (sql, params) => (await db.query(sql, params)).rows[0];
const record = (code, token, session, offer = "origin", extra = {}) =>
  one("select * from public.record_client_order($1,$2,$3,$4,$5,$6,$7,$8,$9)", [
    code, token, session, offer, "amount" in extra ? extra.amount : 55000, "currency" in extra ? extra.currency : "usd",
    extra.name ?? "Ada Client", "email" in extra ? extra.email : "ada@example.com", extra.site ?? null,
  ]);
const status = (code, to, note = null, url = null) => one("select public.set_client_order_status($1,$2,$3,$4) as r", [code, to, note, url]).then((x) => x.r);
const sign = (token, name = "Ada Client") =>
  one("select public.sign_client_agreement($1,$2,$3,$4,$5,$6) as r", [token, "2026-11-03", hex("b"), name, hex("c"), "test-agent"]).then((x) => x.r);
const events = async (code) => (await db.query("select e.title from public.client_order_events e join public.client_orders o on o.id = e.order_id where o.code = $1 order by e.id", [code])).rows.map((r) => r.title);

await check("a Stripe retry of the same session keeps one order and one payment entry", async () => {
  const first = await record("PWM-AAAAAAAA", hex("1"), "cs_test_retry");
  const again = await record("PWM-AAAAAAAA", hex("1"), "cs_test_retry");
  assert.equal(first.created, true);
  assert.equal(again.created, false);
  assert.equal(again.code, "PWM-AAAAAAAA");
  assert.equal((await one("select count(*)::int as n from public.client_orders where stripe_session_id = 'cs_test_retry'")).n, 1);
  assert.deepEqual(await events("PWM-AAAAAAAA"), ["Payment received"]);
});

await check("values Stripe can leave empty or oversized never make the insert fail", async () => {
  const r = await record("PWM-BBBBBBBB", hex("2"), "cs_live_odd", "nexus", { amount: null, currency: null, email: null, name: "x".repeat(500) });
  assert.equal(r.created, true);
  const row = await one("select buyer_name, buyer_email, amount_cents from public.client_orders where code = 'PWM-BBBBBBBB'");
  assert.equal(row.buyer_name.length, 200);
  assert.equal(row.buyer_email, null);
  assert.equal(row.amount_cents, null);
});

await check("the buyer page payload has no Stripe ids, token hash or email", async () => {
  const view = (await one("select public.client_order_by_token($1) as v", [hex("1")])).v;
  assert.equal(view.code, "PWM-AAAAAAAA");
  assert.equal(view.status_label, "Payment received");
  const text = JSON.stringify(view);
  for (const secret of ["cs_test_retry", hex("1"), "ada@example.com"]) assert(!text.includes(secret), `payload leaks ${secret}`);
  assert.equal((await one("select public.client_order_by_token($1) as v", [hex("9")])).v, null);
});

await check("build work cannot start on a package before its agreement is signed", async () => {
  assert.equal((await status("PWM-AAAAAAAA", "kickoff")).result, "agreement_required");
  assert.equal((await status("PWM-AAAAAAAA", "live")).result, "agreement_required");
  // Going on hold first is no way around it.
  assert.equal((await status("PWM-AAAAAAAA", "on_hold")).result, "updated");
  assert.equal((await status("PWM-AAAAAAAA", "kickoff")).result, "agreement_required");
  assert.equal((await one("select status from public.client_orders where code = 'PWM-AAAAAAAA'")).status, "on_hold");
});

await check("an order paused before signing can be resumed and then signed", async () => {
  assert.equal((await status("PWM-AAAAAAAA", "paid", "Resumed.")).result, "updated");
  assert.equal((await sign(hex("1"))).result, "signed");
  assert.equal((await status("PWM-AAAAAAAA", "kickoff")).result, "updated");
  // Once signed, "paid" is behind it for good.
  assert.equal((await status("PWM-AAAAAAAA", "on_hold")).result, "updated");
  assert.equal((await status("PWM-AAAAAAAA", "paid")).result, "invalid_transition");
});

await check("an agreement is signed once, only while the order is waiting for it", async () => {
  await record("PWM-CCCCCCCC", hex("3"), "cs_test_sign", "aura");
  const [a, b] = [await sign(hex("3")), await sign(hex("3"), "Someone Else")];
  assert.equal(a.result, "signed");
  assert.equal(a.buyer_email, "ada@example.com");
  assert.equal(b.result, "already_signed");
  const sig = await one("select signer_name, signer_email from public.client_agreements a join public.client_orders o on o.id = a.order_id where o.code = 'PWM-CCCCCCCC'");
  assert.deepEqual(sig, { signer_name: "Ada Client", signer_email: "ada@example.com" });
  assert.equal((await sign(hex("1"))).result, "already_signed");
  assert.equal((await sign(hex("8"))).result, "not_found");
});

await check("a signed order moves through the build steps; impossible moves are refused", async () => {
  assert.equal((await status("PWM-CCCCCCCC", "in_build")).result, "invalid_transition");
  for (const to of ["kickoff", "in_build", "in_review", "in_build", "in_review"]) assert.equal((await status("PWM-CCCCCCCC", to)).result, "updated");
  assert.equal((await status("PWM-CCCCCCCC", "paid")).result, "invalid_transition");
  assert.equal((await status("PWM-CCCCCCCC", "made_up")).result, "invalid_transition");
});

await check("the live address must be https", async () => {
  await assert.rejects(status("PWM-CCCCCCCC", "live", null, "http://example.com"));
  assert.equal((await status("PWM-CCCCCCCC", "live", "Your site is live.", "https://example.com")).result, "updated");
  const view = (await one("select public.client_order_by_token($1) as v", [hex("3")])).v;
  assert.equal(view.live_url, "https://example.com");
  assert.equal(view.agreement.signer_name, "Ada Client");
  assert.equal(view.events.at(-1).detail, "Your site is live.");
});

await check("deposits and the maintenance plan need no agreement and cannot be signed", async () => {
  await record("PWM-DDDDDDDD", hex("4"), "cs_test_maint", "maintenance_monthly");
  assert.equal((await sign(hex("4"))).result, "not_signable");
  assert.equal((await status("PWM-DDDDDDDD", "live")).result, "updated");
});

await check("timeline entries and signatures cannot be edited or removed", async () => {
  await assert.rejects(db.query("update public.client_order_events set title = 'edited'"), /append-only/);
  await assert.rejects(db.query("delete from public.client_order_events"), /append-only/);
  await assert.rejects(db.query("update public.client_agreements set signer_name = 'Forged'"), /append-only/);
  await assert.rejects(db.query("delete from public.client_agreements"), /append-only/);
});

await check("the anon and authenticated roles can read nothing and call nothing", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try {
      for (const t of ["client_orders", "client_order_events", "client_agreements"]) await assert.rejects(db.query(`select * from public.${t}`), /permission denied/);
      await assert.rejects(db.query("select public.client_order_by_token($1)", [hex("1")]), /permission denied/);
      await assert.rejects(db.query("select * from public.list_client_orders()"), /permission denied/);
    } finally {
      await db.exec("reset role");
    }
  }
});

await db.close();
console.log(`${passed} order database checks passed`);

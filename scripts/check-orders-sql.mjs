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
const roleSetup = "create role anon nologin; create role authenticated nologin; create role service_role nologin; grant usage on schema public to anon, authenticated, service_role; alter default privileges in schema public grant all on tables to anon, authenticated, service_role; alter default privileges in schema public grant all on functions to anon, authenticated, service_role;";
await db.exec(roleSetup);
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

await check("the maintenance plan and the Care Pass need no agreement and cannot be signed", async () => {
  await record("PWM-DDDDDDDD", hex("4"), "cs_test_maint", "maintenance_monthly");
  assert.equal((await sign(hex("4"))).result, "not_signable");
  assert.equal((await status("PWM-DDDDDDDD", "live")).result, "updated");
  await record("PWM-GGGGGGGG", hex("7"), "cs_test_care", "care_pass", { amount: 15000 });
  assert.equal((await sign(hex("7"))).result, "not_signable");
});

await check("a Start Deposit needs a signature before work starts, like a package", async () => {
  await record("PWM-HHHHHHHH", hex("8"), "cs_test_start", "project_deposit", { amount: 15000 });
  assert.equal((await status("PWM-HHHHHHHH", "kickoff")).result, "agreement_required");
  assert.equal((await sign(hex("8"))).result, "signed");
  assert.equal((await status("PWM-HHHHHHHH", "kickoff")).result, "updated");
});

await check("an offer the site doesn't sell is refused", async () => {
  await assert.rejects(record("PWM-JJJJJJJJ", hex("9"), "cs_test_bogus", "free_stuff"), /client_orders_offer_check/);
});

await check("timeline entries and signatures cannot be edited or removed", async () => {
  await assert.rejects(db.query("update public.client_order_events set title = 'edited'"), /append-only/);
  await assert.rejects(db.query("delete from public.client_order_events"), /append-only/);
  await assert.rejects(db.query("update public.client_agreements set signer_name = 'Forged'"), /append-only/);
  await assert.rejects(db.query("delete from public.client_agreements"), /append-only/);
});

const saleState = (id) => one("select public.client_sale_state($1) as r", [id]).then((x) => x.r);
const claimEmail = (id, recipient, payload) => one("select public.claim_client_sale_email($1,$2,$3) as r", [id, recipient, payload]).then((x) => x.r);
const finishEmail = (id, recipient, token, sent) => one("select public.finish_client_sale_email($1,$2,$3,$4) as r", [id, recipient, token, sent]).then((x) => x.r);
const claimRun = (scope, through) => one("select public.claim_client_reconcile($1,$2) as r", [scope, through]).then((x) => x.r);
const checkpoint = (scope, token, cursor, release) => one("select public.checkpoint_client_reconcile($1,$2,$3,$4) as r", [scope, token, cursor, release]).then((x) => x.r);

await check("new orders atomically queue two receipts; retries do not reset them and missing buyer email is already complete", async () => {
  await db.exec("begin");
  try {
    await record("PWM-EEEEEEEE", hex("a"), "cs_test_atomic");
    assert.equal((await one("select count(*)::int as n from public.client_sale_deliveries d join public.client_orders o on o.id=d.order_id where o.stripe_session_id='cs_test_atomic' and d.sent_at is null")).n, 2);
  } finally {
    await db.exec("rollback");
  }
  assert.equal(await saleState("cs_test_atomic"), null);
  assert.equal((await one("select count(*)::int as n from public.client_sale_deliveries d left join public.client_orders o on o.id=d.order_id where o.id is null")).n, 0);
  await record("PWM-EEEEEEEE", hex("a"), "cs_test_receipts");
  await record("PWM-EEEEEEEE", hex("a"), "cs_test_receipts");
  assert.deepEqual((await db.query("select recipient, sent_at is not null as sent, payload from public.client_sale_deliveries d join public.client_orders o on o.id=d.order_id where o.stripe_session_id='cs_test_receipts' order by recipient")).rows, [
    { recipient: "buyer", sent: false, payload: null }, { recipient: "owner", sent: false, payload: null },
  ]);
  assert.equal((await saleState("cs_test_receipts")).complete, false);
  await record("PWM-FFFFFFFF", hex("d"), "cs_test_no_buyer", "origin", { email: null });
  assert.deepEqual(await claimEmail("cs_test_no_buyer", "buyer", {}), { result: "sent" });
  const owner = await claimEmail("cs_test_no_buyer", "owner", { text: "owner only" });
  assert.equal(await finishEmail("cs_test_no_buyer", "owner", owner.token, true), true);
  assert.equal((await saleState("cs_test_no_buyer")).complete, true);
});

await check("competing email claims are busy; lease expiry preserves the request and rejects stale finish tokens", async () => {
  const id = "cs_test_receipts";
  const payload = { from: "original@pwm.test", to: ["owner@pwm.test"], subject: "Original", text: "Original body", html: "<p>Original</p>", replyTo: "ada@example.com", idempotencyKey: `sale:${id}` };
  const claims = await Promise.all([claimEmail(id, "owner", payload), claimEmail(id, "owner", { text: "changed" })]);
  assert.deepEqual(claims.map((c) => c.result).sort(), ["busy", "send"]);
  const first = claims.find((c) => c.result === "send");
  assert.deepEqual(first.payload, payload);
  await db.query("update public.client_sale_deliveries set lease_until=now()-interval '1 second' where order_id=(select id from public.client_orders where stripe_session_id=$1) and recipient='owner'", [id]);
  const recovered = await claimEmail(id, "owner", { ...payload, from: "changed@pwm.test", text: "changed" });
  assert.equal(recovered.result, "send");
  assert.notEqual(recovered.token, first.token);
  assert.deepEqual(recovered.payload, payload);
  for (const sent of [true, false]) assert.equal(await finishEmail(id, "owner", first.token, sent), false);
  assert.deepEqual(await claimEmail(id, "owner", {}), { result: "busy" });
  assert.equal(await finishEmail(id, "owner", recovered.token, false), true);
  const retry = await claimEmail(id, "owner", {});
  assert.deepEqual(retry.payload, payload);
  assert.equal(await finishEmail(id, "owner", retry.token, true), true);
  assert.deepEqual(await claimEmail(id, "owner", { text: "must not resend" }), { result: "sent" });
  assert.equal((await one("select payload from public.client_sale_deliveries d join public.client_orders o on o.id=d.order_id where o.stripe_session_id=$1 and recipient='owner'", [id])).payload, null, "a sent receipt retained its private request");
  assert.equal((await saleState(id)).complete, false, "sending the owner completed the unsent buyer");
  const buyer = await claimEmail(id, "buyer", { text: "buyer" });
  assert.equal(await finishEmail(id, "buyer", buyer.token, true), true);
  assert.equal((await saleState(id)).complete, true);
});

await check("reconcile leases freeze through, resume checkpoints, reject stale tokens and reset after a sweep", async () => {
  const scope = "test:cursor-regression";
  const claims = await Promise.all([claimRun(scope, 1000), claimRun(scope, 2000)]);
  assert.deepEqual(claims.map((c) => c.result).sort(), ["busy", "claimed"]);
  const first = claims.find((c) => c.result === "claimed");
  assert.equal(first.cursor, null);
  assert.equal(first.through, 1000);
  assert.equal(await checkpoint(scope, first.token, "cs_page1", false), true);
  await db.query("update public.client_reconcile_runs set lease_until=now()-interval '1 second' where scope=$1", [scope]);
  const recovered = await claimRun(scope, 3000);
  assert.equal(recovered.cursor, "cs_page1");
  assert.equal(recovered.through, 1000);
  assert.notEqual(recovered.token, first.token);
  assert.equal(await checkpoint(scope, first.token, "cs_stale", true), false);
  assert.equal(await checkpoint(scope, recovered.token, "cs_page2", true), true);
  const resumed = await claimRun(scope, 4000);
  assert.equal(resumed.cursor, "cs_page2");
  assert.equal(resumed.through, 1000);
  assert.equal(await checkpoint(scope, resumed.token, null, true), true);
  const fresh = await claimRun(scope, 5000);
  assert.equal(fresh.cursor, null);
  assert.equal(fresh.through, 5000);
  assert.equal(await checkpoint(scope, fresh.token, null, true), true);
});

await check("migration seeds existing orders as delivered without changing their orders or timeline", async () => {
  const legacy = new PGlite();
  try {
    await legacy.exec(roleSetup);
    const migration = "20261105054847_sale_delivery_receipts.sql";
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files.filter((f) => f < migration)) await legacy.exec(await readFile(path.join(dir, file), "utf8"));
    await legacy.query("select * from public.record_client_order($1,$2,$3,$4,$5,$6,$7,$8,$9)", ["PWM-KKKKKKKK", hex("e"), "cs_test_legacy", "origin", 55000, "usd", "Existing Buyer", "legacy@example.com", null]);
    const before = (await legacy.query("select to_jsonb(o) as v from public.client_orders o")).rows;
    const eventsBefore = (await legacy.query("select * from public.client_order_events order by id")).rows;
    for (const file of files.filter((f) => f >= migration)) await legacy.exec(await readFile(path.join(dir, file), "utf8"));
    assert.deepEqual((await legacy.query("select to_jsonb(o) as v from public.client_orders o")).rows, before);
    assert.deepEqual((await legacy.query("select * from public.client_order_events order by id")).rows, eventsBefore);
    assert.deepEqual((await legacy.query("select recipient, sent_at is not null as sent, payload from public.client_sale_deliveries order by recipient")).rows, [
      { recipient: "buyer", sent: true, payload: null }, { recipient: "owner", sent: true, payload: null },
    ]);
    assert.equal((await legacy.query("select public.client_sale_state('cs_test_legacy') as r")).rows[0].r.complete, true);
  } finally {
    await legacy.close();
  }
});

await check("the anon and authenticated roles can read nothing and call nothing", async () => {
  for (const role of ["anon", "authenticated"]) {
    await db.exec(`set role ${role}`);
    try {
      for (const t of ["client_orders", "client_order_events", "client_agreements", "client_sale_deliveries", "client_reconcile_runs", "client_sale_reviews"]) await assert.rejects(db.query(`select * from public.${t}`), /permission denied/);
      await assert.rejects(db.query("select public.client_order_by_token($1)", [hex("1")]), /permission denied/);
      await assert.rejects(db.query("select * from public.list_client_orders()"), /permission denied/);
      const functions = [
        ["queue_client_sale()", "select public.queue_client_sale()", []],
        ["client_sale_state(text)", "select public.client_sale_state($1)", ["cs_test_retry"]],
        ["claim_client_sale_email(text,text,jsonb)", "select public.claim_client_sale_email($1,$2,$3)", ["cs_test_retry", "owner", {}]],
        ["finish_client_sale_email(text,text,uuid,boolean)", "select public.finish_client_sale_email($1,$2,$3,$4)", ["cs_test_retry", "owner", "00000000-0000-0000-0000-000000000000", true]],
        ["claim_client_reconcile(text,bigint)", "select public.claim_client_reconcile($1,$2)", ["test:private", 123]],
        ["checkpoint_client_reconcile(text,uuid,text,boolean)", "select public.checkpoint_client_reconcile($1,$2,$3,$4)", ["test:private", "00000000-0000-0000-0000-000000000000", null, true]],
        ["review_client_sale(text,text)", "select public.review_client_sale($1,$2)", ["cs_test_retry", "review"]],
        ["clear_client_sale_review(text)", "select public.clear_client_sale_review($1)", ["cs_test_retry"]],
      ];
      for (const [signature, sql, args] of functions) {
        assert.equal((await one("select has_function_privilege(current_user, $1, 'EXECUTE') as allowed", [`public.${signature}`])).allowed, false, `${role} can execute ${signature}`);
        await assert.rejects(db.query(sql, args), /permission denied/, `${role} called ${signature}`);
      }
    } finally {
      await db.exec("reset role");
    }
  }
});

await db.close();
console.log(`${passed} order database checks passed`);

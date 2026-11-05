# Operations runbook

How the live site runs, how to ship and undo a change, and what to check when something looks wrong.

## What runs where

| Piece | Where | Notes |
| --- | --- | --- |
| Site, API routes, daily cron | Vercel project `partnership-with-media-dev` | Every merge to `Master` deploys to production. Domain `partnershipwithmedia-dev.com`; `www` redirects to it. |
| Orders, agreements, reminders | Supabase project **PWM Client Orders** (`ymflywnoumxgllzlecuq`) | Not the Nick's Process Services project. Server only, through the SQL functions in `supabase/migrations/`. |
| Payments | Stripe account **PWM-Dev**, live mode | One webhook endpoint → `/api/stripe/webhook`. The account is shared with client sites; the webhook ignores their events except disputes and fraud warnings. |
| Email | Resend | Sends from `CONTACT_FROM_EMAIL` on the verified domain. |
| Signing reminders | Vercel Cron, `0 17 * * *` (17:00 UTC daily) | `vercel.json` → `/api/cron/signing-reminders`. |
| Order reconciliation | Vercel Cron, `30 17 * * *` | `/api/cron/reconcile-orders`. Repairs missing orders and unfinished sale emails. Resumes a bounded historical sweep; needs `RECONCILE_FROM`. |
| CI | GitHub Actions, `.github/workflows/ci.yml` | Type check and `npm test` on every PR and push to `Master`. Needs no secrets. Required to merge. |
| Uptime alerts | UptimeRobot | HTTPS check every 12 hours; emails the owner on downtime. |

## Shipping a change

1. Open a PR into `Master`. CI runs the type check and the order tests; Vercel builds a preview.
2. Merge once both are green (GitHub won't allow it before CI passes). Vercel deploys to production in about a minute.
3. If the change needs a database change, apply the migration **before** merging (see below), so the new code never
   meets the old database.

## Undoing a bad deploy

Vercel → project → **Deployments** → the last good production deployment → **⋯ → Instant Rollback**. It takes seconds and
needs no rebuild. Then revert the bad commit on `Master` (`git revert <sha>` in a PR), or the next merge redeploys it.

Rollback only undoes code. A migration stays applied, which is why migrations must keep the old code working too: add
fields and functions, don't remove or rename them in the same change that stops using them.

## Database migrations

Migrations live in `supabase/migrations/` and are applied by hand, never from CI (CI has no database access on purpose).

1. Test locally: `npm test` applies every migration to a throwaway Postgres.
2. Apply the new file to **PWM Client Orders**: paste it into the Supabase SQL editor, or ask Claude to apply it.
3. Check it: Supabase → Database → Migrations should list it.

Supabase records each migration under the time it was applied, not the timestamp in the file name. If you later switch
to `npx supabase db push`, mark the existing ones as applied first (`npx supabase migration repair --status applied
<version>`), or it will try to run them again.

## Settings that matter

All set in Vercel → Settings → Environment Variables (production). Redeploy after changing one.

| Variable | If it's missing or wrong |
| --- | --- |
| `STRIPE_SECRET_KEY` | Checkout fails with an error. |
| `STRIPE_WEBHOOK_SECRET` | Every webhook is rejected; Stripe retries for 3 days and emails the account. No sale emails or orders. |
| `RESEND_API_KEY` | Paid orders are still saved, but the webhook answers 503 so Stripe retries the emails. Contact form shows "not connected yet". |
| `CONTACT_FROM_EMAIL` | Falls back to Resend's test sender, which only delivers to the Resend account owner: buyers get nothing. |
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Both unset: legacy email-only mode. Once configured, a rejected key fails the sale webhook before email so Stripe can retry. Reconciliation returns 503 if order storage is unavailable. |
| `ORDER_LINK_SECRET` | Under 32 characters while storage is configured: the webhook fails before email. **Don't change it.** Links already emailed keep opening, but every link the site builds afterwards for an existing order (signing reminders, a retried sale email) points nowhere. |
| `CRON_SECRET` | Unset: both crons (reminders, reconciliation) refuse every call. |
| `RECONCILE_FROM` | Missing, invalid or future: reconciliation returns 503. Use an ISO date (midnight UTC) or a precise UTC timestamp, starting when order storage went live. Do not move it earlier without inspecting historical sales in Stripe. |

## When something looks wrong

| Symptom | Look here |
| --- | --- |
| Errors on the site | Vercel → project → **Logs** (filter by route), or ask Claude for runtime errors. |
| A buyer paid but got no email | Stripe → Developers → Webhooks → the endpoint: failed deliveries and their responses. Then Resend → **Emails** for that address. |
| Webhook/cron shows errors | Check Resend and Supabase configuration, the applied sale receipt migration, and the error log. Stripe retries sale webhooks; the daily scan retries unfinished work after that. |
| A buyer paid but has no order/email | Check the daily reconciliation logs and `client_sale_deliveries` pending rows. A successful sweep repairs eligible sales; `more: true` means another batch remains. Authenticated manual runs can drain it sooner. |
| No signing reminders | Vercel → project → **Cron Jobs** for the last run, then Logs for `/api/cron/signing-reminders`. A 503 there means Supabase was unavailable; the next day's run catches up. |
| Order page says the link isn't valid | Check the order exists (`npm run orders -- list`). If the link came from a reminder, check `ORDER_LINK_SECRET` hasn't changed since the order was paid. |

## Monitoring and safeguards

- **Uptime:** UptimeRobot checks `https://partnershipwithmedia-dev.com/` every 12 hours and emails
  `devteam@partnershipwithmedia-dev.com` when it goes down and when it's back. At that interval an outage can run up
  to 12 hours before the alert; the free plan allows checks down to every 5 minutes (monitor → Edit → Monitor
  interval). Dashboard → the monitor → **Test
  Notification** sends a sample alert.
- **Required CI:** `Master` is protected. A PR merges only once the `check` job (type check and order tests) passes,
  and nobody can bypass it, admins included. A direct push to `Master` is refused unless CI passed on that commit, so
  ship through PRs. To change the rule: GitHub → Settings → Branches → `Master` → Edit.

## Reconciliation rollout and recovery

The `20261105054847_sale_delivery_receipts.sql` migration was applied to PWM Client Orders during the PR #22 rollout.
For a fresh installation, apply it before deploying this code. It adds private tables and functions,
without changing existing order/signature records. New orders get owner/buyer email receipts in the same database
transaction as the order. Existing orders at rollout are marked already notified to avoid re-emailing historical
buyers; audit their Stripe delivery and Resend logs manually if a past email is suspected missing. Rolling back the
code leaves the schema compatible, but the old code does not acknowledge these receipts: check pending rows before
rolling forward again.

Set `RECONCILE_FROM` in production (initial intended boundary: `2026-11-04T00:00:00Z`) and redeploy via the PR merge.
The endpoint requires `Authorization: Bearer <CRON_SECRET>`. An unauthenticated request returns 401 before doing work.
A missing boundary or broken storage returns 503 rather than reporting a successful run.

The sweep scans every completed Checkout from that boundary, with no seven-day expiry. It freezes an upper timestamp
(two hours before the sweep starts), processes at most 50 sessions per invocation, and saves its cursor after each.
It stops starting work after about 180 seconds; the function has a 300-second maximum. `more: true` means continue on
the next invocation. End-of-history resets the cursor so bank payments that were still clearing are checked again.
At low volume a sweep normally completes in one daily run. Larger backlogs take multiple runs; do not promise a
fixed recovery time. A bad sale increments `failed` and records a retry obligation before advancing; if that write or a checkpoint fails,
the run aborts. Unfinished work is revisited on a later sweep; resolved review records are cleared.

Only paid sessions in the current Stripe mode for our offers qualify. Before historical fulfillment, the job checks
that charges were captured and have no successful/pending refund or dispute. Maintenance recovery checks the
original Checkout invoice and its payments, plus the current subscription. Ambiguous, refunded, disputed or ended
sales are stored in `client_sale_reviews` for manual investigation, not automatically welcomed or put into build.
Inspect this table when the response's `review` count is nonzero. It contains Stripe session references, not card data.

Owner/buyer emails have independent persistent receipts. Their first full request is saved before sending and reused
on retries (including the sender, recipient and link), so a configuration or copy change cannot conflict with a
Resend key. Pending email snapshots contain buyer details and their private link: these tables have RLS enabled and
no browser access. The snapshot is cleared after the accepted send is recorded. Recorded sends are never
automatically sent again, even after Resend's 24-hour key window. Concurrent
webhook/cron attempts use expiring leases. Successful runs log `scanned`, `checked`, `repaired`, `failed`, `review`,
`more` and `skipped`; failures return 503. Use Vercel cron logs to monitor these results.

There is one unavoidable ambiguity: if Resend accepts an email and the process dies before its receipt is saved,
a retry within 24 hours is deduplicated by Resend. After 24 hours the system may send a duplicate to avoid losing the
message. This is eventual retry with durable progress, not an absolute exactly-once delivery guarantee. A receipt
means Resend accepted the send; spam filtering, bouncing and inbox delivery are still checked in Resend.

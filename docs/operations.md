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
| Order reconciliation | Vercel Cron, `30 17 * * *` | `/api/cron/reconcile-orders`. Repairs a paid sale whose webhook never recorded an order (Stripe stops retrying after about 3 days). Does nothing unless `RECONCILE_FROM` is set. |
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
| `SUPABASE_URL`, `SUPABASE_SECRET_KEY` | Unset: no order records (sales still work). Rejected key: logged as `Invalid API key`, sale emails still go out without an order link. |
| `ORDER_LINK_SECRET` | Under 32 characters: no order records. **Don't change it.** Links already emailed keep opening, but every link the site builds afterwards for an existing order (signing reminders, a retried sale email) points nowhere. |
| `CRON_SECRET` | Unset: both crons (reminders, reconciliation) refuse every call. |
| `RECONCILE_FROM` | Unset: the reconciliation does nothing. Set it to the date order records went live (an ISO date). Setting it earlier than that would re-send emails for sales made before order records existed. |

## When something looks wrong

| Symptom | Look here |
| --- | --- |
| Errors on the site | Vercel → project → **Logs** (filter by route), or ask Claude for runtime errors. |
| A buyer paid but got no email | Stripe → Developers → Webhooks → the endpoint: failed deliveries and their responses. Then Resend → **Emails** for that address. |
| Webhook shows 503s | `RESEND_API_KEY` is missing. Set it and redeploy; Stripe's retries deliver the emails once. |
| A buyer paid but has no order | The reconciliation run (daily, 17:30 UTC) creates it and sends their emails within a day. To run it now: call `/api/cron/reconcile-orders` with `Authorization: Bearer $CRON_SECRET`. Its response shows `checked` and `repaired`. |
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

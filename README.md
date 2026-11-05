# PartnershipWithMedia_Dev

The PWM_DEV marketing site: a Next.js (App Router, TypeScript, Tailwind v4) port of the neon brutalist mockup in [`design/`](design/).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Running the live site (deploys, rollback, migrations, what each setting breaks): [`docs/operations.md`](docs/operations.md).

## Where things live

- `lib/content.ts` holds all copy: contact details, services, tech marquee and case studies.
- `components/` has one file per page section.
- `app/globals.css` holds the palette (`@theme`) and the custom brutalist effects.

## Contact form email

The form posts to `app/api/contact/route.ts`, which validates the input, drops honeypot spam silently, and sends through the [Resend](https://resend.com) API. Copy `.env.example` to `.env.local` (or set these in Vercel):

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Optional destination override (comma-separated for several). Defaults to `devteam@partnershipwithmedia-dev.com`. |
| `CONTACT_FROM_EMAIL` | Optional sender on a domain verified in Resend; defaults to `onboarding@resend.dev` |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical URL (e.g. `https://pwmdev.com`) once a custom domain is attached. On Vercel it defaults to the production domain. |

Without `RESEND_API_KEY`, the form shows a "not connected yet" message with the direct email address instead of failing silently.

## Client orders and the service agreement

After a buyer pays, the Stripe webhook records the order in Supabase and emails the buyer a private order page
(`/orders/<link>`). On that page build packages (Origin, Nexus, Aura, Matrix) are signed before work starts, and the
buyer follows the status from then on. Deposits and the maintenance plan are recorded without a signature step.
`/how-it-works` and the buy page explain the process, hosting and the domain before anyone pays.

It is optional: with the variables below unset, checkout and the purchase emails work exactly as before.

1. Create a Supabase project for PWM_DEV (keep it separate from any client's data) and apply
   `supabase/migrations/20261103120000_client_orders.sql` (SQL editor, or `supabase db push`).
2. Set in `.env.local` and Vercel: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` (secret or legacy service_role key; server only),
   and `ORDER_LINK_SECRET` (at least 32 random characters, e.g. `openssl rand -base64 32`). Changing the link secret
   breaks links already emailed. Buyers only get their link by email, so `CONTACT_FROM_EMAIL` must be on a domain
   verified in Resend: Resend's test sender delivers to the account owner only. Redeploy after setting the variables.
3. Move orders along from your machine; the buyer sees each update on their order page:

```bash
npm run orders -- list
npm run orders -- status PWM-ABCD2345 kickoff "Questionnaire is in your inbox."
npm run orders -- status PWM-ABCD2345 live "Your site is live." --url https://example.com
```

The database refuses impossible moves and won't start build work on an unsigned package.

**The agreement (`lib/agreement.ts`) is a draft.** Clauses marked `draft: true` are business terms still to decide, and
`approved: false` means it can only be signed with Stripe test keys. Read it, have an attorney review it, then set
`approved: true`. To change signed terms later, add a new version instead of editing one buyers have signed.

`npm test` checks the SQL on an in-process Postgres (PGlite) and runs the webhook and signing handlers against it.

## Swapping in real content

- **Images:** placeholders live in `public/images/` (each one says its suggested size). Drop your photo in that folder and update the matching path in `lib/content.ts`, e.g. `heroImage = "/images/hero.jpg"`. Photos render grayscale to match the design.
- **Contact details:** `contact.email` in `lib/content.ts`.
- **About copy:** the `about` object in `lib/content.ts`.
- **Case studies:** `caseStudies` in `lib/content.ts`. Each project gets its own page at `/work/<slug>` plus a generated share image. The portfolio features Emanuel Pet Grooming, MasaFlow, and Pawtrackr. Entries distinguish client and independent work and describe implemented capabilities without claiming measured business results. Retired concept URLs redirect through `next.config.ts`.
- **Project images:** `public/images/projects/` contains optimized WebP presentations of actual interfaces. Emanuel and MasaFlow use browser captures; Pawtrackr uses the existing iPad checkout verification capture with test data. MasaFlow was captured with a fresh preview ledger. Original projects remain separate from this site. These images stay in color to show each project's identity; other existing site imagery keeps its original styling.

## SEO

Per-page titles and descriptions, canonical URLs, Open Graph and Twitter cards with generated share images, `sitemap.xml`, `robots.txt`, and schema.org structured data (ProfessionalService on the home page, CreativeWork on case studies). After launch, submit `/sitemap.xml` in Google Search Console.

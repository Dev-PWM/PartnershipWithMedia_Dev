# PartnershipWithMedia_Dev

The PWM_DEV marketing site: a Next.js (App Router, TypeScript, Tailwind v4) port of the neon brutalist mockup in [`design/`](design/).

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Where things live

- `lib/content.ts` holds all copy: contact details, services, tech marquee and case studies.
- `components/` has one file per page section.
- `app/globals.css` holds the palette (`@theme`) and the custom brutalist effects.

## Contact form email

The form posts to `app/api/contact/route.ts`, which validates the input, drops honeypot spam silently, and sends through the [Resend](https://resend.com) API. Copy `.env.example` to `.env.local` (or set these in Vercel):

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `CONTACT_TO_EMAIL` | Where inquiries land (comma-separated for several) |
| `CONTACT_FROM_EMAIL` | Optional sender on a domain verified in Resend; defaults to `onboarding@resend.dev` |
| `NEXT_PUBLIC_SITE_URL` | Optional canonical URL (e.g. `https://pwmdev.com`) once a custom domain is attached. On Vercel it defaults to the production domain. |

Without the key the form shows a "not connected yet" message instead of failing silently.

## Swapping in real content

- **Images:** placeholders live in `public/images/` (each one says its suggested size). Drop your photo in that folder and update the matching path in `lib/content.ts`, e.g. `heroImage = "/images/hero.jpg"`. Photos render grayscale to match the design.
- **Contact details:** `contact.email` and `contact.github` in `lib/content.ts`.
- **About copy:** the `about` object in `lib/content.ts`.
- **Case studies:** `caseStudies` in `lib/content.ts`. Each one gets its own page at `/work/<slug>` plus a generated share image. The three included are concept builds (`kind: "concept"`), labelled as such on the site. When you have real client work, add it with `kind: "client"` and the labels switch to "Case Study" / "Results".

## SEO

Per-page titles and descriptions, canonical URLs, Open Graph and Twitter cards with generated share images, `sitemap.xml`, `robots.txt`, and schema.org structured data (ProfessionalService on the home page, CreativeWork on case studies). After launch, submit `/sitemap.xml` in Google Search Console.

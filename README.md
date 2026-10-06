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

Without the key the form shows a "not connected yet" message instead of failing silently.

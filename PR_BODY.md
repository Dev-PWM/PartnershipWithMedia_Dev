<!-- ccr-projects-attribution: {"github_login":"Louioui"} -->
_Requested by **Loui**_

Before: the repo held only a README and LICENSE, and the PWM_DEV home page existed only as a static Tailwind CDN mockup.

After: the mockup is a Next.js (App Router, TypeScript, Tailwind v4) site with the same neon brutalist look, a working contact form that emails inquiries, a new About section, and local placeholder images ready to swap.

How: each section is its own component in `components/`, and all copy and data live in `lib/content.ts`. The hero CTAs and the case-study modal preset the contact form's project type through shared React state. The form posts to `app/api/contact/route.ts`, which validates on the server, silently drops honeypot submissions, and sends through the Resend API using `RESEND_API_KEY` and `CONTACT_TO_EMAIL` (see `.env.example`). Fonts are self-hosted with Fontsource and Font Awesome is replaced with `react-icons`. The original mockup is kept in `design/`.

Also included: three concept case studies (clearly labelled, not client work), each with its own page and share image; SEO basics (metadata, canonical URLs, Open Graph/Twitter cards, sitemap, robots, structured data); and a polish pass covering the mobile menu, accessibility (skip link, focus styles, AA contrast, reduced motion) and responsive images via `next/image`.

Still placeholder: the contact email and GitHub link, the About copy, and the images in `public/images/`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

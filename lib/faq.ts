// Homepage FAQ. Each question is phrased the way people search ("how much does a website cost"), and answers pull
// prices and timelines from lib/content.ts so they always match the Packages section.
//
// An entry whose answer is null is hidden, so a question can sit here until its answer is decided.

import { deposit, hosting, maintenance, packageDetails, packages } from "@/lib/content";

const price = (id: keyof typeof packageDetails) => packages.find((p) => p.offer === id)!.price;
const weeks = (id: keyof typeof packageDetails) => packageDetails[id].timeline.replace(/^About /, "about ");

// TODO(you): do you take clients outside Los Angeles? Answer in one or two sentences, in your own words, and say
// how you work with them (video calls? in person around LA?). Leave null to hide the question.
// This answer is also the honest basis for `areaServed` in app/page.tsx: if you serve all of Southern California or
// remote clients anywhere in the US, say so here and widen areaServed to match.
const serviceAreaAnswer: string | null = null;

const all: { q: string; a: string | null }[] = [
  {
    q: "How much does a website cost?",
    a: `Every package has a fixed price: Origin is ${price("origin")}, Nexus ${price("nexus")}, Aura with an online store ${price("aura")}, and Matrix with your own app ${price("matrix")}. Origin, Nexus and Aura can be split into smaller payments at checkout.`,
  },
  {
    q: "How long does it take to build a website?",
    a: `An Origin site takes ${weeks("origin")}. Nexus takes ${weeks("nexus")}, Aura ${weeks("aura")}, and Matrix ${weeks("matrix")}.`,
  },
  { q: "Do you work with businesses outside Los Angeles?", a: serviceAreaAnswer },
  {
    q: "Can I see something before I commit?",
    a: `Yes. For ${deposit.price} I build a preview of Origin, Nexus or Aura for your business, so you can see it before you buy the full package.`,
  },
  {
    q: "Do I own my domain name?",
    a: `${hosting.points[0]} ${hosting.points[1]}`,
  },
  {
    q: "Who hosts my website?",
    a: `${hosting.summary} I connect your domain and handle the setup.`,
  },
  {
    q: "What happens after my website is live?",
    a: `I recommend the ${maintenance.name} at ${maintenance.price} a ${maintenance.interval}: security updates, daily backups, downtime alerts and your small changes included.`,
  },
  {
    q: "Can you fix or redesign my current website?",
    a: "Yes. I review what you have first, then tell you whether it's worth improving or would cost less to rebuild.",
  },
  {
    q: "Do you build iPhone and Android apps?",
    a: `Yes. The Matrix package (${price("matrix")}) includes your own iPhone and iPad app. An Android app can be added for a separately quoted price.`,
  },
];

export const homeFaq = all.filter((f): f is { q: string; a: string } => f.a !== null);

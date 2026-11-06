// One page per service at /services/<slug>, so each search phrase has a page that is about only that.
//
// SEO notes: `title` becomes the <title> (the layout adds " | PWM_DEV"), so keep it under ~50 characters and lead with
// the phrase people type. `description` is the search-result snippet: under ~155 characters. `h1` is the visible
// headline. Prices and timelines come from lib/content.ts so they can't drift from the Packages section.

import { carePass, maintenance, packageDetails, packages, projectKey, type ProjectType } from "@/lib/content";

type PackageId = keyof typeof packageDetails;

export type ServicePage = {
  slug: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  intro: string;
  /** Who this is for, in plain words. */
  forWho: string[];
  /** What the client gets. */
  includes: string[];
  /** Packages that fit this service, shown with price and timeline. */
  packageIds: PackageId[];
  /** A pricing line for services not sold as a package (e.g. fixes). */
  pricingNote?: string;
  /** Related case study slug from lib/content.ts. */
  caseStudy?: string;
  /** Which option the contact form opens with. */
  preset: ProjectType;
  /** Questions specific to this service, shown on the page and marked up for search engines. */
  faq: { q: string; a: string }[];
};

const price = (id: PackageId) => packages.find((p) => p.offer === id)!.price;
const timeline = (id: PackageId) => packageDetails[id].timeline.replace(/^About /, "about ");

export const servicePages: ServicePage[] = [
  {
    slug: "website-design",
    title: "Small Business Website Design in Los Angeles",
    description: `Custom website design for Los Angeles small businesses, from ${price("origin")}. Mobile-friendly, fast, hosted for you, built one-on-one by your developer.`,
    eyebrow: "Service_01 / Website_Design",
    h1: "Website design for Los Angeles small businesses",
    intro:
      "A website that tells people who you are, what you offer and how to reach you, built so it looks right on every phone and loads fast. You work directly with the developer who designs and builds it, from the first call to launch day.",
    forWho: [
      "New businesses that need to look real and trusted from day one",
      "Salons, restaurants, studios and shops that want to stand out",
      "Owners who want one person to talk to, not an agency",
    ],
    includes: [
      "Custom design around your brand, photos and customers",
      "Layouts that work on phones, tablets and computers",
      "Clear call, text and contact links on every page",
      "Hosting handled for you, on a domain registered in your name",
    ],
    packageIds: ["origin", "nexus"],
    caseStudy: "emanuel-pet-grooming",
    preset: "Build a new website",
    faq: [
      {
        q: "How much does a small business website cost?",
        a: `A one-page Origin site is ${price("origin")}. A Nexus site with custom animation and detailed design is ${price("nexus")}. Both are fixed prices, so you know the cost before work starts.`,
      },
      {
        q: "How long does it take to build a website?",
        a: `An Origin site takes ${timeline("origin")}. A Nexus site takes ${timeline("nexus")}.`,
      },
      {
        q: "Do I need to write the text myself?",
        a: "No. Send whatever you already have, and I'll draft the rest for you to approve.",
      },
    ],
  },
  {
    slug: "website-redesign",
    title: "Website Redesign & Fixes in Los Angeles",
    description:
      "Website redesign and fixes for Los Angeles businesses: refreshed content, cleaner mobile layouts and faster pages, from the developer who does the work.",
    eyebrow: "Service_02 / Site_Improvements",
    h1: "Website redesign and fixes in Los Angeles",
    intro:
      "Already have a website that looks dated, breaks on phones or loads slowly? I start with a clear-eyed look at what you have, then make focused updates: refreshed content, cleaner mobile layouts and faster pages.",
    forWho: [
      "Sites that look outdated or don't match the business anymore",
      "Pages that are hard to use on a phone",
      "Owners who can't get changes made by whoever built the site",
    ],
    includes: [
      "A review of what's working and what isn't",
      "Updated text, photos, prices and hours",
      "Mobile layout and speed fixes",
      "A full rebuild when patching the old site would cost more",
    ],
    packageIds: ["origin", "nexus"],
    pricingNote: `Small changes are covered by the ${maintenance.name} (${maintenance.price}/${maintenance.interval}) or a ${carePass.name} (${carePass.price}). Bigger redesigns are quoted before I start, or rebuilt as one of the packages below.`,
    preset: "Fix / Enhance my website",
    faq: [
      {
        q: "Can you fix a website someone else built?",
        a: "Yes. I look at what you have first, then tell you whether it's worth fixing or would cost less to rebuild.",
      },
      {
        q: "How much do small website changes cost?",
        a: `Text, photo, price and hours changes are included in the ${maintenance.name} at ${maintenance.price} a ${maintenance.interval}. Not on the plan? A ${carePass.name} for ${carePass.price} covers every change you ask for in 24 hours.`,
      },
    ],
  },
  {
    slug: "web-app-development",
    title: "Custom Web App Development in Los Angeles",
    description:
      "Custom web applications for Los Angeles businesses: online ordering, customer portals, staff tools and live sales reporting, built around how you work.",
    eyebrow: "Service_03 / Web_Apps",
    h1: "Custom web app development",
    intro:
      "When a website isn't enough: online stores, customer portals, staff workflows and live reporting, built around how your business actually runs rather than forcing you into someone else's software.",
    forWho: [
      "Businesses that sell products or services online",
      "Teams juggling spreadsheets, paper tickets or several apps",
      "Owners who want to see sales and orders as they happen",
    ],
    includes: [
      "Online checkout that pays into your own Stripe account",
      "A private page where each customer tracks their orders",
      "Admin tools for you and your staff",
      "Live updates where your workflow needs them",
    ],
    packageIds: ["aura", "matrix"],
    caseStudy: "masaflow",
    preset: "Build a web application",
    faq: [
      {
        q: "How much does a custom web app cost?",
        a: `An online store with a customer portal (Aura) is ${price("aura")}. A full system with admin tools and an iPhone app (Matrix) is ${price("matrix")}.`,
      },
      {
        q: "Do customers pay me directly?",
        a: "Yes. Checkout runs on your own Stripe account, so payments go straight to you and receipts come from your business.",
      },
    ],
  },
  {
    slug: "iphone-app-development",
    title: "iPhone, iPad & Mac App Development in LA",
    description:
      "Native iPhone, iPad and Mac apps built in SwiftUI for Los Angeles businesses, with iCloud sync, TestFlight previews and App Store submission handled.",
    eyebrow: "Service_04 / Native_Swift",
    h1: "iPhone, iPad and Mac app development",
    intro:
      "Native apps for the Apple devices your customers and staff already carry, built in SwiftUI with records stored on the device and synced through iCloud. You try each milestone on your own phone through TestFlight before it reaches the App Store.",
    forWho: [
      "Growing businesses ready to be on their customers' home screens",
      "Teams that need a fast, reliable tool on iPad or Mac",
      "Owners who want an app and the website behind it from one developer",
    ],
    includes: [
      "Native SwiftUI design for iPhone, iPad and Mac",
      "iCloud sync so data follows you across devices",
      "TestFlight previews at every milestone",
      "App Store submission handled for you",
    ],
    packageIds: ["matrix"],
    caseStudy: "pawtrackr",
    preset: "Build a mobile app",
    faq: [
      {
        q: "How much does it cost to build an iPhone app?",
        a: `The Matrix package, which includes your iPhone and iPad app plus the website and admin tools behind it, is ${price("matrix")}, delivered in milestones over ${timeline("matrix")}.`,
      },
      {
        q: "Do you build Android apps?",
        a: "An Android app can be added to Matrix for a separately quoted price.",
      },
      {
        q: "What do I need to publish on the App Store?",
        a: "An Apple Developer account in your business's name. I handle the build and the App Store submission.",
      },
    ],
  },
  {
    slug: "restaurant-pos-system",
    title: "Restaurant Ordering & POS Systems",
    description:
      "Custom restaurant ordering, point-of-sale and kitchen screens built so staff move fast during a rush, with live sales reporting for the owner.",
    eyebrow: "Service_05 / Business_Systems",
    h1: "Restaurant ordering and POS systems",
    intro:
      "Clear, practical screens for point-of-sale, kitchen and checkout work, designed so staff can move quickly during a busy shift. Customer ordering, the counter and the kitchen all work from the same live order.",
    forWho: [
      "Restaurants and food stands outgrowing paper tickets",
      "Owners paying high fees for software that doesn't fit",
      "Businesses that want sales numbers at the end of every shift",
    ],
    includes: [
      "Customer ordering on their own phone",
      "A staff POS and kitchen display that update instantly",
      "Live menu availability and table tracking",
      "Shift reports and exports for reconciliation",
    ],
    packageIds: ["aura", "matrix"],
    caseStudy: "masaflow",
    preset: "Build a web application",
    faq: [
      {
        q: "Can a POS system be built around how my restaurant works?",
        a: "Yes. The screens follow your menu, your kitchen's order of operations and how your staff hand off orders, instead of a generic template.",
      },
    ],
  },
];

export const getServicePage = (slug: string) => servicePages.find((s) => s.slug === slug);

/** Link that opens the homepage contact form with this service's option selected. */
export const serviceContactHref = (s: ServicePage) => `/?project=${projectKey(s.preset)}#contact`;

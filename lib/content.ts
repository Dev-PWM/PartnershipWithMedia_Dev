// Site copy and data in one place, so content can change without touching layout.
//
// Images live in public/images/. To swap a placeholder, drop your photo in that
// folder and point the matching path below at it (e.g. "/images/hero.jpg").

import type { Offer } from "@/lib/stripe";

export const contact = {
  email: "DEVTEAM@PARTNERSHIPWITHMEDIA-DEV.COM",
};

export const support = {
  paypalUrl: "https://www.paypal.com/qrcodes/managed/2f7aac8c-4b04-4ff8-bc16-751d7deb472f",
};

// `key` is the short form used in links like /?project=web-app#contact.
export const projectTypes = [
  { key: "fix", value: "Fix / Enhance my website", label: "Fix / Enhance Existing" },
  { key: "new-site", value: "Build a new website", label: "Build New Product" },
  { key: "web-app", value: "Build a web application", label: "Web App Architecture" },
  { key: "native", value: "Build a mobile app", label: "Native iOS / macOS" },
] as const;

export type ProjectType = (typeof projectTypes)[number]["value"];

export const projectKey = (value: ProjectType) => projectTypes.find((t) => t.value === value)!.key;

export const techStack = [
  "Swift / SwiftUI",
  "React / Next.js",
  "Node.js",
  "TypeScript",
  "Express / Socket.io",
  "SwiftData / CloudKit",
  "Tailwind CSS",
];

export type ServiceIcon = "wrench" | "code" | "apple" | "layers";

export const services: { icon: ServiceIcon; title: string; body: string }[] = [
  {
    icon: "wrench",
    title: "Site Improvements",
    body: "A clear-eyed look at the site you already have, then focused updates: refreshed content, cleaner mobile layouts, and faster pages.",
  },
  {
    icon: "code",
    title: "Web Apps",
    body: "Custom web applications built around how your business actually runs, like ordering, staff workflows, and live sales reporting.",
  },
  {
    icon: "apple",
    title: "Native Swift",
    body: "Native apps for iPhone, iPad, and Mac, built in SwiftUI with your records stored on the device and synced through iCloud.",
  },
  {
    icon: "layers",
    title: "Business Systems",
    body: "Clear, practical screens for point-of-sale, kitchen, and checkout work, designed so staff can move quickly during a busy shift.",
  },
];

export type CaseStudy = {
  slug: string;
  kind: "concept" | "client" | "independent";
  website?: string;
  imageCaption?: string;
  cardTitle: string;
  name: string;
  title: string;
  summary: string;
  image: string;
  imageAlt: string;
  year: string;
  role: string;
  presetProject: ProjectType;
  challenge: string;
  solution: string;
  approach: { title: string; body: string }[];
  targets: string[];
  tech: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    slug: "emanuel-pet-grooming",
    kind: "client",
    cardTitle: "Business Website",
    name: "Emanuel Pet Grooming",
    title: "A distinctive website for a neighborhood grooming studio",
    summary: "A custom website for an East Los Angeles pet grooming studio. Playful bubbles, expressive typography, and a photo-led layout bring the business to life while keeping services, location, and contact one tap away.",
    image: "/images/projects/emanuel-grooming.webp",
    imageAlt: "Emanuel Pet Grooming website with blue bubbles, studio photographs, and the headline Every pet leaves camera-ready",
    imageCaption: "Actual website capture, presented in a browser frame.",
    website: "https://emanuelpetgrooming.com",
    year: "2026",
    role: "Web design & development",
    presetProject: "Build a new website",
    challenge: "Give a local grooming studio a recognizable online presence that feels personal and makes it easy for pet owners to explore the services and get in touch from their phone.",
    solution: "Built a responsive site in HTML, CSS, and JavaScript with self-hosted fonts, an interactive bubble canvas, layered parallax, a photo lightbox, and direct call and text links. The main content stays readable without JavaScript, and reduced-motion preferences are respected.",
    approach: [
      { title: "A visual identity with personality", body: "A soft blue palette, oversized serif typography, and floating photo bubbles give the studio a distinctive identity using photographs from the actual business." },
      { title: "From browsing to contact", body: "Service packages, visit information, location, and frequently asked questions sit in one continuous page, with clear call and text actions." },
      { title: "Motion with a purpose", body: "Canvas bubbles and layered scrolling add character on desktop. Touch devices keep native scrolling, while reduced-motion settings simplify the experience." },
    ],
    targets: ["Responsive service and location information in one page", "Direct phone and text contact without a booking account", "Photo gallery with a lightbox and optimized WebP images"],
    tech: ["HTML", "CSS", "JavaScript", "Canvas"],
  },
  {
    slug: "masaflow",
    kind: "independent",
    cardTitle: "Restaurant Platform",
    name: "MasaFlow",
    title: "Ordering, kitchen operations, and sales in one system",
    summary: "A restaurant platform built for Los Huaraches de Zapata, connecting customer ordering, a staff POS and kitchen workspace, and live sales analytics through a shared real-time backend.",
    image: "/images/projects/masaflow.webp",
    imageAlt: "Los Huaraches de Zapata customer ordering interface from the MasaFlow restaurant project",
    imageCaption: "Actual customer interface captured against a fresh preview ledger; no live customer records are shown.",
    year: "2026",
    role: "Full-stack design & development",
    presetProject: "Build a web application",
    challenge: "Keep phone orders, kitchen preparation, menu availability, and payment records aligned across customers and staff, including cash and verified bank transfers at pickup.",
    solution: "Built three React and TypeScript interfaces on an Express and Socket.io backend. Shared order states carry a ticket from review to cooking and pickup, with integer-centavo pricing, durable local persistence, and live availability updates.",
    approach: [
      { title: "Three connected workspaces", body: "Customers build their order, staff review and prepare tickets, and the analytics workspace tracks the shift. Each interface works from the same order lifecycle." },
      { title: "Real-time restaurant operations", body: "Socket.io distributes menu availability, table occupancy, and order updates. Explicit preparation and ingredient choices keep customer selections clear for the kitchen." },
      { title: "A traceable payment ledger", body: "Staff record cash or a verified bank transfer at handoff. Integer MXN centavos, atomic file writes, shift archives, and exports support reconciliation." },
    ],
    targets: ["Customer ordering, POS, and analytics in separate interfaces", "Live order tracking and menu availability over restaurant Wi-Fi", "Cash and bank-transfer records with shift reconciliation"],
    tech: ["React", "TypeScript", "Express", "Socket.io", "Tailwind CSS"],
  },
  {
    slug: "pawtrackr",
    kind: "independent",
    cardTitle: "Native Business App",
    name: "Pawtrackr",
    title: "A native workspace for pet grooming professionals",
    summary: "A native app for the daily work behind a pet grooming business: client and pet records, timed service sessions, visit photos, checkout, loyalty rewards, and business insights.",
    image: "/images/projects/pawtrackr.webp",
    imageAlt: "Pawtrackr native iPad checkout screen showing payment methods and visit loyalty rewards with test data",
    imageCaption: "Actual iPad app screenshot with test data, presented in a device frame.",
    year: "2026",
    role: "Product design & Swift development",
    presetProject: "Build a mobile app",
    challenge: "Bring client information, pet care details, active visits, and checkout into a coherent native workflow that grooming professionals can use throughout a busy day.",
    solution: "Built with SwiftUI and SwiftData, combining local persistence with CloudKit integration. Pet profiles, session tracking, a configurable service catalog, payment records, and insights share the same underlying business data.",
    approach: [
      { title: "Care starts with context", body: "Client and pet profiles keep contact details, grooming preferences, health notes, and behavior tags close to the service workflow." },
      { title: "Follow each visit", body: "Check-in and check-out, live duration tracking, and before-and-after photos document the appointment. Guided checkout brings services, notes, payment, and review together." },
      { title: "A native business toolkit", body: "SwiftUI interfaces support the Apple device experience, with SwiftData persistence, biometric unlock, revenue charts, loyalty rewards, and CSV exports." },
    ],
    targets: ["Client and pet records connected to service and visit history", "Guided checkout with payment records and visit rewards", "Business insights and exportable records in a native interface"],
    tech: ["Swift", "SwiftUI", "SwiftData", "CloudKit"],
  },
];

export const getCaseStudy = (slug: string) => caseStudies.find((c) => c.slug === slug);

export const heroImage = "/images/hero.svg";

export const about = {
  image: "/images/about-portrait.jpeg",
  imageAlt: "An orange and white cat resting its paw on a laptop",
  location: "Los Angeles, CA",
  heading: ["One Developer.", "Direct Partnership."],
  paragraphs: [
    "PWM_DEV is an independent development studio in Los Angeles. When you hire PWM_DEV, the person you talk to is the person writing your code. There are no account managers or hand-offs, so nothing gets lost in translation.",
    "I build for small businesses: a custom website for a neighborhood grooming studio, an ordering and kitchen system for a restaurant, and a native iPad app that runs a grooming business's day.",
    "The name is the approach. Partnership With Media means working one-on-one with you until the software fits the way your business actually operates.",
  ],
  principles: [
    { label: "Direct Line", body: "You work with the person building your product." },
    { label: "Clean Code", body: "Organized, readable work that is easy to build on later." },
    { label: "Fast Execution", body: "A clear scope, regular check-ins, and work that ships." },
  ],
};

// Amounts here are display copy only. What Stripe charges comes from the price
// with the matching lookup key (lib/stripe.ts), so keep the two in step.
export const packages: { offer: Offer; name: string; price: string; body: string }[] = [
  {
    offer: "origin",
    name: "Origin",
    price: "$550",
    body: "A polished one-page website that introduces your business, works on every screen size, and makes it easy for customers to reach you.",
  },
  {
    offer: "nexus",
    name: "Nexus",
    price: "$2,800",
    body: "An interactive dashboard or presentation that turns your business information into clear, explorable views, all in one place.",
  },
  {
    offer: "aura",
    name: "Aura",
    price: "$4,500",
    body: "A custom website with a built-in shopping cart and a private client portal, so customers can buy from you and keep track of their orders in one place.",
  },
  {
    offer: "matrix",
    name: "Matrix",
    price: "$13,500",
    body: "A complete custom system for your business: a customer-facing web portal, secure tools for managing it behind the scenes, and a native app for iPhone and iPad.",
  },
];

export const deposit = {
  offer: "project_deposit" as Offer,
  price: "$150",
  body: "Have something different in mind? The deposit reserves your spot on the schedule and covers the tools and services your project needs to get started.",
};

// Monthly maintenance, billed as a Stripe subscription. Subscribers cancel or
// update their card through the Stripe customer portal (billingPortalUrl in lib/site.ts).
export const maintenance = {
  offer: "maintenance_monthly" as Offer,
  name: "Maintenance Plan",
  price: "$49.99",
  interval: "month" as const,
  body: "Covers the tools and services your site runs on, plus my time keeping it secure, up to date, and growing with your business.",
  perks: [
    "Security fixes and vulnerability patches",
    "Framework and dependency updates",
    "Text, photo and color changes, free",
    "Small features and enhancements, free",
  ],
  fairUse: "Fair use: brand-new builds, like adding a store or an app, are quoted separately.",
};

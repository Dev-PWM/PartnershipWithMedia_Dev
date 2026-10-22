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
  "PostgreSQL",
  "AWS Architecture",
  "Docker",
  "API Design",
];

export type ServiceIcon = "wrench" | "code" | "apple" | "layers";

export const services: { icon: ServiceIcon; title: string; body: string }[] = [
  {
    icon: "wrench",
    title: "Rescue Ops",
    body: "Fixing broken architecture, optimizing speed, and patching UI vulnerabilities with surgical precision.",
  },
  {
    icon: "code",
    title: "Web Apps",
    body: "Building robust, custom web applications designed to scale alongside your business growth.",
  },
  {
    icon: "apple",
    title: "Native Swift",
    body: "High-performance native iOS and macOS applications utilizing SwiftUI and local-first data systems.",
  },
  {
    icon: "layers",
    title: "Systems UI",
    body: "Data-heavy, highly functional layouts for point-of-sale systems and operational dashboards.",
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
  heading: ["One Developer.", "Zero Middlemen."],
  paragraphs: [
    "PWM_DEV is an independent development studio. When you hire PWM_DEV, you talk directly to the architect who writes your code. No account managers, no hand-offs, no telephone game.",
    "I step in where the technical problem is real: rescuing a slow or broken website, architecting a dual-sided web application, or building a native iOS or macOS tool from scratch.",
    "The name is the philosophy. Partnership With Media means working one-on-one with your business until the software runs the way your operation actually works.",
  ],
  principles: [
    { label: "Direct Line", body: "You work with the person building your product." },
    { label: "Clean Code", body: "Readable, documented systems you can grow on." },
    { label: "Fast Execution", body: "Clear scope, tight feedback loops, shipped work." },
  ],
};

// Amounts here are display copy only. What Stripe charges comes from the price
// with the matching lookup key (lib/stripe.ts), so keep the two in step.
export const packages: { offer: Offer; name: string; price: string; body: string }[] = [
  {
    offer: "origin",
    name: "Origin",
    price: "$550",
    body: "One-page responsive business landing page and contact routing.",
  },
  {
    offer: "nexus",
    name: "Nexus",
    price: "$2,800",
    body: "Immersive 3D interactive data visualization and architectural prototyping, providing a central hub for complex system analysis and dynamic presentation.",
  },
  {
    offer: "aura",
    name: "Aura",
    price: "$4,500",
    body: "Your complete online store and customer hub, featuring a custom landing page, built-in shopping cart, and a dedicated client portal tailored for your business.",
  },
  {
    offer: "matrix",
    name: "Matrix",
    price: "$13,500",
    body: "Your complete, custom-built digital empire, featuring a high-end web portal, secure behind-the-scenes management systems, and your own dedicated mobile apps for iPhone and Android.",
  },
];

export const deposit = {
  offer: "project_deposit" as Offer,
  price: "$150",
  body: "Need something custom? Reserve a build slot with a deposit, credited in full toward your project's fixed quote.",
};

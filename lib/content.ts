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
    "Whether you run a neighborhood shop or a growing company, your software should work as hard as you do. I design and build it around how your business actually runs: websites that win customers, systems that keep your team in sync, and apps for the phones and tablets your customers and staff already use. Every project is crafted with care, built to last, and delivered one-on-one, so you get quality you can see and results you can count on.",
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
//
// Each package includes everything in the one before it, so buyers climb one step at a time. `body` is what the buyer
// gets: it is recorded with their signature as the package scope, so it must stay exact. Plain words only, readable by
// someone who has never hired a developer.
export const packages: { offer: Offer; name: string; price: string; tagline: string; body: string; bestFor: string }[] = [
  {
    offer: "origin",
    name: "Origin",
    price: "$550",
    tagline: "Your business, online and easy to find.",
    body: "A clean one-page website that shows who you are, what you offer and how to reach you. It looks great on phones, tablets and computers.",
    bestFor: "New businesses that need to look real and trusted from day one.",
  },
  {
    offer: "nexus",
    name: "Nexus",
    price: "$2,800",
    tagline: "Everything in Origin, made to wow.",
    body: "Everything in Origin, plus smooth animations and detailed custom design that make visitors stop scrolling and remember your business.",
    bestFor: "Businesses that need to stand out: salons, restaurants, studios and creators.",
  },
  {
    offer: "aura",
    name: "Aura",
    price: "$4,500",
    tagline: "Everything in Nexus, plus your own online store.",
    body: "Everything in Nexus, plus a shopping cart so customers can buy from you and pay you right on your site, and a private page where each customer keeps track of their orders.",
    bestFor: "Anyone who sells products or services online.",
  },
  {
    offer: "matrix",
    name: "Matrix",
    price: "$13,500",
    tagline: "Everything in Aura, plus your own app.",
    body: "Everything in Aura, plus your own iPhone and iPad app for your customers, and private tools to run your business behind the scenes. Delivered in stages. An Android app can be added for a separately quoted price.",
    bestFor: "Growing businesses ready to be in their customers' pockets.",
  },
];

// Klarna in Stripe Checkout lets buyers split a one-time payment while you are paid in full up front. Its US limits
// (Stripe docs): pay in 4 up to $2,000, monthly financing from $45 to $10,000, approval subject to the buyer's credit.
// Matrix is above the limit, so it shows no pay-over-time line. Klarna is switched on in the Stripe Dashboard
// (Settings → Payment methods); if it's ever turned off, remove these lines too.
export const payOverTimeMaxCents = 1_000_000;
export const payOverTime = "Or split it into smaller payments with Klarna at checkout, if approved. You'll see the options before you pay.";
export const canPayOverTime = (price: string) => Number(price.replace(/[^0-9.]/g, "")) * 100 <= payOverTimeMaxCents;

// Start Deposit (offer id stays project_deposit: the live Stripe price and order records use it). Work starts on it,
// so the buyer signs the agreement first; the balance is invoiced before launch.
export const deposit = {
  offer: "project_deposit" as Offer,
  name: "Start Deposit",
  price: "$150",
  body: "Not ready to pay it all? Start with $150. It saves your spot and pays for the tools your project needs, and I start once you've signed. You see your finished site before paying the rest, and the $150 counts toward your package price.",
};

// For clients not on the Maintenance Plan: member-type help for 24 hours after paying. Final, no refund.
export const carePass = {
  offer: "care_pass" as Offer,
  name: "24-Hour Care Pass",
  price: "$150",
  body: "Not on the plan? For $150, every change you ask for in the next 24 hours is included: text, photos, prices, hours and small fixes. Brand-new builds, like adding a store or an app, are quoted separately.",
};

// Monthly maintenance, billed as a Stripe subscription. Subscribers cancel or
// update their card through the Stripe customer portal (billingPortalUrl in lib/site.ts).
export const maintenance = {
  offer: "maintenance_monthly" as Offer,
  name: "Maintenance Plan",
  price: "$49.99",
  interval: "month" as const,
  body: "A website needs care, like a car needs oil changes. Every month I keep yours safe, fast and up to date, and I make the changes your business needs whenever you ask.",
  // Why every buyer should join, said after a purchase (thank-you email) and next to the plan.
  pitch: "Once your site is live, I recommend the Maintenance Plan. Websites need regular care to stay safe and fast, and members get their small changes included, so you never have to wait or pay extra for a quick update.",
  perks: [
    "Security updates, so your site stays safe and trusted",
    "Daily backups: if anything breaks, I can bring it back",
    "I'm alerted right away if your site goes down",
    "Text, photo, price and hours changes, included",
    "Small new features, included",
    "A monthly report: how fast your site is, whether it stayed up, and how many people visited",
    "Reminders so your domain name never runs out",
    "Replies the same business day",
  ],
  fairUse: "Fair use: up to 2 hours of changes a month. Brand-new builds, like adding a store or an app, are quoted separately.",
  // Clients without the plan buy a 24-Hour Care Pass for each round of changes, so the plan is always the better deal.
  nonMember: "Not on the plan? Each round of changes needs a $150 24-Hour Care Pass. On the plan, your changes are always included, for less than a third of that each month.",
};

// Next steps per offer, so the buyer knows exactly what happens after paying. Shown on /how-it-works and the buy
// page before checkout, and repeated in the thank-you email after it.
export const nextSteps: Record<Offer, { title: string; body: string }[]> = {
  origin: [
    { title: "Kickoff email", body: "Within one business day I'll send a short questionnaire about your business, your customers and the pages you need." },
    { title: "Your content", body: "Send your logo, photos and any text you already have. No copy yet? I'll draft it for you to approve." },
    { title: "Build and review", body: "You get a private preview link to review on your phone and computer, with a round of changes included." },
    { title: "Launch", body: "I connect your domain and put the site live, then walk you through anything you want to update yourself." },
  ],
  nexus: [
    { title: "Kickoff call", body: "Within one business day I'll reach out to book a short call about your business, your customers and the look and feel you want." },
    { title: "Design preview", body: "You see the design and the animations first, so we agree on the look before the full build." },
    { title: "Build and review", body: "You get a private preview link to try on your phone and computer, with changes included along the way." },
    { title: "Launch", body: "I connect your domain and put the site live, then show you anything you want to update yourself." },
  ],
  aura: [
    { title: "Discovery call", body: "Within one business day I'll reach out to map your products, checkout and the client portal you have in mind." },
    { title: "Accounts setup", body: "We connect your own payment and email accounts, so your customers pay you directly and receipts come from you." },
    { title: "Build and review", body: "You get private previews of the storefront and portal at each milestone, with changes included along the way." },
    { title: "Launch and handover", body: "We test real orders end to end, put it live on your domain, and I show you how to run it day to day." },
  ],
  matrix: [
    { title: "Discovery workshop", body: "Within one business day I'll reach out to schedule a workshop covering your web portal, admin tools and app." },
    { title: "Architecture plan", body: "You get a written plan for the system, the app and the milestones before anything is built." },
    { title: "Milestone builds", body: "Each milestone ships to a private preview, and the app goes to TestFlight so you can try it on your own devices." },
    { title: "Launch", body: "I handle App Store submission and the web launch, then stay on hand while your customers settle in." },
  ],
  project_deposit: [
    { title: "Pick your package", body: "Within one business day of signing I'll reach out to confirm your package and its price in writing." },
    { title: "Build", body: "I start right away. Your deposit has already paid for the tools your project needs." },
    { title: "See it first", body: "You get a private preview of your finished site to review on your phone and computer." },
    { title: "Pay the rest and launch", body: "I send an invoice for the package price minus your $150. Once it's paid, I put your site live." },
  ],
  care_pass: [
    { title: "Send your changes", body: "Reply to this email with everything you'd like changed. Anything you ask for in the 24 hours after paying is included." },
    { title: "I get to work", body: "I start on your changes the same business day and send you a link to check them." },
    { title: "Pass ends", body: "Your pass ends 24 hours after you paid. For changes any time without a pass, join the Maintenance Plan." },
  ],
  maintenance_monthly: [
    { title: "You're covered", body: "From today your site is monitored, backed up daily, and kept secure and up to date." },
    { title: "Ask any time", body: "Need a text, photo or price change, or a small new feature? Reply to any of my emails and you'll hear back the same business day." },
    { title: "Monthly report", body: "Each month you get a short report on your site's speed, uptime and visitors." },
    { title: "Monthly billing", body: "Your plan renews monthly through Stripe, and you can cancel or update your card whenever you like." },
  ],
};

// What each build needs from the client and roughly how long it takes. Timelines are typical estimates shown to buyers
// before they pay; the signed agreement says they are estimates, not deadlines.
export const packageDetails: Record<"origin" | "nexus" | "aura" | "matrix", { timeline: string; youProvide: string[] }> = {
  origin: {
    timeline: "About 1 to 2 weeks once your content arrives",
    youProvide: ["Your logo and any photos you want to use", "Business details: services, hours, area served, contact info", "Any text you already have (or I'll draft it for you)", "The domain name you want, or we choose one together"],
  },
  nexus: {
    timeline: "About 3 to 5 weeks",
    youProvide: ["Your logo and any photos you want to use", "Business details: services, hours, area served, contact info", "Two or three websites you like the look of", "Any text you already have (or I'll draft it for you)"],
  },
  aura: {
    timeline: "About 4 to 8 weeks",
    youProvide: ["Your products or services, with prices", "Your own Stripe and email accounts, so customers pay you directly", "Your policies: shipping, returns, cancellations"],
  },
  matrix: {
    timeline: "About 3 to 6 months, delivered in milestones",
    youProvide: ["Time for a discovery workshop", "The people who will run the admin side", "An Apple Developer account for the App Store"],
  },
};

// How delivery works for every build. Only settled facts belong here; open business terms live in the agreement draft.
export const howItWorks = [
  { title: "Choose and pay", body: "Pick a package and pay securely through Stripe. You get a confirmation email right away." },
  { title: "Sign the agreement", body: "Your confirmation links to a private order page where you review and sign the service agreement. Work starts only after it's signed." },
  { title: "Kickoff", body: "Within one business day of signing I reach out to gather what I need from you." },
  { title: "Build and review", body: "You get private previews along the way and can request changes as described for your package." },
  { title: "Launch and hosting", body: "I put your site live and host it for you. You follow every step on your private order page." },
];

export const hosting = {
  summary: "I host your site for you, so there's nothing for you to set up or keep running.",
  points: [
    "Your domain name is registered in your name, so it always belongs to you.",
    "The domain renews once a year, paid by you directly to the registrar. A .com typically costs $10 to $20 a year.",
    "I connect the domain to your site and handle the hosting setup.",
    "Your private order page shows where your project stands at every step.",
  ],
};

// The process as it actually runs: until order records are switched on (see README) there is no private order page
// or signing step, so the public pages must not promise one.
export function deliveryProcess(ordersOn: boolean) {
  if (ordersOn) return { steps: howItWorks, hostingPoints: hosting.points };
  return {
    steps: howItWorks
      .filter((s) => s.title !== "Sign the agreement")
      .map((s) =>
        s.title === "Kickoff" ? { ...s, body: "Within one business day of your payment I reach out to gather what I need from you." }
        : s.title === "Launch and hosting" ? { ...s, body: "I put your site live and host it for you." }
        : s),
    hostingPoints: hosting.points.filter((p) => !p.includes("order page")),
  };
}

// What a buyer is agreeing to for one package, shown above the signature and recorded with it.
export function orderScope(offer: string) {
  if (offer === deposit.offer) {
    return { description: deposit.body, timeline: "Depends on the package we agree in writing", youProvide: ["Your choice of package, confirmed with me in writing before I start", "The materials listed for that package"] };
  }
  const item = packages.find((p) => p.offer === offer);
  const details = packageDetails[offer as keyof typeof packageDetails];
  return { description: item?.body ?? "", timeline: details?.timeline ?? "", youProvide: details?.youProvide ?? [] };
}

// Site copy and data in one place, so content can change without touching layout.
//
// Images live in public/images/. To swap a placeholder, drop your photo in that
// folder and point the matching path below at it (e.g. "/images/hero.jpg").

export const contact = {
  email: "HELLO@PWM_DEV.COM",
  github: "GITHUB.COM/PWM-DEV",
};

export const projectTypes = [
  { value: "Fix / Enhance my website", label: "Fix / Enhance Existing" },
  { value: "Build a new website", label: "Build New Product" },
  { value: "Build a web application", label: "Web App Architecture" },
  { value: "Build a mobile app", label: "Native iOS / macOS" },
] as const;

export type ProjectType = (typeof projectTypes)[number]["value"];

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
  id: string;
  cardTitle: string;
  title: string;
  image: string;
  challenge: string;
  solution: string;
  tech: string[];
};

export const caseStudies: CaseStudy[] = [
  {
    id: "dual-sided",
    cardTitle: "Dual-Sided Platforms",
    title: "Dual-Sided Web Platforms",
    image: "/images/case-dual-sided.svg",
    challenge:
      "Developing a unified system for restaurant owners and customers while managing real-time inventory and custom menu modifiers.",
    solution:
      "Built a multi-tenant Next.js application with a shared GraphQL API. Implemented a custom UI state machine for menu modifiers to ensure data integrity across both interfaces.",
    tech: ["Next.js", "PostgreSQL", "GraphQL", "Tailwind"],
  },
  {
    id: "native-apps",
    cardTitle: "Native Business Apps",
    title: "Native Business Apps",
    image: "/images/case-native-apps.svg",
    challenge:
      "Managing thousands of offline-first service records with complex scheduling logic on iOS and macOS.",
    solution:
      "Leveraged SwiftData for localized persistence and sync. Built a custom scheduling engine in Swift to handle edge cases like time-zone shifts and recurring multi-day appointments.",
    tech: ["Swift", "SwiftUI", "SwiftData", "CloudKit"],
  },
  {
    id: "pos-systems",
    cardTitle: "POS & Kiosk Systems",
    title: "POS & Kiosk Systems",
    image: "/images/case-pos-systems.svg",
    challenge:
      "Creating a highly responsive, touch-first UI that runs consistently across mobile tablets and Linux-based kiosk hardware.",
    solution:
      "Designed a platform-agnostic React architecture. Used optimized hardware-accelerated CSS for animations and custom currency formatting logic for global deployment.",
    tech: ["React", "Electron", "Node.js", "XState"],
  },
];

export const heroImage = "/images/hero.svg";

export const about = {
  image: "/images/about-portrait.svg",
  imageAlt: "Portrait of the developer behind PWM_DEV",
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

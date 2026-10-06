// Site copy and data in one place, so content can change without touching layout.
//
// Images live in public/images/. To swap a placeholder, drop your photo in that
// folder and point the matching path below at it (e.g. "/images/hero.jpg").

export const contact = {
  email: "DEVTEAM@PARTNERSHIPWITHMEDIADEV.COM",
  github: "GITHUB.COM/PWM-DEV",
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
  // "concept" = a self-initiated build that shows how I'd architect this kind of
  // product. Switch to "client" (and update the copy) once there's real work to show.
  kind: "concept" | "client";
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
    slug: "tableside-dual-sided-platform",
    kind: "concept",
    cardTitle: "Dual-Sided Platforms",
    name: "TableSide",
    title: "Dual-Sided Web Platforms",
    summary:
      "A restaurant ordering platform with two faces: an owner dashboard for menus and inventory, and a fast customer ordering flow, both running on one shared backend.",
    image: "/images/case-dual-sided.svg",
    imageAlt: "TableSide owner dashboard and customer ordering screens",
    year: "2026",
    role: "Architecture, full-stack build, UI",
    presetProject: "Build a web application",
    challenge:
      "Developing a unified system for restaurant owners and customers while managing real-time inventory and custom menu modifiers.",
    solution:
      "Built a multi-tenant Next.js application with a shared GraphQL API. Implemented a custom UI state machine for menu modifiers to ensure data integrity across both interfaces.",
    approach: [
      {
        title: "One schema, two products",
        body: "Owners and customers read the same menu graph. Owner-only fields are resolved behind role checks, so there is a single source of truth and no sync job between two apps.",
      },
      {
        title: "Modifiers as a state machine",
        body: "Rules like 'pick 1 to 3 toppings' or 'no extra sauce on the kids menu' are modelled as explicit states, so the cart can never hold an order the kitchen can't make.",
      },
      {
        title: "Live inventory",
        body: "When an item sells out, the owner flips one switch and customer menus update instantly through subscriptions instead of on the next page load.",
      },
    ],
    targets: [
      "Menu edits visible to customers in about a second",
      "Zero invalid modifier combinations reaching the kitchen",
      "One codebase and deploy for both sides of the platform",
    ],
    tech: ["Next.js", "PostgreSQL", "GraphQL", "Tailwind"],
  },
  {
    slug: "fieldbook-native-business-app",
    kind: "concept",
    cardTitle: "Native Business Apps",
    name: "FieldBook",
    title: "Native Business Apps",
    summary:
      "An offline-first iOS and macOS app for service businesses that schedule crews across days, sites and time zones, and need it to work with no signal.",
    image: "/images/case-native-apps.svg",
    imageAlt: "FieldBook scheduling app on iPhone and Mac",
    year: "2026",
    role: "Product design, Swift development",
    presetProject: "Build a mobile app",
    challenge:
      "Managing thousands of offline-first service records with complex scheduling logic on iOS and macOS.",
    solution:
      "Leveraged SwiftData for localized persistence and sync. Built a custom scheduling engine in Swift to handle edge cases like time-zone shifts and recurring multi-day appointments.",
    approach: [
      {
        title: "Local-first by default",
        body: "Every record lives on the device first and syncs through CloudKit in the background, so a technician in a basement still sees the whole day's jobs.",
      },
      {
        title: "A scheduling engine with tests",
        body: "Recurrence, daylight-saving shifts and multi-day jobs are handled by a pure Swift module covered by unit tests, kept separate from the UI.",
      },
      {
        title: "One codebase, two platforms",
        body: "SwiftUI views adapt from an iPhone checklist in the field to a dense multi-column planner on the Mac in the office.",
      },
    ],
    targets: [
      "Full functionality with no network connection",
      "Correct schedules across time zones and DST changes",
      "Shared SwiftUI code between iOS and macOS",
    ],
    tech: ["Swift", "SwiftUI", "SwiftData", "CloudKit"],
  },
  {
    slug: "counterkit-pos-kiosk",
    kind: "concept",
    cardTitle: "POS & Kiosk Systems",
    name: "CounterKit",
    title: "POS & Kiosk Systems",
    summary:
      "A touch-first point-of-sale and self-order kiosk interface that runs the same way on tablets and Linux kiosk hardware.",
    image: "/images/case-pos-systems.svg",
    imageAlt: "CounterKit point-of-sale screen on a kiosk",
    year: "2026",
    role: "Systems UI, front-end architecture",
    presetProject: "Build a web application",
    challenge:
      "Creating a highly responsive, touch-first UI that runs consistently across mobile tablets and Linux-based kiosk hardware.",
    solution:
      "Designed a platform-agnostic React architecture. Used optimized hardware-accelerated CSS for animations and custom currency formatting logic for global deployment.",
    approach: [
      {
        title: "Built for fingers, not cursors",
        body: "Large hit targets, no hover-dependent controls, and layouts tested at kiosk and tablet sizes so staff can work fast without mis-taps.",
      },
      {
        title: "Checkout as a state machine",
        body: "XState models the order flow (cart, payment, receipt, refunds) so the terminal can always recover cleanly from a dropped card reader or a power blip.",
      },
      {
        title: "Smooth on modest hardware",
        body: "Animations stick to GPU-friendly transforms and the bundle is kept lean, so it stays responsive on inexpensive kiosk machines.",
      },
    ],
    targets: [
      "60fps interactions on low-cost kiosk hardware",
      "Recoverable checkout after hardware or network failures",
      "Locale-aware currency and tax formatting",
    ],
    tech: ["React", "Electron", "Node.js", "XState"],
  },
];

export const getCaseStudy = (slug: string) => caseStudies.find((c) => c.slug === slug);

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

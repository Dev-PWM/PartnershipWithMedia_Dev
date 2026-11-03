// Lets Node run the app's TypeScript route handlers directly in tests: resolves the "@/..." path alias the way
// tsconfig does, and stubs "server-only" (Next.js handles that import itself in a real build).
import { register } from "node:module";

register(new URL("./resolve-hook.mjs", import.meta.url));

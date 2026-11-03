import { NextResponse } from "next/server";
import { siteUrl } from "@/lib/site";

// Checks shared by the public API routes (contact form, checkout) before any email is sent or Stripe is called.
//
// 1. JSON only, from this site. Another website can make a visitor's browser send a "simple" request (text/plain,
//    no preflight) that request.json() would still parse, so it could submit the form from anywhere. Requiring the
//    JSON content type forces a CORS preflight this site never answers, and a present Origin header must be ours.
// 2. A byte cap on the body, read before parsing.
// 3. A per-address rate limit. It is in memory, so each server instance counts separately: it stops a single
//    client hammering one instance, not a distributed flood. Vercel's Firewall rate limit is the hard limit.

export class GuardError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const allowedOrigins = (request: Request) => new Set([new URL(siteUrl).origin, new URL(request.url).origin]);

export async function readGuardedJson(request: Request, maxBytes = 16 * 1024): Promise<Record<string, unknown>> {
  const type = (request.headers.get("content-type") || "").toLowerCase();
  if (!type.startsWith("application/json")) throw new GuardError("Invalid request.", 415);
  const origin = request.headers.get("origin");
  if (origin && !allowedOrigins(request).has(origin)) throw new GuardError("Invalid request.", 403);
  const text = await request.text();
  if (Buffer.byteLength(text, "utf8") > maxBytes) throw new GuardError("Request is too large.", 413);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new GuardError("Invalid request.", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new GuardError("Invalid request.", 400);
  return body as Record<string, unknown>;
}

// Vercel sets x-real-ip itself; x-forwarded-for is only a fallback for local runs.
export const clientIp = (request: Request) =>
  request.headers.get("x-real-ip") || (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "local";

const hits = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= now) hits.delete(k);   // bounded memory
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (++entry.count > max) throw new GuardError("Too many attempts. Please wait a few minutes and try again.", 429);
}

export const guardResponse = (err: GuardError) => NextResponse.json({ error: err.message }, { status: err.status });

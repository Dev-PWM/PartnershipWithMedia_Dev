import "server-only";
import { createHash, createHmac } from "node:crypto";
import { signingOpen } from "@/lib/agreement";
import { siteUrl } from "@/lib/site";

// Client orders, stored in Supabase (supabase/migrations/20261103120000_client_orders.sql). Every rule lives in the
// SQL functions; this file only calls them with the service key, from the server.
//
// Optional: with SUPABASE_URL and SUPABASE_SECRET_KEY unset, `ordersEnabled()` is false and the site works exactly as
// before (no order records, no order links). With Supabase set, ORDER_LINK_SECRET is required: it derives each
// buyer's private link, so a missing or short one stops order writes instead of producing guessable links.

export class OrdersUnavailable extends Error {}
// The database answered but refused the key, or has no such function (wrong project). Retrying can't fix a setup
// mistake, so callers that must not block on it (the Stripe webhook) carry on without the order record.
export class OrdersMisconfigured extends OrdersUnavailable {}

export type OrderView = {
  code: string;
  offer: string;
  status: string;
  status_label: string;
  requires_agreement: boolean;
  amount_cents: number | null;
  currency: string | null;
  buyer_name: string | null;
  client_site: string | null;
  live_url: string | null;
  created_at: string;
  agreement: { version: string; sha256: string; signer_name: string; signed_at: string } | null;
  events: { title: string; detail: string | null; created_at: string }[];
};

export const ordersEnabled = () => Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SECRET_KEY?.trim());

// A setup mistake (not an outage) that should stop order writes but not purchase emails.
export const ordersConfigProblem = () =>
  ordersEnabled() && (process.env.ORDER_LINK_SECRET || "").length < 32 ? "ORDER_LINK_SECRET must be set to at least 32 random characters." : null;

// Whether new purchases go through the order flow: storage set up, and an agreement buyers can actually sign (approved,
// or Stripe test mode). Until then a live sale behaves exactly as before, rather than promising a signing step that
// would leave the order stuck. Existing order pages stay viewable either way.
export const orderFlowLive = () => ordersEnabled() && !ordersConfigProblem() && signingOpen();

function linkSecret() {
  const secret = process.env.ORDER_LINK_SECRET || "";
  if (secret.length < 32) throw new OrdersUnavailable("ORDER_LINK_SECRET must be set to at least 32 random characters.");
  return secret;
}

const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const hmac = (label: string, value: string) => createHmac("sha256", linkSecret()).update(`${label}:${value}`).digest();
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Derived from the Stripe session, so a retried webhook produces the same link and code instead of a new one.
// Only the token's hash is stored; the token itself exists in the buyer's email.
export function orderIdentity(sessionId: string) {
  const token = hmac("order-link:v1", sessionId).toString("base64url");
  const bytes = hmac("order-code:v1", sessionId);
  let code = "PWM-";
  for (let i = 0; i < 8; i++) code += BASE32[bytes[i] & 31];
  return { token, tokenHash: hashToken(token), code, url: `${siteUrl}/orders/${token}` };
}

// A 32-byte HMAC in base64url is exactly 43 characters. Anything else is rejected before touching the database.
export const isOrderToken = (value: unknown): value is string => typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);

// An address hashed with the link secret: enough to tell signatures from different places apart, without storing it.
export const hashIp = (ip: string) => createHmac("sha256", linkSecret()).update(`ip:${ip}`).digest("hex");

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const url = process.env.SUPABASE_URL!.trim().replace(/\/$/, "");
  const key = process.env.SUPABASE_SECRET_KEY!.trim();
  // New sb_secret_ keys go only in `apikey`; legacy JWT service keys are also sent as the bearer (as supabase-js does).
  const headers: Record<string, string> = { apikey: key, "Content-Type": "application/json" };
  if (!key.startsWith("sb_")) headers.Authorization = `Bearer ${key}`;
  let res: Response;
  try {
    res = await fetch(`${url}/rest/v1/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args), cache: "no-store", signal: AbortSignal.timeout(10_000) });
  } catch (err) {
    throw new OrdersUnavailable(`Supabase ${fn} unreachable: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!res.ok) {
    const message = `Supabase ${fn} ${res.status}: ${(await res.text()).slice(0, 300)}`;
    throw [401, 403, 404].includes(res.status) ? new OrdersMisconfigured(message) : new OrdersUnavailable(message);
  }
  return (await res.json()) as T;
}

// One row per Stripe Checkout session; `created` is false when Stripe redelivers an event already recorded.
export async function recordPaidOrder(o: {
  sessionId: string; offer: string; amountCents: number | null; currency: string | null; buyerName: string | null; buyerEmail: string | null; clientSite: string | null;
}) {
  const id = orderIdentity(o.sessionId);
  const rows = await rpc<{ code: string; created: boolean }[]>("record_client_order", {
    p_code: id.code, p_token_hash: id.tokenHash, p_session_id: o.sessionId, p_offer: o.offer, p_amount_cents: o.amountCents,
    p_currency: o.currency, p_buyer_name: o.buyerName, p_buyer_email: o.buyerEmail, p_client_site: o.clientSite,
  });
  if (!rows[0]) throw new OrdersUnavailable("record_client_order returned no row.");
  return { code: rows[0].code, created: rows[0].created, url: id.url };
}

export const findOrder = (token: string) => rpc<OrderView | null>("client_order_by_token", { p_token_hash: hashToken(token) });

export type SignResult =
  | { result: "signed"; code: string; offer: string; buyer_name: string | null; buyer_email: string | null; amount_cents: number | null; currency: string | null; signed_at: string }
  | {
      result: "already_signed"; code: string; offer: string; buyer_name: string | null; buyer_email: string | null; amount_cents: number | null;
      currency: string | null; signed_at: string; signer_name: string; agreement_sha256: string; agreement_version: string;
    }
  | { result: "not_signable"; code: string; status: string }
  | { result: "not_found" };

export const signAgreementRecord = (s: { token: string; version: string; sha256: string; signerName: string; ip: string; userAgent: string }) =>
  rpc<SignResult>("sign_client_agreement", {
    p_token_hash: hashToken(s.token), p_version: s.version, p_sha256: s.sha256, p_signer_name: s.signerName,
    p_ip_hash: hashIp(s.ip), p_user_agent: s.userAgent.slice(0, 400),
  });

export type ReminderStep = "buyer_1" | "buyer_2" | "owner";
export type AwaitingSignature = {
  code: string; offer: string; stripe_session_id: string; buyer_name: string | null; buyer_email: string | null;
  amount_cents: number | null; currency: string | null; created_at: string; sent: ReminderStep[];
};

export const ordersAwaitingSignature = () => rpc<AwaitingSignature[]>("orders_awaiting_signature", {});
export const recordReminder = (code: string, step: ReminderStep) => rpc<boolean>("record_order_reminder", { p_code: code, p_step: step });

export const formatMoney = (cents: number | null, currency: string | null) =>
  cents == null ? "-" : new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "usd" }).format(cents / 100);

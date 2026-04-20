// POST /api/subscribe — newsletter audience-add endpoint.
//
// Spec references:
//   /stack-recommendation.md § TL;DR  — Resend + Cloudflare Turnstile
//   /landing-copy-v0.1.md § 5         — verbatim state strings (success + 4 errors)
//   /site/.env.example                 — required env shape
//
// Activation contract:
//   When TURNSTILE_SECRET_KEY + RESEND_API_KEY + RESEND_AUDIENCE_ID are ALL
//   present in env, this endpoint is live: it validates the body with zod,
//   verifies the Turnstile token against Cloudflare, and calls Resend's REST
//   audience-contacts endpoint to add the email to the wall.
//
//   Until any one of those env vars is missing, the endpoint stays in its
//   "pending" state and returns HTTP 503 — the UI keeps the submit button
//   disabled (see app/components/SubscribeForm.tsx) so users never hit it.
//
// Why edge runtime + raw fetch (not the Resend SDK):
//   Edge routes must stay lean and keep cold starts sub-100ms. The Resend
//   SDK pulls in ~50kb of node-shimmed deps; we only need two POSTs to well-
//   documented REST endpoints, so we call them directly with fetch() and
//   keep the route's cold bundle under 10kb.
//
// Response shape (stable contract consumed by app/components/SubscribeForm.tsx):
//   { ok: true,  state: "success",            message: "…" }  // 200
//   { ok: false, state: "invalid",            message: "…" }  // 422
//   { ok: false, state: "already-subscribed", message: "…" }  // 409
//   { ok: false, state: "turnstile-failed",   message: "…" }  // 403
//   { ok: false, state: "server",             message: "…" }  // 500
//   { ok: false, state: "pending",            message: "…" }  // 503 (env missing)
//
// Every `message` string is verbatim from /landing-copy-v0.1.md § 5.

import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Copy — all strings verbatim from /landing-copy-v0.1.md § 5.
// ---------------------------------------------------------------------------

const COPY = {
  success: "You're on the wall.",
  invalid: "That doesn't look like an email. Try again.",
  alreadySubscribed: "You're already on the wall. Nothing to do.",
  server: "Something broke on our end. Try again in a minute.",
  turnstileFailed: "Couldn't verify you're human. Refresh and try again.",
  // Pending is NOT in landing-copy because it's a non-user-facing state
  // (UI keeps the button disabled so this response never reaches a user
  // through normal flow — only via direct curl).
  pending:
    "Newsletter signup activates with Resend wiring (v0.1.1). See /site/.env.example.",
} as const;

// ---------------------------------------------------------------------------
// Body schema — { email, turnstileToken }
// ---------------------------------------------------------------------------

const Body = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    // Browser + RFC-ish. Lenient enough to accept plus-addresses and
    // sub-domains; strict enough to reject "foo", "foo@", "foo@bar".
    .email(),
  // Turnstile tokens are opaque base64url strings, ~1-2kb. We don't try to
  // parse them — just assert non-empty and let Cloudflare reject anything
  // malformed.
  turnstileToken: z.string().min(1).max(4096),
});

// ---------------------------------------------------------------------------
// Helpers — Turnstile + Resend REST calls
// ---------------------------------------------------------------------------

type TurnstileResult = {
  success: boolean;
  "error-codes"?: string[];
};

async function verifyTurnstile(
  token: string,
  secret: string,
  remoteIp: string | null,
): Promise<boolean> {
  // https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);
  if (remoteIp) body.set("remoteip", remoteIp);

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body,
        // Cloudflare recommends a conservative timeout. AbortSignal.timeout
        // is supported in edge runtime (V8 >= 10.3).
        signal: AbortSignal.timeout(5000),
      },
    );
    if (!res.ok) return false;
    const data = (await res.json()) as TurnstileResult;
    return data.success === true;
  } catch {
    // Network flake / timeout / malformed JSON → treat as verification failure.
    return false;
  }
}

type ResendAddResult =
  | { status: "added" }
  | { status: "already-subscribed" }
  | { status: "invalid-email" }
  | { status: "server-error" };

async function addToResendAudience(
  email: string,
  audienceId: string,
  apiKey: string,
): Promise<ResendAddResult> {
  // https://resend.com/docs/api-reference/contacts/create-contact
  try {
    const res = await fetch(
      `https://api.resend.com/audiences/${encodeURIComponent(audienceId)}/contacts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({ email, unsubscribed: false }),
        signal: AbortSignal.timeout(8000),
      },
    );

    if (res.ok) return { status: "added" };

    // Resend's error envelope: { statusCode, name, message }.
    // https://resend.com/docs/api-reference/errors
    const data: unknown = await res
      .json()
      .catch(() => ({}) as Record<string, unknown>);
    const name =
      typeof data === "object" && data !== null && "name" in data
        ? String((data as { name?: unknown }).name ?? "")
        : "";
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String((data as { message?: unknown }).message ?? "")
        : "";

    // Known name strings from the Resend API. Belt-and-braces check the
    // message text too — their error taxonomy has shifted in minor releases.
    if (
      name === "validation_error" ||
      /invalid[_\s-]?email/i.test(message) ||
      /invalid.+address/i.test(message)
    ) {
      return { status: "invalid-email" };
    }
    if (
      res.status === 409 ||
      name === "contact_already_exists" ||
      /already\s+exists|already\s+subscribed|duplicate/i.test(message)
    ) {
      return { status: "already-subscribed" };
    }
    return { status: "server-error" };
  } catch {
    return { status: "server-error" };
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const resendAudienceId = process.env.RESEND_AUDIENCE_ID;

  // --- Env gate: stay in pending-stub state until all three are wired. ---
  if (!turnstileSecret || !resendKey || !resendAudienceId) {
    return NextResponse.json(
      { ok: false, state: "pending" as const, message: COPY.pending },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  // --- Body parse + zod validation. ---
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, state: "invalid" as const, message: COPY.invalid },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = Body.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, state: "invalid" as const, message: COPY.invalid },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { email, turnstileToken } = parsed.data;

  // --- Turnstile verification. ---
  // CF-Connecting-IP is the canonical client-IP header on Cloudflare Workers/
  // Vercel-behind-Cloudflare. x-real-ip / x-forwarded-for fall through as a
  // best-effort backstop; Turnstile siteverify treats remoteIp as optional.
  const remoteIp =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null;

  const turnstileOk = await verifyTurnstile(
    turnstileToken,
    turnstileSecret,
    remoteIp,
  );
  if (!turnstileOk) {
    return NextResponse.json(
      {
        ok: false,
        state: "turnstile-failed" as const,
        message: COPY.turnstileFailed,
      },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  // --- Resend audience-add. ---
  const result = await addToResendAudience(email, resendAudienceId, resendKey);

  switch (result.status) {
    case "added":
      return NextResponse.json(
        { ok: true, state: "success" as const, message: COPY.success },
        { status: 200, headers: { "Cache-Control": "no-store" } },
      );
    case "already-subscribed":
      return NextResponse.json(
        {
          ok: false,
          state: "already-subscribed" as const,
          message: COPY.alreadySubscribed,
        },
        { status: 409, headers: { "Cache-Control": "no-store" } },
      );
    case "invalid-email":
      // Resend's server-side email validation rejects addresses that pass
      // our client-side zod check (e.g. unreachable domain). Fold into the
      // user-visible "invalid" state so copy stays consistent.
      return NextResponse.json(
        { ok: false, state: "invalid" as const, message: COPY.invalid },
        { status: 422, headers: { "Cache-Control": "no-store" } },
      );
    case "server-error":
    default:
      return NextResponse.json(
        { ok: false, state: "server" as const, message: COPY.server },
        { status: 500, headers: { "Cache-Control": "no-store" } },
      );
  }
}

// Reject other methods explicitly — saves a vague 405 from Next's default.
export async function GET() {
  return NextResponse.json(
    { ok: false, message: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

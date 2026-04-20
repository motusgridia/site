// Client island for the landing-page newsletter form.
//
// Spec references:
//   /landing-copy-v0.1.md § 5     — every user-facing string (verbatim below)
//   /landing-copy-v0.1.md § 9     — ARIA conventions (live regions, aria-labels)
//   /stack-recommendation.md      — react-hook-form + zod + @hookform/resolvers
//                                    + Cloudflare Turnstile (widget via vanilla
//                                    script, no new npm package)
//   /site/CLAUDE.md § Build conventions — no inline styles, Tailwind utilities
//                                    only, no sans-serif, ARIA floor on inputs
//
// Activation contract (matches app/api/subscribe/route.ts):
//   If `sitekey` is undefined (NEXT_PUBLIC_TURNSTILE_SITE_KEY not set in env),
//   this component renders the exact v0.0 disabled form markup from the prior
//   page.tsx — same visual result, zero client JS beyond the hydration shell,
//   same disabled button with the "activates with Resend wiring" tooltip.
//
//   If `sitekey` IS set, the form becomes live:
//     - Loads the Cloudflare Turnstile script (/v0/api.js) via next/script
//     - Renders the widget explicitly via window.turnstile.render()
//     - Validates email client-side with zod
//     - Submits { email, turnstileToken } JSON to /api/subscribe
//     - Maps the server's `state` discriminator to the correct visible string
//
// Why NOT a wrapper npm (@marsidev/react-turnstile etc.)?
//   /site/CLAUDE.md forbids adding JS deps that aren't in
//   /stack-recommendation.md. Turnstile is listed there; a React wrapper is
//   not. Cloudflare's vanilla API.js does the job in ~30 lines and stays on
//   the canonical script URL, so we avoid the maintenance surface of a
//   middleman package.

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Script from "next/script";

// ---------------------------------------------------------------------------
// Copy — verbatim from /landing-copy-v0.1.md § 5.
// Centralised here so a future copy edit touches one file.
// ---------------------------------------------------------------------------

const COPY = {
  placeholder: "name@email",
  button: "JOIN THE WALL",
  microcopy:
    "One email, whenever there's something worth reading. Unsubscribe any time.",
  success: "You're on the wall.",
  errorInvalid: "That doesn't look like an email. Try again.",
  errorAlready: "You're already on the wall. Nothing to do.",
  errorServer: "Something broke on our end. Try again in a minute.",
  errorTurnstile: "Couldn't verify you're human. Refresh and try again.",
  disabledTooltip: "Newsletter activates with Resend wiring (v0.1.1)",
  ariaEmailLabel: "Email address for newsletter signup",
  ariaSubmitLabel: "Submit email to join the newsletter",
  microcopyId: "newsletter-microcopy",
} as const;

// ---------------------------------------------------------------------------
// Turnstile global — documented at:
//   https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
// ---------------------------------------------------------------------------

type TurnstileRenderOptions = {
  sitekey: string;
  callback: (token: string) => void;
  "error-callback"?: () => void;
  "expired-callback"?: () => void;
  "timeout-callback"?: () => void;
  theme?: "light" | "dark" | "auto";
  size?: "normal" | "compact" | "invisible";
  appearance?: "always" | "execute" | "interaction-only";
  retry?: "auto" | "never";
  action?: string;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        opts: TurnstileRenderOptions,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string | undefined;
    };
  }
}

// ---------------------------------------------------------------------------
// Form schema + types
// ---------------------------------------------------------------------------

const EmailSchema = z.object({
  // Client-side message is the same verbatim invalid string — matches what
  // the server sends on its own zod fail so the UX is consistent whether
  // validation catches at the client or at the edge.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email({ message: COPY.errorInvalid }),
});
type EmailForm = z.infer<typeof EmailSchema>;

// Discriminated UI state so the render branch is exhaustive.
type UiStatus =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; message: string };

// Server response shape (mirrors the route's return envelope).
type ServerState =
  | "success"
  | "invalid"
  | "already-subscribed"
  | "turnstile-failed"
  | "server"
  | "pending";

type ServerResponse = {
  ok: boolean;
  state: ServerState;
  message: string;
};

// ---------------------------------------------------------------------------
// Disabled-fallback form — identical DOM to the v0.0 markup in page.tsx so
// users and crawlers see the same shell whether Turnstile is wired or not.
// ---------------------------------------------------------------------------

function DisabledForm() {
  return (
    <form
      action="/api/subscribe"
      method="POST"
      noValidate
      aria-describedby={COPY.microcopyId}
      className="mx-auto flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-lg"
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <label htmlFor="email" className="sr-only">
          {COPY.ariaEmailLabel}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder={COPY.placeholder}
          disabled
          aria-disabled="true"
          aria-label={COPY.ariaEmailLabel}
          className="flex-1 border border-line-soft bg-bg-panel px-4 py-3 font-body text-body-sm normal-case tracking-[0.04em] text-ink-primary placeholder:text-ink-mute"
        />
        <button
          type="submit"
          disabled
          aria-disabled="true"
          aria-label={COPY.ariaSubmitLabel}
          title={COPY.disabledTooltip}
          className="mono-l cursor-not-allowed border border-accent-cyan bg-accent-cyan px-6 py-3 text-bg-deep opacity-85"
        >
          {COPY.button}
        </button>
      </div>
      <p
        id={COPY.microcopyId}
        className="text-center text-body-sm text-ink-mute"
      >
        {COPY.microcopy}
      </p>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Live-form — renders only when sitekey is present.
// ---------------------------------------------------------------------------

function LiveForm({ sitekey }: { sitekey: string }) {
  // `errors` is not destructured — the onInvalid callback below receives the
  // full FieldErrors object, so we route everything through a single status
  // setter rather than reading React Hook Form's state twice.
  const { register, handleSubmit } = useForm<EmailForm>({
    resolver: zodResolver(EmailSchema),
    mode: "onSubmit",
  });

  const [status, setStatus] = useState<UiStatus>({ kind: "idle" });
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(false);

  const widgetContainerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  // --- Render/cleanup the Turnstile widget ---------------------------------
  //
  // Effect runs twice in dev strict-mode; the cleanup removes the widget so
  // the second invocation mounts fresh. Guard on `scriptReady` so we don't
  // touch window.turnstile before /v0/api.js has installed it.
  //
  useEffect(() => {
    if (!scriptReady) return;
    const container = widgetContainerRef.current;
    if (!container || !window.turnstile) return;

    const id = window.turnstile.render(container, {
      sitekey,
      theme: "dark",
      size: "compact", // landing-copy § 5 calls for "beneath, barely visible"
      retry: "auto",
      callback: (token) => {
        setTurnstileToken(token);
      },
      "error-callback": () => {
        setTurnstileToken(null);
      },
      "expired-callback": () => {
        setTurnstileToken(null);
      },
      "timeout-callback": () => {
        setTurnstileToken(null);
      },
    });
    widgetIdRef.current = id;

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          /* widget already gone */
        }
        widgetIdRef.current = null;
      }
    };
  }, [scriptReady, sitekey]);

  // --- Submit --------------------------------------------------------------

  const onValid = useCallback(
    async (data: EmailForm) => {
      if (!turnstileToken) {
        setStatus({ kind: "error", message: COPY.errorTurnstile });
        return;
      }

      setStatus({ kind: "submitting" });

      try {
        const res = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.email,
            turnstileToken,
          }),
        });

        let body: ServerResponse | null = null;
        try {
          body = (await res.json()) as ServerResponse;
        } catch {
          body = null;
        }

        if (res.ok && body?.state === "success") {
          setStatus({ kind: "success" });
          return;
        }

        // Reset the widget so the user can retry with a fresh token.
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.reset(widgetIdRef.current);
          } catch {
            /* widget vanished — no-op */
          }
        }
        setTurnstileToken(null);

        switch (body?.state) {
          case "invalid":
            setStatus({ kind: "error", message: COPY.errorInvalid });
            return;
          case "already-subscribed":
            setStatus({ kind: "error", message: COPY.errorAlready });
            return;
          case "turnstile-failed":
            setStatus({ kind: "error", message: COPY.errorTurnstile });
            return;
          case "pending":
          case "server":
          default:
            setStatus({ kind: "error", message: COPY.errorServer });
            return;
        }
      } catch {
        setStatus({ kind: "error", message: COPY.errorServer });
      }
    },
    [turnstileToken],
  );

  // Re-surface a react-hook-form client-side zod failure into our own status
  // bucket so the render path has a single source of truth for "what error
  // string do we show?" — server failures and client failures both land in
  // `status.kind === "error"` and use the same DOM region.
  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    void handleSubmit(onValid, (formErrors) => {
      const message = formErrors.email?.message ?? COPY.errorInvalid;
      setStatus({ kind: "error", message });
    })(event);
  };

  // --- Render: success replaces the form ---------------------------------
  //
  // Cyan inner-glow container per CLAUDE.md § Component rules #4 "No drop
  // shadows — use cyan or magenta inner-glow instead." Tailwind arbitrary
  // value reads the CSS-variable token wired in globals.css.

  if (status.kind === "success") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="mx-auto w-full max-w-md border border-accent-cyan bg-bg-panel px-6 py-5 text-center text-body-lg text-ink-primary shadow-[inset_0_0_24px_var(--glow-cyan)] sm:max-w-lg"
      >
        {COPY.success}
      </div>
    );
  }

  const disabled = status.kind === "submitting";

  return (
    <>
      {/* Load Turnstile script exactly once per page load. `afterInteractive`
          is the right Next 15 strategy — defers past hydration but runs as
          soon as the main thread is free. */}
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onLoad={() => setScriptReady(true)}
      />

      <form
        onSubmit={onSubmit}
        noValidate
        aria-describedby={COPY.microcopyId}
        className="mx-auto flex w-full max-w-md flex-col items-stretch gap-3 sm:max-w-lg"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <label htmlFor="email" className="sr-only">
            {COPY.ariaEmailLabel}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={COPY.placeholder}
            aria-label={COPY.ariaEmailLabel}
            aria-invalid={status.kind === "error"}
            aria-describedby={
              status.kind === "error"
                ? "newsletter-error"
                : COPY.microcopyId
            }
            disabled={disabled}
            className="flex-1 border border-line-soft bg-bg-panel px-4 py-3 font-body text-body-sm normal-case tracking-[0.04em] text-ink-primary placeholder:text-ink-mute focus-visible:border-accent-cyan focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            {...register("email")}
          />
          <button
            type="submit"
            disabled={disabled}
            aria-label={COPY.ariaSubmitLabel}
            className="mono-l border border-accent-cyan bg-accent-cyan px-6 py-3 text-bg-deep transition-opacity duration-[var(--duration-fast)] ease-[var(--ease-technical)] hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {COPY.button}
          </button>
        </div>

        {/* Turnstile widget container — rendered by the useEffect above. */}
        <div
          ref={widgetContainerRef}
          aria-hidden="false"
          className="flex justify-center"
          data-turnstile-slot=""
        />

        {/* Error region — aria-live="assertive" per landing-copy § 9.
            Both client-side zod fails and server-side outcomes route
            through `status.kind === "error"`, so this is the sole error
            DOM region. */}
        {status.kind === "error" && (
          <p
            id="newsletter-error"
            role="alert"
            aria-live="assertive"
            className="text-center text-body-sm text-accent-amber"
          >
            {status.message}
          </p>
        )}

        <p
          id={COPY.microcopyId}
          className="text-center text-body-sm text-ink-mute"
        >
          {COPY.microcopy}
        </p>
      </form>
    </>
  );
}

// ---------------------------------------------------------------------------
// Exported shell — picks live vs. disabled based on whether the parent
// server component was able to resolve NEXT_PUBLIC_TURNSTILE_SITE_KEY at
// render time.
// ---------------------------------------------------------------------------

export function SubscribeForm({ sitekey }: { sitekey: string | undefined }) {
  if (!sitekey || sitekey.length === 0) {
    return <DisabledForm />;
  }
  return <LiveForm sitekey={sitekey} />;
}

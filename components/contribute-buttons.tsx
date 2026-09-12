"use client";

import { useState } from "react";
import { siteConfig } from "@/lib/site-config";

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 px-6 py-3 font-sans text-xs font-medium uppercase tracking-[0.1em] transition-colors";

export function ContributeButtons() {
  const { venmo, zelle, stripe } = siteConfig.registry.honeymoon.contribute;
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  async function copyZelle() {
    if (!zelle) return;
    try {
      await navigator.clipboard.writeText(zelle.phone);
      setCopied(true);
      setCopyFailed(false);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access is refused in insecure contexts and some mobile
      // browsers. The number is on screen either way, so say so rather than
      // leaving a button that silently does nothing.
      setCopyFailed(true);
    }
  }

  return (
    <div className="mt-8">
      <div className="flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
        {venmo && (
          <a
            href={venmo.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BUTTON_BASE} bg-primary text-primary-foreground hover:bg-primary-hover`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3.5"
              aria-hidden="true"
            >
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 000-7.78z" />
            </svg>
            Venmo
            <span className="sr-only">
              — pay @{venmo.handle} (opens in a new tab)
            </span>
          </a>
        )}

        {stripe ? (
          <a
            href={stripe.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`${BUTTON_BASE} border border-mulberry text-mulberry-strong hover:bg-primary hover:text-primary-foreground`}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="size-3.5"
              aria-hidden="true"
            >
              <rect x="2" y="5" width="20" height="14" rx="0" />
              <line x1="2" y1="10" x2="22" y2="10" />
            </svg>
            Card
            <span className="sr-only"> — pay by card (opens in a new tab)</span>
          </a>
        ) : (
          <span
            className={`${BUTTON_BASE} cursor-default border border-border text-muted-foreground opacity-60`}
            aria-disabled="true"
          >
            Card — coming soon
          </span>
        )}
      </div>

      {zelle && (
        <div className="mt-6 border-t border-border pt-6">
          <p className="font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
            Or send with Zelle
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted-foreground">
            Zelle works inside your own banking app — send to this number:
          </p>

          <div className="mt-3 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <span className="font-display text-2xl text-foreground">
              {zelle.display}
            </span>
            <button
              type="button"
              onClick={copyZelle}
              className="inline-flex items-center gap-1.5 border border-border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong"
            >
              {copied ? (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="size-3"
                    aria-hidden="true"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Copied
                </>
              ) : (
                <>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="size-3"
                    aria-hidden="true"
                  >
                    <rect x="9" y="9" width="11" height="11" />
                    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
                  </svg>
                  Copy number
                </>
              )}
            </button>
          </div>

          {/* Announced politely so a screen reader hears the result of a
              press that otherwise changes nothing they can perceive. */}
          <p aria-live="polite" className="sr-only">
            {copied ? "Phone number copied to clipboard" : ""}
          </p>

          {copyFailed && (
            <p className="mt-3 font-sans text-xs text-muted-foreground">
              Copying is not available in this browser — the number above can be
              typed in directly.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

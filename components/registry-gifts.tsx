"use client";

import { useEffect, useState, useTransition } from "react";
import { claimGiftAction, releaseGiftAction } from "@/app/registry/actions";
import { siteConfig, type Gift } from "@/lib/site-config";
import { GiftIcon } from "@/components/gift-icon";
import { Input } from "@/components/ui/input";
import {
  loadMyCodes,
  rememberCode,
  forgetCode,
} from "@/lib/release-code-storage";

type Mode =
  | { kind: "claim"; gift: Gift }
  | { kind: "claimed"; gift: Gift; code: string }
  | { kind: "release"; gift: Gift };

const PANEL = "w-full max-w-sm border border-border bg-card p-8 text-center sm:p-10";
const GHOST_BUTTON =
  "border border-border px-6 py-2.5 font-sans text-xs uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong";
const SOLID_BUTTON =
  "bg-primary px-6 py-2.5 font-sans text-xs uppercase tracking-[0.06em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60";

export function RegistryGifts({
  initialClaimedIds,
}: {
  initialClaimedIds: string[];
}) {
  const [claimedIds, setClaimedIds] = useState(initialClaimedIds);
  const [myCodes, setMyCodes] = useState<Record<string, string>>({});
  const [mode, setMode] = useState<Mode | null>(null);
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Read after mount: localStorage does not exist during the server render,
  // and reading it inline would desync hydration.
  useEffect(() => setMyCodes(loadMyCodes()), []);

  function close() {
    setMode(null);
    setError(null);
    setCodeInput("");
  }

  function submitClaim() {
    if (!mode || mode.kind !== "claim") return;
    const gift = mode.gift;
    startTransition(async () => {
      const result = await claimGiftAction(gift.id, name);
      setClaimedIds(result.claimedIds);
      if (result.ok) {
        rememberCode(gift.id, result.releaseCode);
        setMyCodes((m) => ({ ...m, [gift.id]: result.releaseCode }));
        setMode({ kind: "claimed", gift, code: result.releaseCode });
        setError(null);
      } else {
        setError(result.message);
      }
    });
  }

  function submitRelease(gift: Gift, code: string) {
    startTransition(async () => {
      const result = await releaseGiftAction(gift.id, code);
      setClaimedIds(result.claimedIds);
      if (result.ok) {
        forgetCode(gift.id);
        setMyCodes((m) => {
          const next = { ...m };
          delete next[gift.id];
          return next;
        });
        close();
      } else {
        setError(result.message);
      }
    });
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
        {siteConfig.registry.gifts.map((gift) => {
          const claimed = claimedIds.includes(gift.id);
          const myCode = myCodes[gift.id];

          return (
            <div key={gift.id} className="flex flex-col bg-card">
              <div className="flex aspect-square items-center justify-center bg-background p-6">
                <div className="flex flex-col items-center gap-2">
                  <GiftIcon name={gift.icon} />
                  <span className="text-center font-sans text-[11px] tracking-[0.04em] text-muted-foreground">
                    {gift.iconLabel}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <span className="mb-1.5 font-sans text-[10px] uppercase tracking-[0.1em] text-mulberry-strong">
                  {gift.brand}
                </span>
                <h3 className="mb-2 font-display text-xl leading-snug text-foreground">
                  {gift.name}
                </h3>
                <p className="mb-4 flex-1 font-sans text-xs leading-relaxed text-muted-foreground">
                  {gift.description}
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-display text-[22px] text-foreground">
                    {gift.price}
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {claimed ? (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 font-sans text-[11px] uppercase tracking-[0.06em] text-mulberry-strong">
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
                        Claimed
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setName("");
                          setMode({ kind: "claim", gift });
                        }}
                        className="inline-flex items-center gap-1.5 border border-mulberry px-4 py-2 font-sans text-[11px] uppercase tracking-[0.06em] text-mulberry-strong transition-colors hover:bg-primary hover:text-primary-foreground"
                      >
                        Claim
                      </button>
                    )}

                    <a
                      href={gift.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 border border-border px-4 py-2 font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong"
                    >
                      View
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="size-2.5"
                        aria-hidden="true"
                      >
                        <path d="M7 17L17 7" />
                        <path d="M7 7h10v10" />
                      </svg>
                      <span className="sr-only">
                        {gift.name} on Amazon (opens in a new tab)
                      </span>
                    </a>
                  </div>
                </div>

                {claimed && (
                  <div className="mt-3 border-t border-border pt-3 text-right">
                    {myCode ? (
                      <button
                        type="button"
                        onClick={() => submitRelease(gift, myCode)}
                        disabled={isPending}
                        className="font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground underline-offset-4 transition-colors hover:text-mulberry-strong hover:underline disabled:opacity-60"
                      >
                        {isPending ? "Cancelling…" : "Cancel my claim"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setCodeInput("");
                          setMode({ kind: "release", gift });
                        }}
                        className="font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground underline-offset-4 transition-colors hover:text-mulberry-strong hover:underline"
                      >
                        Cancel with code
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {mode && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="registry-modal-title"
          className="animate-fade-up fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {mode.kind === "claim" && (
            <div className={PANEL}>
              <h3
                id="registry-modal-title"
                className="mb-3 font-display text-2xl text-foreground"
              >
                Claim This Gift?
              </h3>
              <p className="mb-6 font-sans text-[13px] leading-relaxed text-muted-foreground">
                Are you sure you want to claim{" "}
                <span className="text-mulberry-strong">{mode.gift.name}</span>?
                This will mark it as taken for other guests.
              </p>

              <label
                htmlFor="claimed-by"
                className="mb-2 block text-left font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
              >
                Your Name
              </label>
              <Input
                id="claimed-by"
                value={name}
                autoFocus
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="mb-2 border-border bg-background"
              />
              <p className="mb-4 text-left font-sans text-[11px] leading-relaxed text-muted-foreground">
                Only we see this — it is how we know who to thank. Other guests
                just see that the gift is taken.
              </p>

              {error && (
                <p role="alert" className="mb-4 font-sans text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-center gap-3">
                <button type="button" onClick={close} className={GHOST_BUTTON}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={submitClaim}
                  disabled={isPending}
                  className={SOLID_BUTTON}
                >
                  {isPending ? "Claiming…" : "Yes, Claim It"}
                </button>
              </div>
            </div>
          )}

          {mode.kind === "claimed" && (
            <div className={PANEL}>
              <h3
                id="registry-modal-title"
                className="mb-3 font-display text-2xl text-foreground"
              >
                Thank you
              </h3>
              <p className="mb-6 font-sans text-[13px] leading-relaxed text-muted-foreground">
                <span className="text-mulberry-strong">{mode.gift.name}</span> is
                yours. If you change your mind, cancel it with this code:
              </p>

              <p className="mb-3 font-display text-3xl tracking-[0.15em] text-foreground">
                {mode.code}
              </p>
              <p className="mb-6 font-sans text-[11px] leading-relaxed text-muted-foreground">
                This browser will remember it, so you can just press
                &ldquo;Cancel my claim&rdquo; here. Save it if you might cancel
                from a different phone or computer — we cannot look it up for
                you.
              </p>

              <button type="button" onClick={close} className={SOLID_BUTTON}>
                Done
              </button>
            </div>
          )}

          {mode.kind === "release" && (
            <div className={PANEL}>
              <h3
                id="registry-modal-title"
                className="mb-3 font-display text-2xl text-foreground"
              >
                Cancel This Claim?
              </h3>
              <p className="mb-6 font-sans text-[13px] leading-relaxed text-muted-foreground">
                Enter the code you were given when you claimed{" "}
                <span className="text-mulberry-strong">{mode.gift.name}</span>.
              </p>

              <label
                htmlFor="release-code"
                className="mb-2 block text-left font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground"
              >
                Cancellation Code
              </label>
              <Input
                id="release-code"
                value={codeInput}
                autoFocus
                autoComplete="off"
                spellCheck={false}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="XXXX-XXXX"
                className="mb-4 border-border bg-background text-center tracking-[0.2em] uppercase"
              />

              {error && (
                <p role="alert" className="mb-4 font-sans text-sm text-destructive">
                  {error}
                </p>
              )}

              <div className="flex justify-center gap-3">
                <button type="button" onClick={close} className={GHOST_BUTTON}>
                  Keep It
                </button>
                <button
                  type="button"
                  onClick={() => submitRelease(mode.gift, codeInput)}
                  disabled={isPending || !codeInput.trim()}
                  className={SOLID_BUTTON}
                >
                  {isPending ? "Cancelling…" : "Cancel Claim"}
                </button>
              </div>

              <p className="mt-5 font-sans text-[11px] leading-relaxed text-muted-foreground">
                Lost the code? Let us know and we will clear it for you.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

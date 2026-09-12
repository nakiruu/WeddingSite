"use client";

import { useState, useTransition } from "react";
import { claimGiftAction } from "@/app/registry/actions";
import { siteConfig, type Gift } from "@/lib/site-config";
import { GiftIcon } from "@/components/gift-icon";
import { Input } from "@/components/ui/input";

export function RegistryGifts({
  initialClaimedIds,
}: {
  initialClaimedIds: string[];
}) {
  const [claimedIds, setClaimedIds] = useState(initialClaimedIds);
  const [pending, setPending] = useState<Gift | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openModal(gift: Gift) {
    setError(null);
    setPending(gift);
  }

  function closeModal() {
    setPending(null);
    setError(null);
  }

  function confirmClaim() {
    if (!pending) return;
    startTransition(async () => {
      const result = await claimGiftAction(pending.id, name);
      // The server returns the authoritative list either way, so a guest who
      // lost a race sees the gift flip to Claimed instead of a stale button.
      setClaimedIds(result.claimedIds);
      if (result.ok) {
        setPending(null);
        setError(null);
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

                  <div className="flex gap-1.5">
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
                        onClick={() => openModal(gift)}
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
              </div>
            </div>
          );
        })}
      </div>

      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="claim-title"
          className="animate-fade-up fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-sm border border-border bg-card p-8 text-center sm:p-10">
            <h3
              id="claim-title"
              className="mb-3 font-display text-2xl text-foreground"
            >
              Claim This Gift?
            </h3>
            <p className="mb-6 font-sans text-[13px] leading-relaxed text-muted-foreground">
              Are you sure you want to claim{" "}
              <span className="text-mulberry-strong">{pending.name}</span>? This
              will mark it as taken for other guests.
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
              className="mb-4 border-border bg-background"
            />

            {error && (
              <p role="alert" className="mb-4 font-sans text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="border border-border px-6 py-2.5 font-sans text-xs uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClaim}
                disabled={isPending}
                className="bg-primary px-6 py-2.5 font-sans text-xs uppercase tracking-[0.06em] text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {isPending ? "Claiming…" : "Yes, Claim It"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

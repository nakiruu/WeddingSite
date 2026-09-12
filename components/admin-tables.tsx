"use client";

import { useState, useTransition } from "react";
import { deleteRsvpAction, releaseClaimAction } from "@/app/admin/actions";
import { siteConfig } from "@/lib/site-config";
import { SectionEyebrow } from "@/components/section-eyebrow";
import type { ClaimRow, RsvpRow } from "@/lib/db";

const TH =
  "border-b border-border px-3 py-2 text-left font-sans text-[10px] uppercase tracking-[0.1em] text-mulberry-strong whitespace-nowrap";
const TD = "border-b border-border px-3 py-2.5 align-top font-sans text-[13px]";
const EMPTY = "border border-border bg-card px-4 py-6 font-sans text-sm text-muted-foreground";

const mealLabel = (value: string | null) =>
  siteConfig.meals.find((m) => m.value === value)?.label ?? "—";

const giftLabel = (itemId: string) => {
  const gift = siteConfig.registry.gifts.find((g) => g.id === itemId);
  return gift ? `${gift.brand} ${gift.name}` : itemId;
};

const shortDate = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

type Pending =
  | { kind: "rsvp"; id: number; who: string }
  | { kind: "claim"; itemId: string; who: string };

function DeleteButton({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline"
    >
      {label}
    </button>
  );
}

export function AdminTables({
  rsvps,
  claims,
}: {
  rsvps: RsvpRow[];
  claims: ClaimRow[];
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function confirm() {
    if (!pending) return;
    startTransition(async () => {
      const result =
        pending.kind === "rsvp"
          ? await deleteRsvpAction(pending.id)
          : await releaseClaimAction(pending.itemId);

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
      {/* RSVPS */}
      <section className="mb-12">
        <SectionEyebrow className="mb-4">RSVPs ({rsvps.length})</SectionEyebrow>

        {rsvps.length === 0 ? (
          <p className={EMPTY}>No responses yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Guest</th>
                  <th className={TH}>Attending</th>
                  <th className={TH}>Meal</th>
                  <th className={TH}>Dietary</th>
                  <th className={TH}>Plus one</th>
                  <th className={TH}>Their meal</th>
                  <th className={TH}>Their dietary</th>
                  <th className={TH}>Received</th>
                  <th className={TH}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rsvps.map((r) => (
                  <tr key={r.id}>
                    <td className={`${TD} text-foreground`}>{r.guestName}</td>
                    <td className={TD}>
                      <span
                        className={
                          r.attendance === "accept"
                            ? "text-success"
                            : "text-muted-foreground"
                        }
                      >
                        {r.attendance === "accept" ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className={`${TD} text-muted-foreground`}>
                      {r.attendance === "accept" ? mealLabel(r.meal) : "—"}
                    </td>
                    <td className={`${TD} text-muted-foreground`}>
                      {r.dietary || "—"}
                    </td>
                    <td className={`${TD} text-muted-foreground`}>
                      {r.plusOne ? r.plusOneName || "Yes" : "—"}
                    </td>
                    <td className={`${TD} text-muted-foreground`}>
                      {r.plusOne ? mealLabel(r.plusOneMeal) : "—"}
                    </td>
                    <td className={`${TD} text-muted-foreground`}>
                      {r.plusOneDietary || "—"}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-muted-foreground`}>
                      {shortDate(r.createdAt)}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-right`}>
                      <DeleteButton
                        label="Delete"
                        onClick={() => {
                          setError(null);
                          setPending({
                            kind: "rsvp",
                            id: r.id,
                            who: r.guestName,
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* CLAIMS */}
      <section>
        <SectionEyebrow className="mb-4">
          Gifts claimed ({claims.length})
        </SectionEyebrow>

        {claims.length === 0 ? (
          <p className={EMPTY}>Nothing claimed yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border bg-card">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className={TH}>Guest</th>
                  <th className={TH}>Gift</th>
                  <th className={TH}>Claimed</th>
                  <th className={TH}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {claims.map((c) => (
                  <tr key={c.itemId}>
                    <td className={TD}>
                      {c.claimedBy ? (
                        <span className="text-foreground">{c.claimedBy}</span>
                      ) : (
                        <span className="text-muted-foreground italic">
                          Anonymous
                        </span>
                      )}
                    </td>
                    <td className={`${TD} text-muted-foreground`}>
                      {giftLabel(c.itemId)}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-muted-foreground`}>
                      {shortDate(c.claimedAt)}
                    </td>
                    <td className={`${TD} whitespace-nowrap text-right`}>
                      <DeleteButton
                        label="Release"
                        onClick={() => {
                          setError(null);
                          setPending({
                            kind: "claim",
                            itemId: c.itemId,
                            who: c.claimedBy ?? "Anonymous",
                          });
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pending && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-confirm-title"
          className="animate-fade-up fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPending(null);
          }}
        >
          <div className="w-full max-w-sm border border-border bg-card p-8 text-center sm:p-10">
            <h3
              id="admin-confirm-title"
              className="mb-3 font-display text-2xl text-foreground"
            >
              {pending.kind === "rsvp" ? "Delete this response?" : "Release this gift?"}
            </h3>

            {pending.kind === "rsvp" ? (
              <p className="mb-6 font-sans text-[13px] leading-relaxed text-muted-foreground">
                <span className="text-mulberry-strong">{pending.who}</span>&rsquo;s
                RSVP and everything they answered will be deleted.{" "}
                <span className="text-foreground">
                  This cannot be undone — they would have to respond again.
                </span>
              </p>
            ) : (
              <p className="mb-6 font-sans text-[13px] leading-relaxed text-muted-foreground">
                The claim by{" "}
                <span className="text-mulberry-strong">{pending.who}</span> will
                be cleared and{" "}
                <span className="text-foreground">
                  the gift goes back on the registry
                </span>{" "}
                for another guest to claim.
              </p>
            )}

            {error && (
              <p role="alert" className="mb-4 font-sans text-sm text-destructive">
                {error}
              </p>
            )}

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="border border-border px-6 py-2.5 font-sans text-xs uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={isPending}
                className="bg-destructive px-6 py-2.5 font-sans text-xs uppercase tracking-[0.06em] text-background transition-opacity hover:opacity-85 disabled:opacity-60"
              >
                {isPending
                  ? "Working…"
                  : pending.kind === "rsvp"
                    ? "Delete"
                    : "Release"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

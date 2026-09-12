import { signOut } from "@/app/admin/actions";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { siteConfig } from "@/lib/site-config";
import type { ClaimRow, RsvpRow } from "@/lib/db";

const TH =
  "border-b border-border px-3 py-2 text-left font-sans text-[10px] uppercase tracking-[0.1em] text-mulberry-strong whitespace-nowrap";
const TD = "border-b border-border px-3 py-2.5 align-top font-sans text-[13px]";

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

export function AdminDashboard({
  rsvps,
  claims,
}: {
  rsvps: RsvpRow[];
  claims: ClaimRow[];
}) {
  const attending = rsvps.filter((r) => r.attendance === "accept");
  const declining = rsvps.filter((r) => r.attendance === "decline");
  // Plus-ones are separate mouths to feed, so headcount is not the row count.
  const headcount = attending.reduce((n, r) => n + (r.plusOne ? 2 : 1), 0);

  const mealCounts = siteConfig.meals.map((meal) => ({
    label: meal.label,
    count: attending.reduce(
      (n, r) =>
        n +
        (r.meal === meal.value ? 1 : 0) +
        (r.plusOne && r.plusOneMeal === meal.value ? 1 : 0),
      0,
    ),
  }));

  const stats = [
    { label: "Responses", value: rsvps.length },
    { label: "Attending", value: attending.length },
    { label: "Declining", value: declining.length },
    { label: "Headcount", value: headcount },
    { label: "Gifts claimed", value: claims.length },
  ];

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background px-6 pt-12 pb-20">
      <div className="mx-auto max-w-5xl">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <SectionEyebrow className="mb-3">Private</SectionEyebrow>
            <h1 className="font-display text-[clamp(2.25rem,6vw,3rem)] font-light text-foreground">
              Admin
            </h1>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="border border-border px-5 py-2 font-sans text-[11px] uppercase tracking-[0.06em] text-muted-foreground transition-colors hover:border-mulberry hover:text-mulberry-strong"
            >
              Lock again
            </button>
          </form>
        </div>

        {/* SUMMARY */}
        <div className="mb-12 grid grid-cols-2 gap-px bg-border sm:grid-cols-3 md:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-card px-4 py-5 text-center">
              <p className="font-display text-3xl text-foreground">{s.value}</p>
              <p className="mt-1 font-sans text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* MEALS */}
        <section className="mb-12">
          <SectionEyebrow className="mb-4">Meals to order</SectionEyebrow>
          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-3">
            {mealCounts.map((m) => (
              <div key={m.label} className="bg-card px-4 py-4">
                <p className="font-display text-2xl text-foreground">
                  {m.count}
                </p>
                <p className="font-sans text-xs text-muted-foreground">
                  {m.label}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RSVPS */}
        <section className="mb-12">
          <SectionEyebrow className="mb-4">
            RSVPs ({rsvps.length})
          </SectionEyebrow>

          {rsvps.length === 0 ? (
            <p className="border border-border bg-card px-4 py-6 font-sans text-sm text-muted-foreground">
              No responses yet.
            </p>
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
            <p className="border border-border bg-card px-4 py-6 font-sans text-sm text-muted-foreground">
              Nothing claimed yet.
            </p>
          ) : (
            <div className="overflow-x-auto border border-border bg-card">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className={TH}>Guest</th>
                    <th className={TH}>Gift</th>
                    <th className={TH}>Claimed</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((c) => (
                    <tr key={c.itemId}>
                      <td className={TD}>
                        {c.claimedBy ? (
                          <span className="text-foreground">{c.claimedBy}</span>
                        ) : (
                          // Anonymous claims still matter: the gift is taken,
                          // there is just nobody to address a card to.
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

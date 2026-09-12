import { signOut } from "@/app/admin/actions";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { AdminTables } from "@/components/admin-tables";
import { siteConfig } from "@/lib/site-config";
import type { ClaimRow, RsvpRow } from "@/lib/db";

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

        <AdminTables rsvps={rsvps} claims={claims} />
      </div>
    </div>
  );
}

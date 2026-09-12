import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { siteConfig } from "@/lib/site-config";

/** Shared layout for the four nav destinations that have no content yet. */
export function WipPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center bg-background px-6 py-20 text-center">
      <div className="animate-fade-up max-w-xl">
        <SectionEyebrow align="center" className="mb-5">
          Coming Soon
        </SectionEyebrow>

        <h1 className="font-display text-[clamp(2.5rem,8vw,3.5rem)] font-light tracking-[-0.01em] text-foreground">
          {title}
        </h1>

        <div className="mx-auto my-7 h-px w-12 bg-mulberry" />

        <p className="font-display text-xl leading-relaxed font-light italic text-muted-foreground">
          {description}
        </p>

        <p className="mt-8 font-sans text-[13px] leading-relaxed text-muted-foreground">
          We are still putting this page together. Check back before{" "}
          {siteConfig.date.short}.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
          <Link
            href="/"
            className="font-sans text-[11px] uppercase tracking-[0.1em] text-mulberry-strong transition-opacity hover:opacity-75"
          >
            Return Home
          </Link>
          <Link
            href="/rsvp"
            className="font-sans text-[11px] uppercase tracking-[0.1em] text-mulberry-strong transition-opacity hover:opacity-75"
          >
            RSVP
          </Link>
        </div>
      </div>
    </div>
  );
}

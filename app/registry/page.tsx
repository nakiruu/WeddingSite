import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { RegistryGifts } from "@/components/registry-gifts";
import { ContributeButtons } from "@/components/contribute-buttons";
import { getClaimedIds } from "@/app/registry/actions";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Registry — Julie & Nick",
  description: siteConfig.registry.intro,
};

// Claims are shared state, so this page must never be served from a stale
// prerender — a guest has to see what other guests have already taken.
export const dynamic = "force-dynamic";

export default async function RegistryPage() {
  const claimedIds = await getClaimedIds();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-background px-6 pt-16 pb-20">
      <div className="animate-fade-up mb-14 text-center">
        <SectionEyebrow align="center" className="mb-4">
          Our Wish List
        </SectionEyebrow>
        <h1 className="font-display text-[clamp(2.5rem,8vw,3.5rem)] font-light tracking-[-0.01em] text-foreground">
          Registry
        </h1>
        <div className="mx-auto my-6 h-px w-12 bg-mulberry" />
        <p className="mx-auto max-w-lg font-sans text-sm leading-relaxed text-muted-foreground">
          {siteConfig.registry.intro}
        </p>
      </div>

      <div className="mx-auto max-w-4xl">
        {/* HONEYMOON FUND */}
        <div className="animate-fade-up mb-12 border border-border bg-card px-8 py-12 text-center sm:px-10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="mx-auto mb-5 size-10 text-mulberry"
            aria-hidden="true"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>

          <h2 className="mb-3 font-display text-3xl font-light text-foreground">
            {siteConfig.registry.honeymoon.title}
          </h2>
          <p className="mx-auto mb-7 max-w-md font-sans text-sm leading-relaxed text-muted-foreground">
            {siteConfig.registry.honeymoon.description}
          </p>

          <ContributeButtons />
        </div>

        <RegistryGifts initialClaimedIds={claimedIds} />
      </div>
    </div>
  );
}

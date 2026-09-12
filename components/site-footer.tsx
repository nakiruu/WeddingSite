import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-card px-6 py-10 text-center md:px-16">
      <p className="font-display text-xl font-light italic text-muted-foreground">
        {siteConfig.couple.joined}
      </p>
      <p className="mt-2 font-sans text-[11px] uppercase tracking-[0.1em] text-muted-foreground opacity-60">
        {siteConfig.footerLine}
      </p>
    </footer>
  );
}

import Image from "next/image";
import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { QuickLinkIcon } from "@/components/quick-link-icon";
import { siteConfig } from "@/lib/site-config";

export default function HomePage() {
  return (
    <>
      {/* HERO — asymmetric split, stacking to one column on mobile */}
      <section className="grid min-h-[calc(100vh-3.5rem)] grid-cols-1 md:grid-cols-2">
        <div className="animate-fade-up flex flex-col justify-center px-6 py-16 md:px-16 md:py-20">
          <SectionEyebrow className="mb-6">
            Together with their families
          </SectionEyebrow>

          <h1 className="font-display text-[clamp(3rem,10vw,4.5rem)] leading-[1.05] font-light tracking-[-0.01em] text-foreground">
            {siteConfig.couple.first}
          </h1>
          <span className="my-1 ml-1 block font-display text-3xl font-light italic text-mulberry">
            &amp;
          </span>
          <h1 className="mb-8 font-display text-[clamp(3rem,10vw,4.5rem)] leading-[1.05] font-light tracking-[-0.01em] text-foreground">
            {siteConfig.couple.second}
          </h1>

          <div className="mb-8 h-px w-12 bg-mulberry" />

          <p className="font-sans text-sm uppercase tracking-[0.08em] text-foreground">
            {siteConfig.date.long}
          </p>
          <p className="mt-2 font-sans text-[13px] leading-relaxed text-muted-foreground">
            {siteConfig.venue.name}
            <br />
            {siteConfig.venue.street}
            <br />
            {siteConfig.venue.cityStateZip}
          </p>
        </div>

        <div className="animate-fade-up relative aspect-[4/3] overflow-hidden md:aspect-auto md:min-h-[calc(100vh-3.5rem)]">
          <Image
            src={siteConfig.heroImage.src}
            alt={siteConfig.heroImage.alt}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
          {/* Feathers the photo into the page on desktop only; at mobile
              widths the photo sits below the text and needs no mask. */}
          <div className="absolute inset-0 hidden bg-gradient-to-r from-background to-transparent to-20% md:block" />
        </div>
      </section>

      {/* WELCOME */}
      <section className="animate-fade-up flex justify-center border-y border-border bg-card px-6 py-16 md:px-16 md:py-20">
        <div className="max-w-2xl text-center">
          <SectionEyebrow align="center" className="mb-5">
            A Note From Us
          </SectionEyebrow>
          <p className="font-display text-2xl leading-[1.7] font-light italic text-foreground">
            {siteConfig.welcomeMessage}
          </p>
          <div className="mx-auto mt-6 h-px w-8 bg-mulberry" />
        </div>
      </section>

      {/* QUICK LINKS — gap-px over a bordered grid reproduces the source's
          hairline separators without drawing six individual borders. */}
      <section className="bg-background px-6 py-16 md:px-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <SectionEyebrow align="center" className="mb-12">
            Quick Links
          </SectionEyebrow>

          <div className="grid grid-cols-1 gap-px bg-border sm:grid-cols-2 md:grid-cols-3">
            {siteConfig.quickLinks.map((link) => {
              const content = (
                <>
                  <QuickLinkIcon name={link.icon} />
                  <span className="font-sans text-xs uppercase tracking-[0.1em] text-foreground">
                    {link.label}
                  </span>
                  <span className="font-display text-[15px] italic text-muted-foreground">
                    {link.description}
                  </span>
                </>
              );

              const className =
                "flex flex-col items-center gap-3 bg-background px-8 py-10 text-center transition-colors hover:bg-card";

              return link.external ? (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link key={link.label} href={link.href} className={className}>
                  {content}
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}

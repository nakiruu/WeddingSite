import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { TravelIcon } from "@/components/travel-icon";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Travel & Accommodations — Julie & Nick",
};

const { travel, venue, date } = siteConfig;

// Every outbound link on this page leaves the site, so they all open in a new
// tab and drop the opener reference.
const external = { target: "_blank", rel: "noopener noreferrer" } as const;

const sectionHeading =
  "mt-4 font-display text-[clamp(2rem,4vw,2.75rem)] leading-[1.15] font-light text-foreground";

export default function TravelPage() {
  return (
    <>
      {/* INTRO — facts on the left, the wedding map on the right */}
      <section className="px-6 pt-16 pb-14 md:px-16 md:pt-24 md:pb-20">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-20">
          <div className="animate-fade-up flex flex-col justify-center">
            <SectionEyebrow>Getting There</SectionEyebrow>
            <h1 className="mt-6 font-display text-[clamp(2.6rem,6vw,4.5rem)] leading-[1.05] font-light tracking-[-0.01em] text-foreground">
              Travel &amp;{" "}
              <em className="italic text-mulberry">Accommodations</em>
            </h1>
            <div className="my-8 h-px w-12 bg-mulberry" />
            <p className="max-w-[520px] font-display text-[22px] leading-relaxed font-light italic text-foreground">
              {travel.intro}
            </p>

            <dl className="mt-10 grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-6 border-t border-border pt-7">
              <div className="flex flex-col gap-1.5">
                <dt className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  The Date
                </dt>
                <dd className="font-sans text-sm uppercase tracking-[0.08em] text-foreground">
                  {date.short}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  The Venue
                </dt>
                <dd className="font-sans text-sm leading-normal text-foreground">
                  {venue.name}
                  <br />
                  {venue.street}
                  <br />
                  {venue.cityStateZip}
                </dd>
              </div>
              <div className="flex flex-col gap-1.5">
                <dt className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                  Nearest Airport
                </dt>
                <dd className="font-sans text-sm leading-normal text-foreground">
                  {travel.airport.name}
                  <br />
                  {travel.airport.distance}
                </dd>
              </div>
            </dl>
          </div>

          <div className="animate-fade-up flex flex-col gap-3">
            <div className="relative min-h-[380px] flex-1 border border-border bg-card">
              <iframe
                src={travel.map.embedUrl}
                title="Map of the chapel, nearby hotels and Jacksonville International Airport"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="absolute inset-0 size-full border-0"
              />
            </div>
            <a
              href={travel.map.viewUrl}
              {...external}
              className="self-start border-b border-mulberry pt-3 pb-1 font-sans text-xs uppercase tracking-[0.1em] text-mulberry-strong transition-opacity hover:opacity-75"
            >
              Open in Maps
            </a>
          </div>
        </div>
      </section>

      {/* GETTING HERE — gap-px over a border-coloured grid draws the hairlines */}
      <section className="border-t border-border px-6 py-14 md:px-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <SectionEyebrow align="center">Arriving</SectionEyebrow>
            <h2 className={sectionHeading}>Getting to Jacksonville</h2>
          </div>
          <div className="grid grid-cols-1 gap-px border border-border bg-border md:grid-cols-3">
            {travel.tips.map((tip) => (
              <div
                key={tip.title}
                className="flex flex-col gap-3.5 bg-background px-8 py-10"
              >
                <TravelIcon name={tip.icon} />
                <h3 className="font-sans text-xs uppercase tracking-[0.1em] text-foreground">
                  {tip.title}
                </h3>
                <p className="font-sans text-sm leading-[1.7] text-muted-foreground">
                  {tip.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHERE TO STAY */}
      <section className="border-y border-border bg-card px-6 py-14 md:px-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <SectionEyebrow align="center">Accommodations</SectionEyebrow>
            <h2 className={sectionHeading}>Where to Stay</h2>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {travel.hotels.map((hotel) => (
              <article
                key={hotel.id}
                className="flex flex-col border border-border bg-background"
              >
                <div className="relative aspect-[16/10] border-b border-border">
                  <Image
                    src={hotel.image.src}
                    alt={hotel.image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-4 p-8">
                  <span className="font-sans text-[11px] uppercase tracking-[0.15em] text-muted-foreground">
                    Nearby Option
                  </span>
                  <h3 className="font-display text-[28px] leading-[1.2] font-normal text-foreground">
                    {hotel.name}
                  </h3>
                  <p className="font-sans text-[13px] leading-relaxed text-muted-foreground">
                    {hotel.street}
                    <br />
                    {hotel.cityStateZip}
                  </p>
                  <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2.5 border-t border-border pt-5 font-sans text-[13px]">
                    <dt className="pt-0.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      Distance
                    </dt>
                    <dd className="text-foreground">{hotel.distance}</dd>
                    <dt className="pt-0.5 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
                      From
                    </dt>
                    <dd className="text-foreground">{hotel.priceFrom} / night</dd>
                  </dl>
                  <a
                    href={hotel.url}
                    {...external}
                    aria-label={`View ${hotel.name}`}
                    className="mt-auto block border border-mulberry px-6 py-[15px] text-center font-sans text-xs uppercase tracking-[0.12em] text-mulberry-strong transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  >
                    View Hotel
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AROUND TOWN */}
      <section className="px-6 py-14 md:px-16 md:py-24">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:gap-20">
          <div className="lg:w-1/3">
            <SectionEyebrow>While You&apos;re Here</SectionEyebrow>
            <h2 className={sectionHeading}>Around Jacksonville</h2>
            <div className="mt-6 h-px w-12 bg-mulberry" />
          </div>
          <ol className="flex-1 border-t border-border">
            {travel.localPicks.map((pick, i) => (
              <li
                key={pick.name}
                className="flex items-baseline gap-6 border-b border-border py-[22px]"
              >
                <span className="min-w-7 font-display text-[22px] italic text-mulberry">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1">
                  <a
                    href={pick.url}
                    {...external}
                    className="self-start border-b border-mulberry font-sans text-xs uppercase tracking-[0.1em] text-foreground transition-colors hover:text-mulberry-strong"
                  >
                    {pick.name}
                  </a>
                  <span className="font-display text-[17px] italic text-muted-foreground">
                    {pick.note}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* CLOSING */}
      <section className="border-t border-border bg-card px-6 py-14 text-center md:px-16 md:py-20">
        <p className="mx-auto max-w-[560px] font-display text-[26px] leading-normal font-light italic text-foreground">
          Questions about getting here? We&apos;re happy to help.
        </p>
        <div className="mx-auto mt-6 mb-8 h-px w-8 bg-mulberry" />
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/rsvp"
            className="bg-primary px-8 py-4 font-sans text-xs uppercase tracking-[0.12em] text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            RSVP
          </Link>
          <Link
            href="/faq"
            className="border border-mulberry px-8 py-[15px] font-sans text-xs uppercase tracking-[0.12em] text-mulberry-strong transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
          >
            Read the FAQ
          </Link>
        </div>
      </section>
    </>
  );
}

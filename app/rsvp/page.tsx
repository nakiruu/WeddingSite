import type { Metadata } from "next";
import { SectionEyebrow } from "@/components/section-eyebrow";
import { RsvpForm } from "@/components/rsvp-form";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "RSVP — Julie & Nick",
  description: `Please respond by ${siteConfig.rsvpDeadline}.`,
};

export default function RsvpPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center bg-background px-6 pt-16 pb-20">
      <div className="animate-fade-up mb-12 text-center">
        <SectionEyebrow align="center" className="mb-4">
          Kindly Respond
        </SectionEyebrow>
        <h1 className="font-display text-[clamp(2.5rem,8vw,3.5rem)] font-light tracking-[-0.01em] text-foreground">
          RSVP
        </h1>
        <div className="mx-auto my-6 h-px w-12 bg-mulberry" />
        <p className="font-sans text-sm text-muted-foreground">
          Please respond by{" "}
          <span className="font-medium text-mulberry-strong">
            {siteConfig.rsvpDeadline}
          </span>
        </p>
      </div>

      <RsvpForm />
    </div>
  );
}

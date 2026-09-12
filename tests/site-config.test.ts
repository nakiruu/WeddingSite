import { describe, it, expect } from "vitest";
import { siteConfig } from "@/lib/site-config";

describe("siteConfig", () => {
  it("carries the couple and date", () => {
    expect(siteConfig.couple.joined).toBe("Julie & Nick");
    expect(siteConfig.date.long).toBe("January 14th, 2027");
    expect(siteConfig.date.iso).toBe("2027-01-14");
    expect(siteConfig.footerLine).toBe("January 14, 2027 · Jacksonville, FL");
  });

  it("carries the venue and a maps link to it", () => {
    expect(siteConfig.venue.name).toBe("The Social Chapel");
    expect(siteConfig.venue.street).toBe("12355 Fort Caroline Rd");
    expect(siteConfig.venue.cityStateZip).toBe("Jacksonville, FL 32225");
    expect(siteConfig.venue.mapsUrl).toContain("Fort+Caroline");
  });

  it("carries the RSVP deadline", () => {
    expect(siteConfig.rsvpDeadline).toBe("December 14, 2026");
  });

  it("offers exactly the three meals from the design", () => {
    expect(siteConfig.meals.map((m) => m.label)).toEqual([
      "Herb-Roasted Chicken",
      "Pan-Seared Salmon",
      "Garden Vegetable Risotto",
    ]);
  });

  it("has five nav items, all pointing at real routes", () => {
    expect(siteConfig.nav).toHaveLength(5);
    for (const item of siteConfig.nav) {
      expect(item.href.startsWith("/"), `${item.label} is not a route`).toBe(
        true,
      );
    }
    expect(siteConfig.nav.map((n) => n.href)).toEqual([
      "/rsvp",
      "/schedule",
      "/travel",
      "/registry",
      "/faq",
    ]);
  });

  it("has six quick links", () => {
    expect(siteConfig.quickLinks).toHaveLength(6);
  });

  it("marks only the maps quick link as external", () => {
    const external = siteConfig.quickLinks.filter((l) => l.external);
    expect(external).toHaveLength(1);
    expect(external[0].label).toBe("Venue");
    expect(external[0].href).toBe(siteConfig.venue.mapsUrl);
  });

  it("keeps the hero image decorative", () => {
    expect(siteConfig.heroImage.alt).toBe("");
  });
});

describe("registry", () => {
  it("carries the three gifts from the canvas, in order", () => {
    expect(siteConfig.registry.gifts.map((g) => g.id)).toEqual([
      "breville",
      "kitchenaid",
      "zojirushi",
    ]);
    expect(siteConfig.registry.gifts.map((g) => g.price)).toEqual([
      "$799.95",
      "$399.99",
      "$189.99",
    ]);
  });

  it("gives every gift a unique id and an external link", () => {
    const ids = siteConfig.registry.gifts.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const gift of siteConfig.registry.gifts) {
      expect(gift.url.startsWith("https://"), gift.id).toBe(true);
    }
  });

  it("carries the honeymoon fund copy", () => {
    expect(siteConfig.registry.honeymoon.title).toBe("Honeymoon Fund");
    expect(siteConfig.registry.honeymoon.raised).toBe("$0 raised");
  });
});

import { describe, it, expect } from "vitest";
import { siteConfig } from "@/lib/site-config";

describe("siteConfig", () => {
  it("carries the couple and date", () => {
    expect(siteConfig.couple.joined).toBe("Nick & Julie");
    expect(siteConfig.date.long).toBe("January 14th, 2027");
    expect(siteConfig.date.iso).toBe("2027-01-14");
    expect(siteConfig.footerLine).toBe("January 14, 2027 · Jacksonville, FL");
  });

  it("carries the venue and a maps link to it", () => {
    expect(siteConfig.venue.name).toBe("The Social Chapel");
    expect(siteConfig.venue.street).toBe("12355 Fort Caroline Rd");
    expect(siteConfig.venue.cityStateZip).toBe("Jacksonville, FL 32225");
    expect(siteConfig.venue.mapsUrl).toContain("The+Social+Chapel");
  });

  it("carries the RSVP deadline", () => {
    expect(siteConfig.rsvpDeadline).toBe("November 14, 2026");
  });

  it("offers exactly the two meal choices", () => {
    expect(siteConfig.meals.map((m) => m.label)).toEqual([
      "Pulled Pork",
      "Chicken",
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
  it("carries the three gifts, in order", () => {
    expect(siteConfig.registry.gifts.map((g) => g.id)).toEqual([
      "breville",
      "ninja",
      "kitchenaid",
    ]);
    expect(siteConfig.registry.gifts.map((g) => g.price)).toEqual([
      "$249.95",
      "$89.99",
      "$299.99",
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

describe("honeymoon contribution methods", () => {
  const { venmo, zelle, stripe } = siteConfig.registry.honeymoon.contribute;

  it("deep-links Venmo to the right handle with a prefilled note", () => {
    expect(venmo?.handle).toBe("nzubulidis");
    expect(venmo?.url).toContain("recipients=nzubulidis");
    expect(venmo?.url).toContain("txn=pay");
    // The note is what shows up in the Venmo feed, so it must be encoded.
    expect(venmo?.url).toContain(encodeURIComponent("Julie & Nick — Honeymoon Fund"));
  });

  it("carries a raw Zelle number to copy and a formatted one to read", () => {
    expect(zelle?.phone).toBe("9046246439");
    expect(zelle?.display).toBe("(904) 624-6439");
    // The copy target must be digits only — banking apps reject punctuation.
    expect(zelle?.phone).toMatch(/^\d{10}$/);
  });

  it("leaves Stripe unset until a Payment Link exists", () => {
    expect(stripe).toBeNull();
  });
});

describe("travel", () => {
  const { travel } = siteConfig;

  it("lists the three nearby hotels, in order", () => {
    expect(travel.hotels.map((h) => h.name)).toEqual([
      "Hampton Inn Jacksonville East Regency Square",
      "TownePlace Suites by Marriott Jacksonville Mayport",
      "Courtyard by Marriott Jacksonville I-295/East Beltway",
    ]);
  });

  it("gives every hotel a unique id, a local photo and an https link", () => {
    const ids = travel.hotels.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const hotel of travel.hotels) {
      expect(hotel.image.src).toMatch(/^\/travel\//);
      expect(hotel.image.alt).not.toBe("");
      expect(hotel.url).toMatch(/^https:\/\//);
    }
  });

  it("keeps ad-tracking parameters out of the hotel links", () => {
    for (const hotel of travel.hotels) {
      expect(hotel.url).not.toMatch(/WT\.mc_id|dsclid|hmGUID|adType/);
    }
  });

  it("embeds and links the same My Maps map", () => {
    const id = "1bNUtd_IxHJV8D5h7WSqiZgbRNFM5xdM";
    expect(travel.map.embedUrl).toBe(`https://www.google.com/maps/d/embed?mid=${id}`);
    expect(travel.map.viewUrl).toBe(`https://www.google.com/maps/d/viewer?mid=${id}`);
  });

  it("has three tips and four local picks", () => {
    expect(travel.tips.map((t) => t.title)).toEqual(["By Air", "By Car", "What to Pack"]);
    expect(travel.localPicks).toHaveLength(4);
  });
});

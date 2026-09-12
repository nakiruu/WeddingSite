export type MealOption = { value: string; label: string };
export type NavItem = { href: string; label: string };
export type Gift = {
  id: string;
  brand: string;
  name: string;
  description: string;
  price: string;
  url: string;
  icon: "espresso" | "mixer" | "ricecooker";
  iconLabel: string;
};
export type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: "mail" | "calendar" | "plane" | "gift" | "help" | "pin";
  external?: boolean;
};

const MAPS_URL =
  "https://maps.google.com/?q=12355+Fort+Caroline+Rd+Jacksonville+FL+32225";

/**
 * Every wedding fact lives here. The homepage, the RSVP page, the footer and
 * the page metadata all read from it, so a date change is a single edit.
 * `tests/site-config.test.ts` pins the values against the source artboards.
 */
export const siteConfig = {
  couple: { first: "Julie", second: "Nick", joined: "Julie & Nick" },

  date: {
    iso: "2027-01-14",
    long: "January 14th, 2027",
    short: "January 14, 2027",
  },

  venue: {
    name: "The Social Chapel",
    street: "12355 Fort Caroline Rd",
    cityStateZip: "Jacksonville, FL 32225",
    mapsUrl: MAPS_URL,
  },

  rsvpDeadline: "December 14, 2026",

  footerLine: "January 14, 2027 · Jacksonville, FL",

  welcomeMessage:
    "We are so excited to celebrate this special day with all of you. Your love and support have meant the world to us, and we cannot wait to share this moment together. More details to come — for now, save the date and get ready for a wonderful evening.",

  // Decorative: the adjacent text carries every fact this image conveys, so
  // an empty alt keeps it out of the accessibility tree.
  heroImage: {
    src: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=900&q=80",
    alt: "",
  },

  meals: [
    { value: "chicken", label: "Herb-Roasted Chicken" },
    { value: "salmon", label: "Pan-Seared Salmon" },
    { value: "vegetarian", label: "Garden Vegetable Risotto" },
  ] satisfies MealOption[],

  nav: [
    { href: "/rsvp", label: "RSVP" },
    { href: "/schedule", label: "Schedule" },
    { href: "/travel", label: "Travel & Accommodations" },
    { href: "/registry", label: "Registry" },
    { href: "/faq", label: "FAQ" },
  ] satisfies NavItem[],

  registry: {
    intro:
      "Your presence is the greatest gift, but if you'd like to help us start our new life together, here are a few things we'd love.",
    honeymoon: {
      title: "Honeymoon Fund",
      description:
        "Help us create unforgettable memories on our honeymoon. Any contribution, big or small, means the world to us.",
      raised: "$0 raised",
    },
    gifts: [
      {
        id: "breville",
        brand: "Breville",
        name: "Barista Express Impress",
        description:
          "Semi-automatic espresso machine with built-in grinder. Damson Blue.",
        price: "$799.95",
        url: "https://www.amazon.com/Breville-Barista-Express-Espresso-BES876DBL/dp/B0CGJZW53Q/",
        icon: "espresso",
        iconLabel: "Espresso Machine",
      },
      {
        id: "kitchenaid",
        brand: "KitchenAid",
        name: "Classic 4.5 Qt Stand Mixer",
        description:
          "10-speed tilt-head stand mixer with 4.5-quart stainless steel bowl. Onyx Black.",
        price: "$399.99",
        url: "https://www.amazon.com/KitchenAid-Classic-Quart-Tilt-Head-K45SSOB/dp/B003OXNBYC/",
        icon: "mixer",
        iconLabel: "Stand Mixer",
      },
      {
        id: "zojirushi",
        brand: "Zojirushi",
        name: "Micom 3-Cup Rice Cooker",
        description:
          "Fuzzy logic rice cooker & warmer with 8 preset cooking options. Stainless Black.",
        price: "$189.99",
        url: "https://www.amazon.com/Zojirushi-NS-LGC05XB-Cooker-uncooked-Stainless/dp/B01EVHWNVG/",
        icon: "ricecooker",
        iconLabel: "Rice Cooker",
      },
    ] satisfies Gift[],
  },

  quickLinks: [
    {
      href: "/rsvp",
      label: "RSVP",
      description: "Let us know you're coming",
      icon: "mail",
    },
    {
      href: "/schedule",
      label: "Schedule",
      description: "Timeline for the day",
      icon: "calendar",
    },
    {
      href: "/travel",
      label: "Travel",
      description: "Getting there & staying nearby",
      icon: "plane",
    },
    {
      href: "/registry",
      label: "Registry",
      description: "Browse our wish list",
      icon: "gift",
    },
    {
      href: "/faq",
      label: "FAQ",
      description: "Common questions answered",
      icon: "help",
    },
    {
      href: MAPS_URL,
      label: "Venue",
      description: "View on Google Maps",
      icon: "pin",
      external: true,
    },
  ] satisfies QuickLink[],
} as const;

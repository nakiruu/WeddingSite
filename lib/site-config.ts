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
export type Hotel = {
  id: string;
  name: string;
  street: string;
  cityStateZip: string;
  distance: string;
  priceFrom: string;
  url: string;
  image: { src: string; alt: string };
};
export type TravelTip = {
  title: string;
  body: string;
  icon: "plane" | "car" | "suitcase";
};
export type LocalPick = { name: string; note: string; url: string };
export type QuickLink = {
  href: string;
  label: string;
  description: string;
  icon: "mail" | "calendar" | "plane" | "gift" | "help" | "pin";
  external?: boolean;
};

const MAPS_URL =
  "https://www.google.com/maps/place/The+Social+Chapel/@30.3798196,-81.505224,17z/data=!3m1!4b1!4m6!3m5!1s0x88e44d84265537db:0x789ecc6049dc202d!8m2!3d30.379815!4d-81.5026491!16s%2Fg%2F11mcz5djc6?entry=ttu&g_ep=EgoyMDI2MDkzMC4wIKXMDSoASAFQAw%3D%3D";

export type ContributeConfig = {
  /** Deep-links straight into the Venmo app or web with the note prefilled. */
  venmo: { handle: string; url: string } | null;
  /**
   * Zelle has no payment URL — it lives inside each bank's own app — so the
   * only thing a page can do is show the number for the guest to type in.
   */
  zelle: { phone: string; display: string } | null;
  /** Set `url` to a Stripe Payment Link to switch the card button on. */
  stripe: { url: string } | null;
};

const VENMO_HANDLE = "nzubulidis";

// Annotated separately so `stripe: null` stays widened to `{url} | null`;
// under the outer `as const` it would narrow to the literal `null` and the
// "card payments are live" branch would become unreachable dead code.
const contribute: ContributeConfig = {
  venmo: {
    handle: VENMO_HANDLE,
    url: `https://venmo.com/?txn=pay&recipients=${VENMO_HANDLE}&note=${encodeURIComponent(
      "Julie & Nick — Honeymoon Fund",
    )}`,
  },
  zelle: {
    phone: "9046246439",
    display: "(904) 624-6439",
  },
  // TODO(stripe): create a Payment Link in the Stripe dashboard with
  // "let customers choose the amount" enabled, then paste it here as
  // `stripe: { url: "https://buy.stripe.com/..." }`. No other change needed.
  stripe: null,
};

/**
 * Every wedding fact lives here. The homepage, the RSVP page, the footer and
 * the page metadata all read from it, so a date change is a single edit.
 * `tests/site-config.test.ts` pins the values against the source artboards.
 */
export const siteConfig = {
  couple: { first: "Nick", second: "Julie", joined: "Nick & Julie" },

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

  rsvpDeadline: "November 14, 2026",

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
    { value: "pulled-pork", label: "Pulled Pork" },
    { value: "chicken", label: "Chicken" },
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
      contribute,
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

  travel: {
    intro:
      "We’re so glad you’re making the trip. Here’s everything you need to get to Jacksonville and settle in — we can’t wait to celebrate with you.",
    airport: {
      name: "Jacksonville Intl (JAX)",
      distance: "18.5 mi · 21 min drive",
    },
    // A Google My Maps map with the chapel, the hotels and the airport. The
    // embed URL is the same map id under /embed; /viewer is the full page.
    map: {
      embedUrl:
        "https://www.google.com/maps/d/embed?mid=1bNUtd_IxHJV8D5h7WSqiZgbRNFM5xdM",
      viewUrl:
        "https://www.google.com/maps/d/viewer?mid=1bNUtd_IxHJV8D5h7WSqiZgbRNFM5xdM",
    },
    tips: [
      {
        title: "By Air",
        body: "Fly into Jacksonville International (JAX), about 21 minutes from the chapel.",
        icon: "plane",
      },
      {
        title: "By Car",
        body: "Parking details will be updated soon.",
        icon: "car",
      },
      {
        title: "What to Pack",
        body: "January in Jacksonville is mild, with sunny days in the 60s and cool evenings. Bring a light jacket for after dark.",
        icon: "suitcase",
      },
    ] satisfies TravelTip[],
    // No room block: these are simply nearby options, with the lowest rate
    // seen when they were added. Update `priceFrom` by hand if it drifts.
    hotels: [
      {
        id: "hampton-inn",
        name: "Hampton Inn Jacksonville East Regency Square",
        street: "1021 Hospitality Ln",
        cityStateZip: "Jacksonville, FL 32225",
        distance: "4.5 mi · 10 min to chapel",
        priceFrom: "$89",
        // Tracking parameters stripped; the dates pre-fill Hilton's search.
        url: "https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=JAXRSHX&arrivalDate=2027-01-14&departureDate=2027-01-15&room1NumAdults=1",
        image: {
          src: "/travel/hampton-inn.jpg",
          alt: "Hampton Inn Jacksonville East Regency Square at dusk, its entrance lined with palm trees",
        },
      },
      {
        id: "towneplace-suites",
        name: "TownePlace Suites by Marriott Jacksonville Mayport",
        street: "2580 Mayport Rd",
        cityStateZip: "Jacksonville, FL 32233",
        distance: "7.4 mi · 11 min to chapel",
        priceFrom: "$141",
        url: "https://www.marriott.com/en-us/hotels/jaxat-towneplace-suites-jacksonville-mayport/overview/",
        image: {
          src: "/travel/towneplace-suites.webp",
          alt: "TownePlace Suites by Marriott Jacksonville Mayport, a four-storey hotel with palm trees at the entrance",
        },
      },
      {
        id: "courtyard",
        name: "Courtyard by Marriott Jacksonville I-295/East Beltway",
        street: "9815 Lantern St",
        cityStateZip: "Jacksonville, FL 32225",
        distance: "4.4 mi · 8 min to chapel",
        priceFrom: "$109",
        url: "https://www.marriott.com/en-us/hotels/jaxne-courtyard-jacksonville-i-295-east-beltway/overview/",
        image: {
          src: "/travel/courtyard.webp",
          alt: "Courtyard by Marriott Jacksonville I-295/East Beltway, a red-brick hotel with a covered entrance at dusk",
        },
      },
    ] satisfies Hotel[],
    localPicks: [
      {
        name: "Mezza Luna Ristorante",
        note: "Amazing Italian food with many great options.",
        url: "http://www.mezzalunajax.com/",
      },
      {
        name: "Ellianos Coffee",
        note: "Great coffee, energy drinks, and snacks.",
        url: "http://ellianos.com/",
      },
      {
        name: "Jacksonville Arboretum & Botanical Gardens",
        note: "Beautiful Arboretum and it’s where Nick and Julie had their first date and got engaged.",
        url: "http://www.jacksonvillearboretum.org/",
      },
      {
        name: "Jacksonville Zoo and Botanical Gardens",
        note: "A beautiful zoo with a focus on conservation.",
        url: "http://www.jacksonvillezoo.org/",
      },
    ] satisfies LocalPick[],
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

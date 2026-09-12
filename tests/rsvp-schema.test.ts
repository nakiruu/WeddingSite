import { describe, it, expect } from "vitest";
import { rsvpSchema, normalizeRsvp } from "@/lib/rsvp-schema";

const accepting = {
  guestName: "Dana Whitfield",
  attendance: "accept" as const,
  meal: "salmon" as const,
  plusOne: false,
};

function errorPaths(input: unknown): string[] {
  const result = rsvpSchema.safeParse(input);
  if (result.success) return [];
  return result.error.issues.map((i) => i.path.join("."));
}

describe("rsvpSchema — guest name", () => {
  it("accepts a valid guest", () => {
    expect(rsvpSchema.safeParse(accepting).success).toBe(true);
  });

  it("rejects a blank name", () => {
    expect(errorPaths({ ...accepting, guestName: "   " })).toContain(
      "guestName",
    );
  });

  it("rejects a name over 100 characters", () => {
    expect(errorPaths({ ...accepting, guestName: "a".repeat(101) })).toContain(
      "guestName",
    );
  });

  it("trims surrounding whitespace", () => {
    const parsed = rsvpSchema.parse({ ...accepting, guestName: "  Dana  " });
    expect(parsed.guestName).toBe("Dana");
  });
});

describe("rsvpSchema — attendance", () => {
  it("requires an attendance choice", () => {
    const { attendance, ...withoutAttendance } = accepting;
    void attendance;
    expect(errorPaths(withoutAttendance)).toContain("attendance");
  });

  it("rejects an unknown attendance value", () => {
    expect(errorPaths({ ...accepting, attendance: "maybe" })).toContain(
      "attendance",
    );
  });
});

describe("rsvpSchema — meal is conditional on attending", () => {
  it("requires a meal when accepting", () => {
    const { meal, ...withoutMeal } = accepting;
    void meal;
    expect(errorPaths(withoutMeal)).toContain("meal");
  });

  it("does not require a meal when declining", () => {
    const result = rsvpSchema.safeParse({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a meal that is not on the menu", () => {
    expect(errorPaths({ ...accepting, meal: "lobster" })).toContain("meal");
  });
});

describe("rsvpSchema — plus-one is conditional on attending and the toggle", () => {
  it("requires a plus-one name and meal when attending with a plus one", () => {
    const paths = errorPaths({ ...accepting, plusOne: true });
    expect(paths).toContain("plusOneName");
    expect(paths).toContain("plusOneMeal");
  });

  it("accepts a complete plus-one", () => {
    const result = rsvpSchema.safeParse({
      ...accepting,
      plusOne: true,
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
    });
    expect(result.success).toBe(true);
  });

  it("does not require plus-one details when the toggle is off", () => {
    expect(errorPaths({ ...accepting, plusOne: false })).toEqual([]);
  });

  it("does not require plus-one details when declining, even if the toggle is on", () => {
    const result = rsvpSchema.safeParse({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: true,
    });
    expect(result.success).toBe(true);
  });

  it("defaults plusOne to false when omitted", () => {
    const { plusOne, ...withoutPlusOne } = accepting;
    void plusOne;
    expect(rsvpSchema.parse(withoutPlusOne).plusOne).toBe(false);
  });
});

describe("rsvpSchema — dietary notes", () => {
  it("allows dietary notes to be omitted", () => {
    expect(rsvpSchema.safeParse(accepting).success).toBe(true);
  });

  it("rejects dietary notes over 500 characters", () => {
    expect(errorPaths({ ...accepting, dietary: "a".repeat(501) })).toContain(
      "dietary",
    );
  });
});

describe("normalizeRsvp", () => {
  it("strips every downstream field when declining", () => {
    const parsed = rsvpSchema.parse({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: true,
      meal: "salmon",
      dietary: "No shellfish",
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
    });
    expect(normalizeRsvp(parsed)).toEqual({
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: false,
    });
  });

  it("strips plus-one fields when the toggle is off", () => {
    const parsed = rsvpSchema.parse({
      ...accepting,
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
      plusOneDietary: "Vegan",
    });
    const normalized = normalizeRsvp(parsed);
    expect(normalized.plusOneName).toBeUndefined();
    expect(normalized.plusOneMeal).toBeUndefined();
    expect(normalized.plusOneDietary).toBeUndefined();
  });

  it("leaves a complete accepting response untouched", () => {
    const parsed = rsvpSchema.parse({
      ...accepting,
      plusOne: true,
      plusOneName: "Rowan Hale",
      plusOneMeal: "chicken",
    });
    expect(normalizeRsvp(parsed)).toEqual(parsed);
  });
});

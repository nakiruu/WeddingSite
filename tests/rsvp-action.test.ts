import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { submitRsvp } from "@/app/rsvp/actions";

beforeEach(() => {
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("submitRsvp", () => {
  it("accepts a complete response", async () => {
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "accept",
      meal: "salmon",
      plusOne: false,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects a payload that skipped client validation", async () => {
    const result = await submitRsvp({
      guestName: "",
      attendance: "accept",
      plusOne: false,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.guestName).toBeDefined();
      expect(result.fieldErrors?.meal).toBeDefined();
    }
  });

  it("rejects an incomplete plus-one", async () => {
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "accept",
      meal: "salmon",
      plusOne: true,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.fieldErrors?.plusOneName).toBeDefined();
    }
  });

  it("records a declining guest without meal details", async () => {
    const spy = vi.spyOn(console, "info");
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "decline",
      meal: "salmon",
      plusOne: true,
      plusOneName: "Rowan Hale",
    });
    expect(result.ok).toBe(true);

    const recorded = spy.mock.calls.at(-1)?.[1] as Record<string, unknown>;
    expect(recorded.meal).toBeUndefined();
    expect(recorded.plusOneName).toBeUndefined();
    expect(recorded.plusOne).toBe(false);
  });
});

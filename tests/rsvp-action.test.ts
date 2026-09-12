import { describe, it, expect, beforeEach } from "vitest";
import { submitRsvp } from "@/app/rsvp/actions";
import { getDb, listRsvps } from "@/lib/db";

beforeEach(() => {
  getDb().exec("DELETE FROM rsvps");
});

describe("submitRsvp", () => {
  it("accepts a complete response and persists it", async () => {
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "accept",
      meal: "salmon",
      plusOne: false,
    });
    expect(result.ok).toBe(true);

    const rows = listRsvps(getDb());
    expect(rows).toHaveLength(1);
    expect(rows[0].guestName).toBe("Dana Whitfield");
    expect(rows[0].meal).toBe("salmon");
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
    expect(listRsvps(getDb())).toHaveLength(0);
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
    expect(listRsvps(getDb())).toHaveLength(0);
  });

  it("stores a declining guest without meal or plus-one details", async () => {
    const result = await submitRsvp({
      guestName: "Dana Whitfield",
      attendance: "decline",
      meal: "salmon",
      plusOne: true,
      plusOneName: "Rowan Hale",
    });
    expect(result.ok).toBe(true);

    const [row] = listRsvps(getDb());
    expect(row.attendance).toBe("decline");
    expect(row.meal).toBeNull();
    expect(row.plusOneName).toBeNull();
    expect(row.plusOne).toBe(false);
  });
});

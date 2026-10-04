import { describe, it, expect, beforeEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import {
  openDatabase,
  claimGift,
  forceReleaseGift,
  listClaimedItemIds,
  listClaims,
  insertRsvp,
  listRsvps,
} from "@/lib/db";

let db: DatabaseSync;

beforeEach(() => {
  db = openDatabase(":memory:");
});

describe("gift claims", () => {
  it("starts with nothing claimed", () => {
    expect(listClaimedItemIds(db)).toEqual([]);
  });

  it("records a claim", () => {
    expect(claimGift(db, "breville", "Dana Whitfield").ok).toBe(true);
    expect(listClaimedItemIds(db)).toEqual(["breville"]);
  });

  it("refuses a second claim on the same gift", () => {
    claimGift(db, "breville", "Dana Whitfield");
    // This is the whole point of server-side claims: the second guest must be
    // told no, rather than both believing they claimed it.
    expect(claimGift(db, "breville", "Rowan Hale")).toEqual({
      ok: false,
      reason: "already-claimed",
    });
    expect(listClaims(db)).toHaveLength(1);
    expect(listClaims(db)[0].claimedBy).toBe("Dana Whitfield");
  });

  it("keeps separate gifts independent", () => {
    claimGift(db, "breville", "Dana");
    claimGift(db, "zojirushi", "Rowan");
    expect(listClaimedItemIds(db).sort()).toEqual(["breville", "zojirushi"]);
  });

  it("records who claimed and when", () => {
    claimGift(db, "kitchenaid", "  Dana Whitfield  ");
    const [row] = listClaims(db);
    expect(row.itemId).toBe("kitchenaid");
    expect(row.claimedBy).toBe("Dana Whitfield");
    expect(Number.isNaN(Date.parse(row.claimedAt))).toBe(false);
  });

  it("allows an anonymous claim, since the name is optional", () => {
    expect(claimGift(db, "breville", "   ").ok).toBe(true);
    expect(listClaimedItemIds(db)).toEqual(["breville"]);
    expect(listClaims(db)[0].claimedBy).toBeNull();
  });

  it("allows a claim with no name argument at all", () => {
    expect(claimGift(db, "zojirushi").ok).toBe(true);
    expect(listClaims(db)[0].claimedBy).toBeNull();
  });

  it("still records a name when the guest gives one", () => {
    claimGift(db, "kitchenaid", "  Dana Whitfield  ");
    expect(listClaims(db)[0].claimedBy).toBe("Dana Whitfield");
  });

  it("allows us to force-release a claim when a guest loses their code", () => {
    claimGift(db, "breville", "Dana");
    expect(forceReleaseGift(db, "breville")).toEqual({ ok: true });
    expect(listClaimedItemIds(db)).toEqual([]);
    expect(claimGift(db, "breville", "Rowan").ok).toBe(true);
  });
});

describe("rsvps", () => {
  const accepting = {
    guestName: "Dana Whitfield",
    attendance: "accept" as const,
    meal: "pulled-pork" as const,
    dietary: "No shellfish",
    plusOne: true,
    plusOneName: "Rowan Hale",
    plusOneMeal: "chicken" as const,
    plusOneDietary: "Vegan",
  };

  it("starts empty", () => {
    expect(listRsvps(db)).toEqual([]);
  });

  it("round-trips a full accepting response", () => {
    insertRsvp(db, accepting);
    const [row] = listRsvps(db);
    expect(row.guestName).toBe("Dana Whitfield");
    expect(row.attendance).toBe("accept");
    expect(row.meal).toBe("pulled-pork");
    expect(row.dietary).toBe("No shellfish");
    expect(row.plusOne).toBe(true);
    expect(row.plusOneName).toBe("Rowan Hale");
    expect(row.plusOneMeal).toBe("chicken");
    expect(row.plusOneDietary).toBe("Vegan");
    expect(Number.isNaN(Date.parse(row.createdAt))).toBe(false);
  });

  it("stores a decline with no downstream fields", () => {
    insertRsvp(db, {
      guestName: "Dana Whitfield",
      attendance: "decline",
      plusOne: false,
    });
    const [row] = listRsvps(db);
    expect(row.attendance).toBe("decline");
    expect(row.meal).toBeNull();
    expect(row.plusOneName).toBeNull();
    expect(row.plusOne).toBe(false);
  });

  it("keeps every response rather than overwriting by name", () => {
    insertRsvp(db, accepting);
    insertRsvp(db, { ...accepting, meal: "chicken" });
    expect(listRsvps(db)).toHaveLength(2);
  });
});

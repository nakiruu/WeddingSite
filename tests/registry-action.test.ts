import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { claimGiftAction, getClaimedIds } = await import("@/app/registry/actions");
const { getDb } = await import("@/lib/db");

beforeEach(() => {
  getDb().exec("DELETE FROM gift_claims");
});

describe("claimGiftAction", () => {
  it("claims a gift and reports the updated list", async () => {
    const result = await claimGiftAction("breville", "Dana Whitfield");
    expect(result.ok).toBe(true);
    expect(result.claimedIds).toEqual(["breville"]);
  });

  it("refuses a gift another guest already claimed", async () => {
    await claimGiftAction("breville", "Dana Whitfield");
    const result = await claimGiftAction("breville", "Rowan Hale");

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/just claimed/i);
    // The loser still gets the truth back, so their page corrects itself.
    expect(result.claimedIds).toEqual(["breville"]);
  });

  it("rejects an item id that is not on the registry", async () => {
    const result = await claimGiftAction("not-a-real-gift", "Dana");
    expect(result.ok).toBe(false);
    expect(await getClaimedIds()).toEqual([]);
  });

  it("rejects a blank claimant name", async () => {
    const result = await claimGiftAction("breville", "   ");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/name/i);
    expect(await getClaimedIds()).toEqual([]);
  });

  it("lets different guests claim different gifts", async () => {
    await claimGiftAction("breville", "Dana");
    await claimGiftAction("zojirushi", "Rowan");
    expect((await getClaimedIds()).sort()).toEqual(["breville", "zojirushi"]);
  });
});

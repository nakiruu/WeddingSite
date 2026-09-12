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

  it("accepts an anonymous claim, since the name is optional", async () => {
    const result = await claimGiftAction("breville", "   ");
    expect(result.ok).toBe(true);
    expect(await getClaimedIds()).toEqual(["breville"]);
  });

  it("still issues a release code for an anonymous claim", async () => {
    const result = await claimGiftAction("breville");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.releaseCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("lets different guests claim different gifts", async () => {
    await claimGiftAction("breville", "Dana");
    await claimGiftAction("zojirushi", "Rowan");
    expect((await getClaimedIds()).sort()).toEqual(["breville", "zojirushi"]);
  });
});

const { releaseGiftAction } = await import("@/app/registry/actions");

describe("releaseGiftAction", () => {
  it("cancels a claim when given the code from claiming", async () => {
    const claim = await claimGiftAction("breville", "Dana Whitfield");
    expect(claim.ok).toBe(true);
    if (!claim.ok) return;

    const release = await releaseGiftAction("breville", claim.releaseCode);
    expect(release.ok).toBe(true);
    expect(release.claimedIds).toEqual([]);
  });

  it("refuses a wrong code and leaves the claim standing", async () => {
    await claimGiftAction("breville", "Dana Whitfield");
    const release = await releaseGiftAction("breville", "AAAA-BBBB");

    expect(release.ok).toBe(false);
    if (!release.ok) expect(release.message).toMatch(/does not match/i);
    expect(release.claimedIds).toEqual(["breville"]);
  });

  it("frees the gift for the next guest", async () => {
    const claim = await claimGiftAction("breville", "Dana");
    if (!claim.ok) throw new Error("claim failed");
    await releaseGiftAction("breville", claim.releaseCode);

    const second = await claimGiftAction("breville", "Rowan Hale");
    expect(second.ok).toBe(true);
  });

  it("says so when the gift was not claimed", async () => {
    const release = await releaseGiftAction("zojirushi", "AAAA-BBBB");
    expect(release.ok).toBe(false);
    if (!release.ok) expect(release.message).toMatch(/not currently claimed/i);
  });

  it("rejects an unknown gift id", async () => {
    const release = await releaseGiftAction("not-a-real-gift", "AAAA-BBBB");
    expect(release.ok).toBe(false);
  });
});

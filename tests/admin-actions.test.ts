import { describe, it, expect, beforeEach, vi } from "vitest";

const SECRET = "test-secret-not-a-real-one-xxxx";
process.env.ADMIN_SECRET = SECRET;

/** Stands in for the request's cookie jar; tests swap what it holds. */
const jar = { value: undefined as string | undefined };

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name === "wedding-admin" && jar.value !== undefined
        ? { name, value: jar.value }
        : undefined,
    set: () => {},
    delete: () => {},
  }),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { deleteRsvpAction, releaseClaimAction } = await import(
  "@/app/admin/actions"
);
const { getDb, insertRsvp, listRsvps, claimGift, listClaimedItemIds } =
  await import("@/lib/db");
const { deriveSessionToken } = await import("@/lib/admin-auth");

function signedIn() {
  jar.value = deriveSessionToken(SECRET);
}
function signedOut() {
  jar.value = undefined;
}

function seedRsvp() {
  return insertRsvp(getDb(), {
    guestName: "Dana Whitfield",
    attendance: "accept",
    meal: "pulled-pork",
    plusOne: false,
  });
}

beforeEach(() => {
  const db = getDb();
  db.exec("DELETE FROM rsvps");
  db.exec("DELETE FROM gift_claims");
  signedIn();
});

describe("deleteRsvpAction — authorization", () => {
  it("refuses without a session and leaves the row alone", async () => {
    const id = seedRsvp();
    signedOut();

    const result = await deleteRsvpAction(id);

    expect(result.ok).toBe(false);
    // A Server Action is a public endpoint; the page's check does not protect it.
    expect(listRsvps(getDb())).toHaveLength(1);
  });

  it("refuses a forged session token", async () => {
    const id = seedRsvp();
    jar.value = deriveSessionToken("some-other-secret-entirely");

    expect((await deleteRsvpAction(id)).ok).toBe(false);
    expect(listRsvps(getDb())).toHaveLength(1);
  });

  it("refuses once the secret is rotated", async () => {
    const id = seedRsvp();
    signedIn();
    process.env.ADMIN_SECRET = "a-different-secret-value-entirely";

    expect((await deleteRsvpAction(id)).ok).toBe(false);
    expect(listRsvps(getDb())).toHaveLength(1);

    process.env.ADMIN_SECRET = SECRET;
  });
});

describe("deleteRsvpAction — behaviour", () => {
  it("deletes the named response", async () => {
    const id = seedRsvp();
    expect((await deleteRsvpAction(id)).ok).toBe(true);
    expect(listRsvps(getDb())).toHaveLength(0);
  });

  it("deletes only the row asked for", async () => {
    const keep = seedRsvp();
    const drop = insertRsvp(getDb(), {
      guestName: "Marcus Bell",
      attendance: "decline",
      plusOne: false,
    });

    await deleteRsvpAction(drop);

    const left = listRsvps(getDb());
    expect(left).toHaveLength(1);
    expect(left[0].id).toBe(keep);
  });

  it("reports a row that is already gone", async () => {
    const id = seedRsvp();
    await deleteRsvpAction(id);

    const second = await deleteRsvpAction(id);
    expect(second.ok).toBe(false);
    if (!second.ok) expect(second.message).toMatch(/no longer exists/i);
  });

  it("rejects a nonsense id without touching the table", async () => {
    seedRsvp();
    expect((await deleteRsvpAction(-1)).ok).toBe(false);
    expect((await deleteRsvpAction(1.5)).ok).toBe(false);
    expect(listRsvps(getDb())).toHaveLength(1);
  });
});

describe("releaseClaimAction", () => {
  it("refuses without a session and leaves the claim standing", async () => {
    claimGift(getDb(), "breville", "Dana");
    signedOut();

    expect((await releaseClaimAction("breville")).ok).toBe(false);
    expect(listClaimedItemIds(getDb())).toEqual(["breville"]);
  });

  it("clears a claim and frees the gift again", async () => {
    claimGift(getDb(), "breville", "Dana");

    expect((await releaseClaimAction("breville")).ok).toBe(true);
    expect(listClaimedItemIds(getDb())).toEqual([]);
    // The whole point: the gift goes back on the registry for someone else.
    expect(claimGift(getDb(), "breville", "Rowan").ok).toBe(true);
  });

  it("leaves other claims untouched", async () => {
    claimGift(getDb(), "breville", "Dana");
    claimGift(getDb(), "ninja", "Rowan");

    await releaseClaimAction("breville");
    expect(listClaimedItemIds(getDb())).toEqual(["ninja"]);
  });
});

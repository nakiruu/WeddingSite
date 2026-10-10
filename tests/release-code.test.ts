import { describe, it, expect, beforeEach } from "vitest";
import type { DatabaseSync } from "node:sqlite";
import {
  openDatabase,
  claimGift,
  releaseGift,
  listClaimedItemIds,
  listClaims,
  generateReleaseCode,
  RELEASE_CODE_ALPHABET,
} from "@/lib/db";

let db: DatabaseSync;

function claim(itemId = "breville", who = "Dana Whitfield") {
  const result = claimGift(db, itemId, who);
  if (!result.ok) throw new Error("expected claim to succeed");
  return result.releaseCode;
}

beforeEach(() => {
  db = openDatabase(":memory:");
});

describe("generateReleaseCode", () => {
  it("is eight characters in two dashed groups", () => {
    expect(generateReleaseCode()).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("avoids characters people misread", () => {
    // 0/O and 1/I/L are the classic transcription failures; a guest reading a
    // code off a screen and typing it on a phone must not have to guess.
    for (const banned of ["0", "O", "1", "I", "L"]) {
      expect(RELEASE_CODE_ALPHABET).not.toContain(banned);
    }
  });

  it("does not repeat itself", () => {
    const codes = new Set(Array.from({ length: 500 }, generateReleaseCode));
    expect(codes.size).toBe(500);
  });
});

describe("claiming issues a release code", () => {
  it("returns a code to the claimant", () => {
    const code = claim();
    expect(code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });

  it("gives different gifts different codes", () => {
    expect(claim("breville")).not.toBe(claim("ninja", "Rowan"));
  });

  it("stores only the hash, never the code itself", () => {
    const code = claim();
    const dump = JSON.stringify(
      db.prepare("SELECT * FROM gift_claims").all(),
    );
    // A leaked database must not let anyone cancel a guest's claim.
    expect(dump).not.toContain(code);
    expect(dump).not.toContain(code.replace("-", ""));
  });
});

describe("releasing a claim", () => {
  it("frees the gift when the code is right", () => {
    const code = claim();
    expect(releaseGift(db, "breville", code)).toEqual({ ok: true });
    expect(listClaimedItemIds(db)).toEqual([]);
  });

  it("lets the gift be claimed again afterwards", () => {
    const code = claim();
    releaseGift(db, "breville", code);
    const second = claimGift(db, "breville", "Rowan Hale");
    expect(second.ok).toBe(true);
    expect(listClaims(db)[0].claimedBy).toBe("Rowan Hale");
  });

  it("refuses a wrong code and keeps the claim", () => {
    claim();
    expect(releaseGift(db, "breville", "AAAA-BBBB")).toEqual({
      ok: false,
      reason: "wrong-code",
    });
    expect(listClaimedItemIds(db)).toEqual(["breville"]);
  });

  it("will not release one gift with another gift's code", () => {
    const brevilleCode = claim("breville");
    claim("ninja", "Rowan");
    expect(releaseGift(db, "ninja", brevilleCode)).toEqual({
      ok: false,
      reason: "wrong-code",
    });
    expect(listClaimedItemIds(db).sort()).toEqual(["breville", "ninja"]);
  });

  it("accepts the code however the guest retypes it", () => {
    const code = claim();
    // Lowercased, dashes dropped, stray spaces — all the same code.
    const mangled = ` ${code.toLowerCase().replace("-", "")} `;
    expect(releaseGift(db, "breville", mangled)).toEqual({ ok: true });
  });

  it("reports an unclaimed gift rather than pretending to succeed", () => {
    expect(releaseGift(db, "breville", "AAAA-BBBB")).toEqual({
      ok: false,
      reason: "not-claimed",
    });
  });

  it("rejects a blank code", () => {
    claim();
    expect(releaseGift(db, "breville", "   ")).toEqual({
      ok: false,
      reason: "wrong-code",
    });
    expect(listClaimedItemIds(db)).toEqual(["breville"]);
  });
});

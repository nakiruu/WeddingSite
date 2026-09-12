import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  ADMIN_COOKIE,
  adminSecretConfigured,
  deriveSessionToken,
  secretMatches,
  sessionTokenIsValid,
  MIN_SECRET_LENGTH,
} from "@/lib/admin-auth";

const GOOD = "test-secret-not-a-real-one-xxxx";
const original = process.env.ADMIN_SECRET;

beforeEach(() => {
  process.env.ADMIN_SECRET = GOOD;
});

afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_SECRET;
  else process.env.ADMIN_SECRET = original;
});

describe("secretMatches", () => {
  it("accepts the configured secret", () => {
    expect(secretMatches(GOOD)).toBe(true);
  });

  it("tolerates surrounding whitespace from a paste", () => {
    expect(secretMatches(`  ${GOOD}  `)).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(secretMatches("not-the-secret")).toBe(false);
  });

  it("rejects a prefix of the real secret", () => {
    expect(secretMatches(GOOD.slice(0, -1))).toBe(false);
  });

  it("rejects an empty attempt", () => {
    expect(secretMatches("")).toBe(false);
    expect(secretMatches("   ")).toBe(false);
  });
});

describe("failing closed", () => {
  it("denies everything when no secret is configured", () => {
    delete process.env.ADMIN_SECRET;
    // An unset secret must lock the page, never open it.
    expect(adminSecretConfigured()).toBe(false);
    expect(secretMatches("")).toBe(false);
    expect(secretMatches("anything")).toBe(false);
  });

  it("denies everything when the secret is blank", () => {
    process.env.ADMIN_SECRET = "   ";
    expect(adminSecretConfigured()).toBe(false);
    expect(secretMatches("   ")).toBe(false);
  });

  it("refuses a secret that is too short to be worth having", () => {
    process.env.ADMIN_SECRET = "short";
    expect(adminSecretConfigured()).toBe(false);
    expect(secretMatches("short")).toBe(false);
    expect(MIN_SECRET_LENGTH).toBeGreaterThanOrEqual(16);
  });
});

describe("session token", () => {
  it("is stable for the same secret", () => {
    expect(deriveSessionToken(GOOD)).toBe(deriveSessionToken(GOOD));
  });

  it("is not the secret itself", () => {
    const token = deriveSessionToken(GOOD);
    // The cookie must not be a copy of the secret sitting in the browser.
    expect(token).not.toContain(GOOD);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
  });

  it("changes completely if the secret changes", () => {
    expect(deriveSessionToken(GOOD)).not.toBe(deriveSessionToken(GOOD + "x"));
  });

  it("validates a token derived from the configured secret", () => {
    expect(sessionTokenIsValid(deriveSessionToken(GOOD))).toBe(true);
  });

  it("rejects a token from a different secret", () => {
    expect(sessionTokenIsValid(deriveSessionToken("some-other-secret"))).toBe(
      false,
    );
  });

  it("rejects a missing or junk token", () => {
    expect(sessionTokenIsValid(undefined)).toBe(false);
    expect(sessionTokenIsValid("")).toBe(false);
    expect(sessionTokenIsValid("deadbeef")).toBe(false);
  });

  it("rejects every token once the secret is rotated away", () => {
    const old = deriveSessionToken(GOOD);
    process.env.ADMIN_SECRET = "a-completely-different-secret-value";
    // Rotating the secret must sign existing sessions out.
    expect(sessionTokenIsValid(old)).toBe(false);
  });
});

describe("cookie", () => {
  it("has a stable name", () => {
    expect(ADMIN_COOKIE).toBe("wedding-admin");
  });
});

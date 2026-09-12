import { DatabaseSync } from "node:sqlite";
import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type { RsvpData } from "@/lib/rsvp-schema";

/*
  Persistence for gift claims and RSVPs.

  Built on node:sqlite, which ships with Node 22+ — no dependency, no native
  build step. The database is a single file; point WEDDING_DB_PATH at it in
  production. This needs a PERSISTENT filesystem: it works on a VPS, a
  container with a mounted volume, or locally, but NOT on ephemeral
  serverless filesystems, where every instance would get its own empty copy.
*/

export type ClaimRow = {
  itemId: string;
  /** Null when the guest claimed anonymously — the name is optional. */
  claimedBy: string | null;
  claimedAt: string;
};

export type RsvpRow = {
  id: number;
  guestName: string;
  attendance: "accept" | "decline";
  meal: string | null;
  dietary: string | null;
  plusOne: boolean;
  plusOneName: string | null;
  plusOneMeal: string | null;
  plusOneDietary: string | null;
  createdAt: string;
};

export type ClaimResult =
  | { ok: true; releaseCode: string }
  | { ok: false; reason: "already-claimed" };

export type ReleaseResult =
  | { ok: true }
  | { ok: false; reason: "not-claimed" | "wrong-code" | "no-code-on-record" };

/*
  Release codes: a capability, not an identity.

  A guest who claims a gift gets a short secret back. Holding it is the only
  thing that authorizes cancelling that claim — the server never needs to know
  who they are, so nobody has to make an account. Only the hash is stored, so
  a leaked database still cannot cancel anyone's claim.

  The alphabet omits 0/O and 1/I/L: a guest reads this off one screen and
  types it into another, and those are the characters they get wrong.
*/
export const RELEASE_CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export function generateReleaseCode(): string {
  let out = "";
  for (let i = 0; i < 8; i++) {
    // randomInt is rejection-sampled, so no modulo bias across the 31 letters.
    out += RELEASE_CODE_ALPHABET[randomInt(0, RELEASE_CODE_ALPHABET.length)];
  }
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}

/** Whatever the guest typed — spaces, dashes, lowercase — becomes one form. */
function normalizeReleaseCode(code: string): string {
  return code.replace(/[\s-]/g, "").toUpperCase();
}

function hashReleaseCode(code: string): string {
  return createHash("sha256").update(normalizeReleaseCode(code)).digest("hex");
}

function hashesMatch(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS gift_claims (
  item_id    TEXT PRIMARY KEY,
  claimed_by TEXT NOT NULL,
  claimed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rsvps (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  guest_name       TEXT NOT NULL,
  attendance       TEXT NOT NULL,
  meal             TEXT,
  dietary          TEXT,
  plus_one         INTEGER NOT NULL DEFAULT 0,
  plus_one_name    TEXT,
  plus_one_meal    TEXT,
  plus_one_dietary TEXT,
  created_at       TEXT NOT NULL
);
`;

export function openDatabase(path: string): DatabaseSync {
  if (path !== ":memory:") {
    mkdirSync(dirname(path), { recursive: true });
  }
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(SCHEMA);
  migrate(db);
  return db;
}

function migrate(db: DatabaseSync) {
  const columns = db
    .prepare("PRAGMA table_info(gift_claims)")
    .all() as { name: string }[];

  if (!columns.some((c) => c.name === "release_code_hash")) {
    // Nullable on purpose: claims made before release codes existed have no
    // hash, and those can only be cleared by us rather than by the guest.
    db.exec("ALTER TABLE gift_claims ADD COLUMN release_code_hash TEXT");
  }
}

let singleton: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!singleton) {
    const path = process.env.WEDDING_DB_PATH ?? resolve("data/wedding.db");
    singleton = openDatabase(path);
  }
  return singleton;
}

// ── Gift claims ────────────────────────────────────────────────────────────

export function listClaims(db: DatabaseSync): ClaimRow[] {
  const rows = db
    .prepare(
      "SELECT item_id, claimed_by, claimed_at FROM gift_claims ORDER BY claimed_at",
    )
    .all() as Record<string, string>[];
  return rows.map((r) => ({
    itemId: r.item_id,
    // An anonymous claim is stored as "" (the column is NOT NULL on databases
    // created before names became optional); surface it as null.
    claimedBy: r.claimed_by ? r.claimed_by : null,
    claimedAt: r.claimed_at,
  }));
}

export function listClaimedItemIds(db: DatabaseSync): string[] {
  return listClaims(db).map((c) => c.itemId);
}

/**
 * Claims a gift for one guest. The PRIMARY KEY plus ON CONFLICT DO NOTHING is
 * what makes this safe when two guests click at the same moment: SQLite
 * serializes the writes, the loser's insert changes zero rows, and they are
 * told the gift is gone instead of both being told they got it.
 */
export function claimGift(
  db: DatabaseSync,
  itemId: string,
  claimedBy?: string | null,
): ClaimResult {
  // The name is optional: it exists so the couple can write thank-you notes,
  // and a guest who would rather stay anonymous should not be blocked from
  // claiming. Release codes, not names, are what authorize cancelling.
  const name = (claimedBy ?? "").trim().slice(0, 100);

  const releaseCode = generateReleaseCode();

  const result = db
    .prepare(
      `INSERT INTO gift_claims (item_id, claimed_by, claimed_at, release_code_hash)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(item_id) DO NOTHING`,
    )
    .run(itemId, name, new Date().toISOString(), hashReleaseCode(releaseCode));

  return result.changes === 1
    ? { ok: true, releaseCode }
    : { ok: false, reason: "already-claimed" };
}

/**
 * Cancels a claim. The code is the whole authorization: whoever holds it may
 * release the gift, and nobody else can, without anyone identifying themselves.
 */
export function releaseGift(
  db: DatabaseSync,
  itemId: string,
  code: string,
): ReleaseResult {
  const row = db
    .prepare("SELECT release_code_hash FROM gift_claims WHERE item_id = ?")
    .get(itemId) as { release_code_hash: string | null } | undefined;

  if (!row) return { ok: false, reason: "not-claimed" };
  if (!row.release_code_hash) return { ok: false, reason: "no-code-on-record" };

  if (!hashesMatch(row.release_code_hash, hashReleaseCode(code))) {
    return { ok: false, reason: "wrong-code" };
  }

  db.prepare("DELETE FROM gift_claims WHERE item_id = ?").run(itemId);
  return { ok: true };
}

/** Unconditional release, for when a guest loses their code and asks us. */
export function forceReleaseGift(db: DatabaseSync, itemId: string): { ok: true } {
  db.prepare("DELETE FROM gift_claims WHERE item_id = ?").run(itemId);
  return { ok: true };
}

// ── RSVPs ──────────────────────────────────────────────────────────────────

export function insertRsvp(db: DatabaseSync, rsvp: RsvpData): number {
  const result = db
    .prepare(
      `INSERT INTO rsvps
         (guest_name, attendance, meal, dietary,
          plus_one, plus_one_name, plus_one_meal, plus_one_dietary, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      rsvp.guestName,
      rsvp.attendance,
      rsvp.meal ?? null,
      rsvp.dietary || null,
      rsvp.plusOne ? 1 : 0,
      rsvp.plusOneName || null,
      rsvp.plusOneMeal ?? null,
      rsvp.plusOneDietary || null,
      new Date().toISOString(),
    );
  return Number(result.lastInsertRowid);
}

export function deleteRsvp(
  db: DatabaseSync,
  id: number,
): { ok: true } | { ok: false; reason: "not-found" } {
  const result = db.prepare("DELETE FROM rsvps WHERE id = ?").run(id);
  return result.changes === 1 ? { ok: true } : { ok: false, reason: "not-found" };
}

export function listRsvps(db: DatabaseSync): RsvpRow[] {
  const rows = db
    .prepare("SELECT * FROM rsvps ORDER BY created_at")
    .all() as Record<string, string | number | null>[];
  return rows.map((r) => ({
    id: Number(r.id),
    guestName: String(r.guest_name),
    attendance: r.attendance as "accept" | "decline",
    meal: (r.meal as string) ?? null,
    dietary: (r.dietary as string) ?? null,
    plusOne: Number(r.plus_one) === 1,
    plusOneName: (r.plus_one_name as string) ?? null,
    plusOneMeal: (r.plus_one_meal as string) ?? null,
    plusOneDietary: (r.plus_one_dietary as string) ?? null,
    createdAt: String(r.created_at),
  }));
}

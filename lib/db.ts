import { DatabaseSync } from "node:sqlite";
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
  claimedBy: string;
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
  | { ok: true }
  | { ok: false; reason: "already-claimed" | "invalid-name" };

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
  return db;
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
    claimedBy: r.claimed_by,
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
  claimedBy: string,
): ClaimResult {
  const name = claimedBy.trim();
  if (!name) return { ok: false, reason: "invalid-name" };

  const result = db
    .prepare(
      `INSERT INTO gift_claims (item_id, claimed_by, claimed_at)
       VALUES (?, ?, ?)
       ON CONFLICT(item_id) DO NOTHING`,
    )
    .run(itemId, name, new Date().toISOString());

  return result.changes === 1 ? { ok: true } : { ok: false, reason: "already-claimed" };
}

export function releaseGift(db: DatabaseSync, itemId: string): { ok: true } {
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

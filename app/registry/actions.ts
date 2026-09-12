"use server";

import { revalidatePath } from "next/cache";
import { getDb, claimGift, releaseGift, listClaimedItemIds } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

export type ClaimGiftResult =
  | { ok: true; releaseCode: string; claimedIds: string[] }
  | { ok: false; message: string; claimedIds: string[] };

export type ReleaseGiftResult =
  | { ok: true; claimedIds: string[] }
  | { ok: false; message: string; claimedIds: string[] };

const VALID_IDS = new Set(siteConfig.registry.gifts.map((g) => g.id));

export async function claimGiftAction(
  itemId: string,
  claimedBy: string,
): Promise<ClaimGiftResult> {
  const db = getDb();

  // The item id arrives from the client, so it is checked against the known
  // registry rather than trusted into the database.
  if (!VALID_IDS.has(itemId)) {
    return {
      ok: false,
      message: "That gift is not on the registry.",
      claimedIds: listClaimedItemIds(db),
    };
  }

  const result = claimGift(db, itemId, claimedBy);
  revalidatePath("/registry");

  if (!result.ok) {
    return {
      ok: false,
      message:
        result.reason === "already-claimed"
          ? "Someone just claimed this one. Here is the updated list."
          : "Please enter your name so we know who to thank.",
      claimedIds: listClaimedItemIds(db),
    };
  }

  return {
    ok: true,
    releaseCode: result.releaseCode,
    claimedIds: listClaimedItemIds(db),
  };
}

export async function releaseGiftAction(
  itemId: string,
  code: string,
): Promise<ReleaseGiftResult> {
  const db = getDb();

  if (!VALID_IDS.has(itemId)) {
    return {
      ok: false,
      message: "That gift is not on the registry.",
      claimedIds: listClaimedItemIds(db),
    };
  }

  const result = releaseGift(db, itemId, code);
  revalidatePath("/registry");

  if (result.ok) return { ok: true, claimedIds: listClaimedItemIds(db) };

  const message =
    result.reason === "not-claimed"
      ? "That gift is not currently claimed."
      : result.reason === "no-code-on-record"
        ? "This claim predates cancellation codes — please let us know and we will clear it."
        : "That code does not match this gift. Check it and try again.";

  return { ok: false, message, claimedIds: listClaimedItemIds(db) };
}

export async function getClaimedIds(): Promise<string[]> {
  return listClaimedItemIds(getDb());
}

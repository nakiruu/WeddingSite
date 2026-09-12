"use server";

import { revalidatePath } from "next/cache";
import { getDb, claimGift, listClaimedItemIds } from "@/lib/db";
import { siteConfig } from "@/lib/site-config";

export type ClaimGiftResult =
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

  if (!result.ok) {
    revalidatePath("/registry");
    return {
      ok: false,
      message:
        result.reason === "already-claimed"
          ? "Someone just claimed this one. Here is the updated list."
          : "Please enter your name so we know who the gift is from.",
      claimedIds: listClaimedItemIds(db),
    };
  }

  revalidatePath("/registry");
  return { ok: true, claimedIds: listClaimedItemIds(db) };
}

export async function getClaimedIds(): Promise<string[]> {
  return listClaimedItemIds(getDb());
}

"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  adminSecretConfigured,
  currentSessionToken,
  secretMatches,
  sessionTokenIsValid,
} from "@/lib/admin-auth";
import { getDb, deleteRsvp, forceReleaseGift } from "@/lib/db";

export type SignInResult = { ok: true } | { ok: false; message: string };

/*
  A deliberately crude brute-force brake. In-process and per-server, which is
  fine for one admin and one secret: it turns an online guessing attack into
  something that would take longer than the marriage. It resets on restart —
  acceptable, because 192 bits of secret is the real defence and this only
  exists so a script cannot hammer the endpoint for free.
*/
const MAX_ATTEMPTS = 8;
const WINDOW_MS = 10 * 60 * 1000;
let attempts: number[] = [];

function rateLimited(): boolean {
  const now = Date.now();
  attempts = attempts.filter((t) => now - t < WINDOW_MS);
  return attempts.length >= MAX_ATTEMPTS;
}

export async function signIn(secret: string): Promise<SignInResult> {
  if (!adminSecretConfigured()) {
    return {
      ok: false,
      message:
        "No admin secret is configured on the server. Set ADMIN_SECRET and restart.",
    };
  }

  if (rateLimited()) {
    return {
      ok: false,
      message: "Too many attempts. Wait a few minutes and try again.",
    };
  }

  if (!secretMatches(secret)) {
    attempts.push(Date.now());
    // One message for every failure: never hint at which part was wrong.
    return { ok: false, message: "That key is not correct." };
  }

  const token = currentSessionToken();
  if (!token) return { ok: false, message: "Server configuration error." };

  attempts = [];
  const jar = await cookies();
  jar.set(ADMIN_COOKIE, token, {
    httpOnly: true, // page scripts, and anything injected, cannot read it
    sameSite: "strict", // not sent from other sites
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 60 * 60 * 12,
  });

  revalidatePath("/admin");
  return { ok: true };
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  jar.delete({ name: ADMIN_COOKIE, path: "/admin" });
  revalidatePath("/admin");
}

export type MutationResult = { ok: true } | { ok: false; message: string };

/*
  Every mutation below re-checks the session.

  A Server Action is a public HTTP endpoint — it is not protected by the fact
  that the page rendering its button checked a cookie. Without this, anyone who
  knew the action id could delete a guest's RSVP without ever seeing /admin.
*/
async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return sessionTokenIsValid(jar.get(ADMIN_COOKIE)?.value);
}

const DENIED: MutationResult = {
  ok: false,
  message: "Your session has expired. Unlock the page again.",
};

export async function deleteRsvpAction(id: number): Promise<MutationResult> {
  if (!(await isAdmin())) return DENIED;

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, message: "That response no longer exists." };
  }

  const result = deleteRsvp(getDb(), id);
  revalidatePath("/admin");

  return result.ok
    ? { ok: true }
    : { ok: false, message: "That response no longer exists." };
}

/**
 * Clears a gift claim on the guest's behalf — the escape hatch for someone
 * who lost their cancellation code. The gift becomes claimable again.
 */
export async function releaseClaimAction(
  itemId: string,
): Promise<MutationResult> {
  if (!(await isAdmin())) return DENIED;

  forceReleaseGift(getDb(), itemId);
  revalidatePath("/admin");
  revalidatePath("/registry");
  return { ok: true };
}

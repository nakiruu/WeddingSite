"use server";

import { rsvpSchema, normalizeRsvp, type RsvpInput } from "@/lib/rsvp-schema";
import { getDb, insertRsvp } from "@/lib/db";

export type RsvpResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

export async function submitRsvp(values: RsvpInput): Promise<RsvpResult> {
  // Re-validate on the server. This action is a public endpoint, so the
  // client-side resolver is advisory only.
  const parsed = rsvpSchema.safeParse(values);

  if (!parsed.success) {
    const flattened = fieldErrorsFrom(parsed.error);
    return {
      ok: false,
      message: "Please check the highlighted fields and try again.",
      fieldErrors: flattened,
    };
  }

  const rsvp = normalizeRsvp(parsed.data);

  try {
    insertRsvp(getDb(), rsvp);
  } catch (err) {
    // A guest who filled the form correctly should never be told their input
    // is wrong because our disk is full — report the failure as ours.
    console.error("[rsvp] failed to save", err);
    return {
      ok: false,
      message:
        "We could not save your response just now. Please try again in a moment.",
    };
  }

  return { ok: true };
}

function fieldErrorsFrom(error: {
  issues: { path: PropertyKey[]; message: string }[];
}): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (!key) continue;
    (out[key] ??= []).push(issue.message);
  }
  return out;
}

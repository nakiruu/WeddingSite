"use server";

import { rsvpSchema, normalizeRsvp, type RsvpInput } from "@/lib/rsvp-schema";

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

  // TODO(persistence): write `rsvp` to the real store — database, email, or
  // spreadsheet. This console record is the only thing standing in for it,
  // so responses are NOT durably saved until this line is replaced.
  console.info("[rsvp] received", rsvp);

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

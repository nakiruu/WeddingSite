import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/*
  Admin access is a single shared secret, held in ADMIN_SECRET and never in
  the repository. There are no accounts, so this is the same capability idea
  as the registry release codes: knowing the string is the whole permission.

  The secret is exchanged for a session cookie rather than living in the URL.
  A /admin?key=... link would leak the secret into browser history, Referer
  headers, bookmarks, and every server access log it passes through.
*/

export const ADMIN_COOKIE = "wedding-admin";

/** Below this, a "secret" is guessable and the page is better off locked. */
export const MIN_SECRET_LENGTH = 16;

function configuredSecret(): string | null {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret || secret.length < MIN_SECRET_LENGTH) return null;
  return secret;
}

export function adminSecretConfigured(): boolean {
  return configuredSecret() !== null;
}

/**
 * Constant-time string comparison. Both sides are hashed first so the compare
 * is over equal-length buffers — timingSafeEqual throws on length mismatch,
 * and the length itself would otherwise leak.
 */
function safeEqual(a: string, b: string): boolean {
  return timingSafeEqual(
    createHash("sha256").update(a).digest(),
    createHash("sha256").update(b).digest(),
  );
}

export function secretMatches(candidate: string): boolean {
  const secret = configuredSecret();
  // Fail closed: an unset or too-short secret locks the page rather than
  // opening it to everyone, which is the failure mode that actually matters.
  if (!secret) return false;
  return safeEqual(candidate.trim(), secret);
}

/**
 * What the cookie carries. Derived from the secret rather than being the
 * secret, so a stolen cookie cannot be typed into the login form, and
 * rotating ADMIN_SECRET invalidates every existing session.
 */
export function deriveSessionToken(secret: string): string {
  return createHmac("sha256", secret)
    .update("wedding-admin-session-v1")
    .digest("hex");
}

export function sessionTokenIsValid(token: string | undefined | null): boolean {
  const secret = configuredSecret();
  if (!secret || !token) return false;
  return safeEqual(token, deriveSessionToken(secret));
}

export function currentSessionToken(): string | null {
  const secret = configuredSecret();
  return secret ? deriveSessionToken(secret) : null;
}

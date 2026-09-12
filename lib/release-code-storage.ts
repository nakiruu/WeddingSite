const KEY = "wedding-registry-codes";

type CodeMap = Record<string, string>;

/*
  The guest's own copy of their release codes, so the browser they claimed
  from can offer "Cancel my claim" with no typing. It is a convenience, never
  the source of truth: the code also appears on screen at claim time, and the
  server accepts it typed in from any other device.

  Every access is guarded — localStorage throws in private windows and when a
  browser blocks site data, and losing a convenience must never break the page.
*/

function read(): CodeMap {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as CodeMap;
  } catch {
    return {};
  }
}

function write(map: CodeMap): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    // Out of quota or storage disabled — the on-screen code still works.
  }
}

export function loadMyCodes(): CodeMap {
  return read();
}

export function rememberCode(itemId: string, code: string): void {
  write({ ...read(), [itemId]: code });
}

export function forgetCode(itemId: string): void {
  const map = read();
  delete map[itemId];
  write(map);
}

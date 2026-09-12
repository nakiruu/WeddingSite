import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const css = readFileSync(
  fileURLToPath(new URL("../app/globals.css", import.meta.url)),
  "utf8",
);

function tokensIn(selector: string): Record<string, string> {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  if (!match) throw new Error(`No "${selector}" block found in globals.css`);
  const out: Record<string, string> = {};
  for (const line of match[1].split(";")) {
    const [name, ...rest] = line.split(":");
    if (!name?.trim().startsWith("--")) continue;
    out[name.trim()] = rest.join(":").trim();
  }
  return out;
}

const LIGHT = {
  "--background": "#f5edf1",
  "--foreground": "#17151a",
  "--card": "#ece0e7",
  "--popover": "#ece0e7",
  "--primary": "#7b2e5e",
  "--primary-foreground": "#ffffff",
  "--primary-hover": "#3d1e37",
  "--secondary": "#ece0e7",
  "--muted": "#ece0e7",
  "--muted-foreground": "#7d576b",
  "--accent": "#ece0e7",
  "--destructive": "#b23b47",
  "--success": "#2f7d5f",
  "--border": "#ddd0d8",
  "--input": "#ddd0d8",
  "--ring": "#7b2e5e",
  "--mulberry": "#7b2e5e",
  "--mulberry-strong": "#7b2e5e",
};

const DARK = {
  "--background": "#17151a",
  "--foreground": "#f2e7ec",
  "--card": "#3d1e37",
  "--popover": "#3d1e37",
  "--primary": "#7b2e5e",
  "--primary-foreground": "#ffffff",
  "--primary-hover": "#ac6284",
  "--secondary": "#3d1e37",
  "--muted": "#3d1e37",
  "--muted-foreground": "#c398ae",
  "--accent": "#3d1e37",
  "--destructive": "#d96b6b",
  "--success": "#5fa98c",
  "--border": "#4a3344",
  "--input": "#4a3344",
  "--ring": "#ac6284",
  "--mulberry": "#ac6284",
  "--mulberry-strong": "#c78ba8",
};

describe("Mulberry theme tokens", () => {
  it("defines every light-mode token on :root", () => {
    const root = tokensIn(":root");
    for (const [name, value] of Object.entries(LIGHT)) {
      expect(root[name], `:root ${name}`).toBe(value);
    }
  });

  it("defines every dark-mode token on .dark", () => {
    const dark = tokensIn(".dark");
    for (const [name, value] of Object.entries(DARK)) {
      expect(dark[name], `.dark ${name}`).toBe(value);
    }
  });

  it("overrides the same token names in both modes", () => {
    expect(Object.keys(tokensIn(".dark")).sort()).toEqual(
      Object.keys(tokensIn(":root")).sort(),
    );
  });

  it("sets a zero border radius in both modes", () => {
    expect(tokensIn(":root")["--radius"]).toBe("0rem");
    expect(tokensIn(".dark")["--radius"]).toBe("0rem");
  });

  it("exposes the Mulberry accents as Tailwind colors", () => {
    expect(css).toContain("--color-mulberry: var(--mulberry)");
    expect(css).toContain("--color-mulberry-strong: var(--mulberry-strong)");
    expect(css).toContain("--color-success: var(--success)");
    expect(css).toContain("--color-primary-hover: var(--primary-hover)");
  });

  it("binds the two wedding typefaces", () => {
    expect(css).toContain("--font-display: var(--font-cormorant)");
    expect(css).toContain("--font-sans: var(--font-inter)");
  });
});

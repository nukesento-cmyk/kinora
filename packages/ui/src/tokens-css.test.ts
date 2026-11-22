import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { renderTokensCss } from "./tokens-css";
import { colorRoles } from "./tokens";

const cssPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "styles/tokens.css");

describe("tokens.css", () => {
  it("is in sync with tokens.ts (run `pnpm --filter @kinora/ui tokens` if this fails)", () => {
    expect(readFileSync(cssPath, "utf8")).toBe(renderTokensCss());
  });

  it("defines every colour role for light, OS-dark and forced-dark", () => {
    const css = renderTokensCss();
    for (const role of colorRoles) {
      expect(css.match(new RegExp(`--kn-${role}:`, "g"))?.length, role).toBe(3);
    }
  });
});

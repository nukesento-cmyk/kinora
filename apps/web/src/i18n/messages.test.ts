import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { defaultLocale, locales } from "./config";

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../messages");

type Messages = { [key: string]: string | Messages };

function flatten(obj: Messages, prefix = ""): Map<string, string> {
  const out = new Map<string, string>();
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out.set(key, v);
    else for (const [ik, iv] of flatten(v, key)) out.set(ik, iv);
  }
  return out;
}

const load = (locale: string) =>
  flatten(JSON.parse(readFileSync(path.join(dir, `${locale}.json`), "utf8")) as Messages);

/** ICU argument names, e.g. {brand} or {count, plural, ...} → brand, count. */
const args = (message: string) =>
  [...message.matchAll(/\{\s*([a-zA-Z_][\w]*)\s*[,}]/g)].map((m) => m[1]).sort();

describe("message files", () => {
  it("has a file for every configured locale and nothing extra", () => {
    const files = readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .map((f) => f.replace(".json", ""));
    expect(files.sort()).toEqual([...locales].sort());
  });

  const base = load(defaultLocale);

  it("has no empty messages", () => {
    for (const [key, value] of base) expect(value.trim(), key).not.toBe("");
  });

  it.each(locales.filter((l) => l !== defaultLocale))(
    "%s matches English keys and arguments",
    (locale) => {
      const other = load(locale);
      expect([...other.keys()].sort()).toEqual([...base.keys()].sort());
      for (const [key, value] of base) expect(args(other.get(key) ?? ""), key).toEqual(args(value));
    },
  );
});

import { describe, expect, it } from "vitest";
import { entries, list, type Translator } from "./messages";

const messages: Record<string, unknown> = {
  a: ["one {brand}", "two"],
  "a.0": "one {brand}",
  "a.1": "two",
  b: [{ title: "T", body: "B" }],
  "b.0.title": "T",
  "b.0.body": "B {brand}",
  c: "not a list",
};

const t = Object.assign(
  (key: string, values?: Record<string, string | number>) =>
    String(messages[key]).replace("{brand}", String(values?.brand ?? "")),
  { raw: (key: string) => messages[key] },
) as Translator;

describe("message list helpers", () => {
  it("translates each entry of a list with values", () => {
    expect(list(t, "a", { brand: "K" })).toEqual(["one K", "two"]);
    expect(entries(t, "b", { brand: "K" })).toEqual([{ title: "T", body: "B K" }]);
  });

  it("returns an empty list when the key isn't a list", () => {
    expect(list(t, "c")).toEqual([]);
    expect(entries(t, "c")).toEqual([]);
  });
});

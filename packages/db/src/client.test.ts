import { EnvValidationError } from "@kinora/config";
import { describe, expect, it } from "vitest";
import { createDb } from "./client";

describe("createDb", () => {
  it("refuses to start without a valid postgres URL", () => {
    expect(() => createDb({})).toThrow(EnvValidationError);
    expect(() => createDb({ DATABASE_URL: "https://example.com" })).toThrow(EnvValidationError);
  });

  it("creates a client lazily without connecting", () => {
    const db = createDb({ DATABASE_URL: "postgresql://user:pass@localhost/kinora" });
    expect(db).toBeDefined();
  });
});

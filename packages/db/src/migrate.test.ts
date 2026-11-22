import { describe, expect, it } from "vitest";
import {
  describeTarget,
  errorCode,
  explainDbError,
  loadDatabaseUrl,
  waitForDatabase,
} from "./migrate";

const url = "postgresql://kinora:s3cret-pass@localhost:5433/kinora";

describe("describeTarget", () => {
  it("shows where and who, never the password", () => {
    const t = describeTarget(url);
    expect(t).toEqual({ where: "localhost:5433/kinora", user: "kinora" });
    expect(JSON.stringify(t)).not.toContain("s3cret-pass");
  });
});

describe("errorCode", () => {
  it("reads codes nested in AggregateError (IPv4 and IPv6 attempts)", () => {
    const agg = Object.assign(new AggregateError([{ code: "ECONNREFUSED" }]), {});
    expect(errorCode(agg)).toBe("ECONNREFUSED");
    expect(errorCode({ code: "28P01" })).toBe("28P01");
    expect(errorCode(undefined)).toBeUndefined();
  });
});

describe("explainDbError", () => {
  const cases: Array<[string, RegExp]> = [
    ["ECONNREFUSED", /pnpm db:up/],
    ["28P01", /rejected the password/],
    ["28000", /different Postgres/],
    ["3D000", /doesn't exist/],
    ["ENOTFOUND", /can't be found/],
  ];
  it.each(cases)("explains %s with a fix", (code, pattern) => {
    const message = explainDbError({ code }, url);
    expect(message).toMatch(pattern);
    expect(message).not.toContain("s3cret-pass");
  });

  it("falls back to the raw message for unknown errors", () => {
    expect(explainDbError({ code: "XX000", message: "boom" }, url)).toContain("boom");
  });
});

describe("loadDatabaseUrl", () => {
  it("rejects non-postgres URLs", () => {
    expect(() => loadDatabaseUrl({ DATABASE_URL: "mysql://x" })).toThrow(/postgres/);
  });
  it("accepts a postgres URL", () => {
    expect(loadDatabaseUrl({ DATABASE_URL: url })).toBe(url);
  });
});

describe("waitForDatabase", () => {
  it("gives up with ECONNREFUSED when nothing is listening", async () => {
    const start = Date.now();
    const error = await waitForDatabase("postgresql://u:p@127.0.0.1:1/x", {
      timeoutMs: 600,
      intervalMs: 100,
    }).catch((e: unknown) => e);
    expect(errorCode(error)).toBe("ECONNREFUSED");
    expect(Date.now() - start).toBeGreaterThanOrEqual(500);
  });
});

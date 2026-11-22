import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EnvValidationError, optionalString, parseEnv, sharedEnvSchema } from "./env";

const valid = {
  APP_URL: "http://localhost:3000",
  ADMIN_URL: "http://localhost:3001",
  LAUNCH_MARKETS: "KE",
};

describe("parseEnv", () => {
  it("returns typed values and applies defaults", () => {
    const env = parseEnv(sharedEnvSchema, valid);
    expect(env.APP_URL).toBe("http://localhost:3000");
    expect(env.NODE_ENV).toBe("development");
  });

  it("lists every invalid variable by name", () => {
    try {
      parseEnv(sharedEnvSchema, { APP_URL: "not-a-url" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(EnvValidationError);
      const issues = (error as EnvValidationError).issues.join("\n");
      expect(issues).toContain("APP_URL");
      expect(issues).toContain("ADMIN_URL");
      expect(issues).toContain("LAUNCH_MARKETS");
    }
  });

  it("never echoes secret values in the error message", () => {
    const schema = z.object({ SECRET: z.string().length(64) });
    try {
      parseEnv(schema, { SECRET: "super-secret-value" });
      expect.unreachable();
    } catch (error) {
      expect((error as Error).message).not.toContain("super-secret-value");
    }
  });
});

describe("optionalString", () => {
  it("treats blank strings as unset", () => {
    expect(optionalString.parse("  ")).toBeUndefined();
    expect(optionalString.parse(undefined)).toBeUndefined();
    expect(optionalString.parse(" a@b.co ")).toBe("a@b.co");
  });
});

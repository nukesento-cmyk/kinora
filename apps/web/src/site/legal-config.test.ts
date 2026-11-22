import { EnvValidationError } from "@kinora/config";
import { describe, expect, it } from "vitest";
import { getLegalConfig } from "./legal-config";

describe("legal configuration", () => {
  it("leaves every detail unset by default, so drafts say 'to be confirmed'", () => {
    expect(getLegalConfig({})).toEqual({
      entityName: undefined,
      address: undefined,
      privacyEmail: undefined,
    });
  });

  it("treats blank values as unset", () => {
    expect(getLegalConfig({ NEXT_PUBLIC_LEGAL_ENTITY_NAME: "  " }).entityName).toBeUndefined();
  });

  it("reads the configured company details", () => {
    const config = getLegalConfig({
      NEXT_PUBLIC_LEGAL_ENTITY_NAME: " Example Ltd ",
      NEXT_PUBLIC_LEGAL_ADDRESS: "PO Box 1, Nairobi",
      NEXT_PUBLIC_PRIVACY_EMAIL: "privacy@example.com",
    });
    expect(config).toEqual({
      entityName: "Example Ltd",
      address: "PO Box 1, Nairobi",
      privacyEmail: "privacy@example.com",
    });
  });

  it("falls back to the support address for privacy requests", () => {
    expect(getLegalConfig({}, "help@example.com").privacyEmail).toBe("help@example.com");
  });

  it("rejects a malformed privacy address", () => {
    expect(() => getLegalConfig({ NEXT_PUBLIC_PRIVACY_EMAIL: "not-an-email" })).toThrow(
      EnvValidationError,
    );
  });
});

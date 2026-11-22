import { describe, expect, it } from "vitest";
import { describeUserAgent } from "./user-agent";

describe("describeUserAgent", () => {
  it("recognises common browsers and systems", () => {
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0",
      ),
    ).toEqual({ browser: "Edge", os: "Windows" });
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36",
      ),
    ).toEqual({ browser: "Chrome", os: "Android" });
    expect(
      describeUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
      ),
    ).toEqual({ browser: "Safari", os: "iOS" });
    expect(
      describeUserAgent(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.0; rv:132.0) Gecko/20100101 Firefox/132.0",
      ),
    ).toEqual({ browser: "Firefox", os: "macOS" });
  });

  it("admits when it doesn't know", () => {
    expect(describeUserAgent(null)).toEqual({ browser: null, os: null });
    expect(describeUserAgent("curl/8.0")).toEqual({ browser: null, os: null });
  });
});

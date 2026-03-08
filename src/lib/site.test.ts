import { describe, expect, it } from "vitest";
import { parseSiteUrl } from "@/lib/site";

describe("parseSiteUrl", () => {
  it("returns a URL for valid input", () => {
    const parsed = parseSiteUrl("https://example.com");
    expect(parsed?.origin).toBe("https://example.com");
  });

  it("returns null for invalid input", () => {
    expect(parseSiteUrl("not-a-url")).toBeNull();
  });

  it("returns null for empty values", () => {
    expect(parseSiteUrl(undefined)).toBeNull();
    expect(parseSiteUrl(null)).toBeNull();
    expect(parseSiteUrl("")).toBeNull();
  });
});
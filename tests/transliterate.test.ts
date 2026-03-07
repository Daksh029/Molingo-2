import { describe, expect, it } from "vitest";
import { containsGujarati, transliterateGujaratiToLatin } from "@/lib/transliterate";

describe("Gujarati transliteration", () => {
  it("detects Gujarati script", () => {
    expect(containsGujarati("કેમ છો")).toBe(true);
    expect(containsGujarati("kem cho")).toBe(false);
  });

  it("transliterates Gujarati script into latin-friendly text", () => {
    expect(transliterateGujaratiToLatin("કેમ છો")).toBe("kem cho");
    expect(transliterateGujaratiToLatin("મને પાણી જોઈએ છે")).toContain("mane");
  });
});

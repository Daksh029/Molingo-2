import { describe, expect, it } from "vitest";
import { evaluatePronunciation } from "@/lib/scoring";

describe("pronunciation scoring", () => {
  it("returns pass for exact phrase", () => {
    const result = evaluatePronunciation("u1-l01", "kem cho");
    expect(result.status).toBe("pass");
    expect(result.nextAction).toBe("continue");
  });

  it("returns almost for partial match", () => {
    const result = evaluatePronunciation("u1-l20", "mane samaj nathi");
    expect(result.status).toBe("almost");
    expect(result.nextAction).toBe("retry");
  });

  it("returns retry for wrong phrase", () => {
    const result = evaluatePronunciation("u1-l01", "where is the station");
    expect(result.status).toBe("retry");
    expect(result.nextAction).toBe("retry");
  });

  it("handles Gujarati script by transliterating before scoring", () => {
    const result = evaluatePronunciation("u1-l01", "કેમ છો");
    expect(result.status).toBe("pass");
  });
});

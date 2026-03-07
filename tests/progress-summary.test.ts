import { describe, expect, it } from "vitest";
import { recordAttempt, getProgressSummary } from "@/lib/storage";

describe("progress summary", () => {
  it("tracks mastery and weak phrases from attempts", async () => {
    const learnerId = `test-${Date.now()}`;

    await recordAttempt({
      learnerId,
      lessonItemId: "u1-l01",
      unitId: 1,
      status: "retry",
      confidence: 0.2,
      transcript: "bad",
      feedback: "retry"
    });

    await recordAttempt({
      learnerId,
      lessonItemId: "u1-l01",
      unitId: 1,
      status: "pass",
      confidence: 0.93,
      transcript: "kem cho",
      feedback: "great"
    });

    const summary = await getProgressSummary(learnerId);
    expect(summary.totalItems).toBe(120);
    expect(summary.streakDays).toBeGreaterThanOrEqual(1);
    expect(summary.weakPhrases.length).toBeGreaterThanOrEqual(1);
  });
});

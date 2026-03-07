import { describe, expect, it } from "vitest";
import { getProgressSummary, recordAttempt, recordQuizResult } from "@/lib/storage";

describe("progress summary", () => {
  it("unlocks units using quiz checkpoints and keeps speaking as feedback only", async () => {
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

    await recordQuizResult({ learnerId, unitId: 1, sourceLessonItemId: "u1-l05", isCorrect: true });
    await recordQuizResult({ learnerId, unitId: 1, sourceLessonItemId: "u1-l10", isCorrect: true });
    await recordQuizResult({ learnerId, unitId: 1, sourceLessonItemId: "u1-l15", isCorrect: true });
    await recordQuizResult({ learnerId, unitId: 1, sourceLessonItemId: "u1-l20", isCorrect: true });

    const summary = await getProgressSummary(learnerId);
    expect(summary.totalItems).toBe(24);
    expect(summary.completedItems).toBe(4);
    expect(summary.streakDays).toBeGreaterThanOrEqual(1);

    const unit1 = summary.unitProgress.find((unit) => unit.unitId === 1);
    const unit2 = summary.unitProgress.find((unit) => unit.unitId === 2);
    const unit3 = summary.unitProgress.find((unit) => unit.unitId === 3);
    expect(unit1?.completed).toBe(4);
    expect(unit1?.total).toBe(4);
    expect(unit2?.unlocked).toBe(true);
    expect(unit3?.unlocked).toBe(false);

    expect(summary.weakPhrases.length).toBeGreaterThanOrEqual(1);
  });
});

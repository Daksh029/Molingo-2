import { describe, expect, it } from "vitest";
import { getLessonsByUnit } from "@/lib/curriculum";
import { buildLessonFlow } from "@/lib/lesson-flow";

describe("lesson flow", () => {
  it("inserts checkpoint quizzes every 5 learning items", () => {
    const unitItems = getLessonsByUnit(1);
    const flow = buildLessonFlow(unitItems, 5);

    const quizSteps = flow.filter((step) => step.kind === "quiz");

    expect(flow).toHaveLength(24);
    expect(quizSteps).toHaveLength(4);

    const firstQuiz = quizSteps[0];
    if (firstQuiz.kind !== "quiz") {
      throw new Error("Expected quiz step");
    }

    expect(firstQuiz.prompt).toContain(unitItems[4].english_text);
    expect(firstQuiz.choices).toContain(firstQuiz.correctAnswer);
    expect(firstQuiz.choices).toHaveLength(3);
  });
});

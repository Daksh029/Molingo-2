import { describe, expect, it } from "vitest";
import { GET as getLessonsByUnitRoute } from "@/app/api/lessons/[unitId]/route";
import { POST as saveQuizRoute } from "@/app/api/progress/quiz/route";
import { POST as evaluateSpeechRoute } from "@/app/api/speech/evaluate/route";

describe("api contract checks", () => {
  it("returns 400 for invalid unit id", async () => {
    const response = await getLessonsByUnitRoute(new Request("http://localhost/api/lessons/nope"), {
      params: Promise.resolve({ unitId: "nope" })
    });

    expect(response.status).toBe(400);
  });

  it("rejects missing audio and missing transcript", async () => {
    const response = await evaluateSpeechRoute(
      new Request("http://localhost/api/speech/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonItemId: "u1-l01" })
      })
    );

    expect(response.status).toBe(400);
  });

  it("accepts mock transcript and returns evaluation payload", async () => {
    const response = await evaluateSpeechRoute(
      new Request("http://localhost/api/speech/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonItemId: "u1-l01", mockTranscript: "kem cho" })
      })
    );

    const body = (await response.json()) as { status: string; confidence: number; transcript: string };
    expect(response.status).toBe(200);
    expect(body.status).toBe("pass");
    expect(body.confidence).toBeGreaterThanOrEqual(0.88);
    expect(body.transcript).toBe("kem cho");
  });

  it("stores quiz results for valid checkpoint payload", async () => {
    const response = await saveQuizRoute(
      new Request("http://localhost/api/progress/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-learner-id": "api-test-user" },
        body: JSON.stringify({ lessonItemId: "u1-l05", unitId: 1, isCorrect: true })
      })
    );

    expect(response.status).toBe(200);
  });
});

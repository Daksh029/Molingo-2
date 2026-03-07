import { getLessonById } from "@/lib/curriculum";
import { SpeechStatus } from "@/lib/types";
import { jaccardSimilarity, normalizeForMatch } from "@/lib/text";

export type EvaluationResult = {
  status: SpeechStatus;
  confidence: number;
  feedback: string;
  nextAction: "continue" | "retry";
};

function scoreAgainstVariants(transcript: string, variants: string[]): number {
  return variants.reduce((best, variant) => {
    const similarity = jaccardSimilarity(transcript, variant);
    return Math.max(best, similarity);
  }, 0);
}

export function evaluatePronunciation(lessonItemId: string, transcript: string): EvaluationResult {
  const lesson = getLessonById(lessonItemId);
  if (!lesson) {
    return {
      status: "retry",
      confidence: 0,
      feedback: "I could not find this phrase. Try loading the lesson again.",
      nextAction: "retry"
    };
  }

  const normalizedTranscript = normalizeForMatch(transcript);
  const score = scoreAgainstVariants(normalizedTranscript, lesson.acceptable_variants);

  if (score >= 0.88) {
    return {
      status: "pass",
      confidence: Number(score.toFixed(2)),
      feedback: "Great pronunciation. Keep this rhythm.",
      nextAction: "continue"
    };
  }

  if (score >= 0.62) {
    return {
      status: "almost",
      confidence: Number(score.toFixed(2)),
      feedback: `Very close. ${lesson.coach_tip}`,
      nextAction: "retry"
    };
  }

  return {
    status: "retry",
    confidence: Number(score.toFixed(2)),
    feedback: `Let us retry. Target: \"${lesson.romanized_gujarati}\". Tip: ${lesson.coach_tip}`,
    nextAction: "retry"
  };
}

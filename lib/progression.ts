import { getLessonsByUnit } from "@/lib/curriculum";

export const QUIZ_INTERVAL = 5;
export const UNIT_IDS = [1, 2, 3, 4, 5, 6] as const;

export function getQuizCheckpointIdsForUnit(unitId: number): string[] {
  const lessons = getLessonsByUnit(unitId);
  return lessons
    .filter((_, index) => (index + 1) % QUIZ_INTERVAL === 0)
    .map((lesson) => lesson.id);
}

export function getTotalQuizCheckpoints(): number {
  return UNIT_IDS.reduce((sum, unitId) => sum + getQuizCheckpointIdsForUnit(unitId).length, 0);
}

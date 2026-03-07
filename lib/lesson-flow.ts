import { LessonItem } from "@/lib/types";

export type LearnStep = {
  kind: "learn";
  id: string;
  item: LessonItem;
};

export type QuizStep = {
  kind: "quiz";
  id: string;
  prompt: string;
  correctAnswer: string;
  choices: string[];
  sourceItemId: string;
};

export type LessonFlowStep = LearnStep | QuizStep;

function rotate<T>(items: T[], offset: number): T[] {
  if (!items.length) {
    return items;
  }
  const pivot = ((offset % items.length) + items.length) % items.length;
  return [...items.slice(pivot), ...items.slice(0, pivot)];
}

function pickDistinct(items: LessonItem[], seed: number, count: number, excluded: Set<string>): LessonItem[] {
  const pool = items.filter((item) => !excluded.has(item.id));
  if (pool.length === 0) {
    return [];
  }

  const picked: LessonItem[] = [];
  let cursor = Math.abs(seed);

  while (picked.length < Math.min(count, pool.length)) {
    const item = pool[cursor % pool.length];
    if (!picked.some((entry) => entry.id === item.id)) {
      picked.push(item);
      excluded.add(item.id);
    }
    cursor += 3;
  }

  return picked;
}

export function buildLessonFlow(items: LessonItem[], quizEvery = 5): LessonFlowStep[] {
  const steps: LessonFlowStep[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    steps.push({
      kind: "learn",
      id: `learn-${item.id}`,
      item
    });

    const isQuizStep = (index + 1) % quizEvery === 0;
    if (!isQuizStep) {
      continue;
    }

    const recent = items.slice(Math.max(0, index - (quizEvery - 1)), index + 1);
    const target = recent[recent.length - 1];
    const excluded = new Set<string>([target.id]);
    const distractors = pickDistinct(items, index * 7 + 11, 2, excluded);
    const rawChoices = [target.romanized_gujarati, ...distractors.map((item) => item.romanized_gujarati)];
    const choices = rotate(rawChoices, index % rawChoices.length);

    steps.push({
      kind: "quiz",
      id: `quiz-after-${item.id}`,
      prompt: `What is \"${target.english_text}\" in Gujarati?`,
      correctAnswer: target.romanized_gujarati,
      choices,
      sourceItemId: target.id
    });
  }

  return steps;
}

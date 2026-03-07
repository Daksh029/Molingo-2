export type ReviewTag = "new" | "review_soon" | "mastering";

export type Difficulty = "easy" | "medium" | "hard";

export type SpeechStatus = "pass" | "almost" | "retry";

export interface LessonItem {
  id: string;
  unit: number;
  intent: string;
  english_text: string;
  romanized_gujarati: string;
  target_audio_text: string;
  acceptable_variants: string[];
  coach_tip: string;
  difficulty: Difficulty;
  review_tag: ReviewTag;
}

export interface Unit {
  id: number;
  title: string;
  theme: string;
  mascot: string;
  color: string;
  description: string;
}

export interface AttemptInput {
  learnerId: string;
  lessonItemId: string;
  unitId: number;
  status: SpeechStatus;
  confidence: number;
  transcript: string;
  feedback: string;
}

export interface EvaluateInput {
  lessonItemId: string;
  audioBase64?: string;
  mimeType?: string;
  mockTranscript?: string;
}

export interface ProgressSummary {
  learnerId: string;
  streakDays: number;
  completedItems: number;
  totalItems: number;
  unitProgress: Array<{
    unitId: number;
    completed: number;
    total: number;
    unlocked: boolean;
  }>;
  weakPhrases: Array<{
    lessonItemId: string;
    englishText: string;
    romanizedGujarati: string;
    recentFailures: number;
  }>;
}

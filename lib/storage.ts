import { Pool } from "pg";
import { lessonItems } from "@/lib/curriculum";
import { AttemptInput, ProgressSummary, SpeechStatus } from "@/lib/types";

type AttemptRecord = AttemptInput & {
  createdAt: number;
};

type LearnerSnapshot = {
  attempts: AttemptRecord[];
  mastery: Record<string, number>;
  lastStudyDate?: string;
  streakDays: number;
};

const inMemory = new Map<string, LearnerSnapshot>();

let pool: Pool | null = null;
let schemaInitialized = false;

function getPool(): Pool | null {
  const url = process.env.POSTGRES_URL;
  if (!url) {
    return null;
  }
  if (!pool) {
    pool = new Pool({ connectionString: url });
  }
  return pool;
}

async function initSchemaIfNeeded(): Promise<void> {
  const db = getPool();
  if (!db || schemaInitialized) {
    return;
  }

  await db.query(`
    CREATE TABLE IF NOT EXISTS learner_progress (
      learner_id TEXT PRIMARY KEY,
      streak_days INT NOT NULL DEFAULT 0,
      last_study_date DATE,
      mastery_json JSONB NOT NULL DEFAULT '{}'
    );
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS attempts (
      id BIGSERIAL PRIMARY KEY,
      learner_id TEXT NOT NULL,
      lesson_item_id TEXT NOT NULL,
      unit_id INT NOT NULL,
      status TEXT NOT NULL,
      confidence REAL NOT NULL,
      transcript TEXT NOT NULL,
      feedback TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await db.query(`
    CREATE INDEX IF NOT EXISTS attempts_learner_idx
      ON attempts (learner_id, created_at DESC);
  `);

  schemaInitialized = true;
}

function getOrCreateMemorySnapshot(learnerId: string): LearnerSnapshot {
  const found = inMemory.get(learnerId);
  if (found) {
    return found;
  }

  const fresh: LearnerSnapshot = {
    attempts: [],
    mastery: {},
    streakDays: 0
  };
  inMemory.set(learnerId, fresh);
  return fresh;
}

function computeNewStreak(lastStudyDate: string | undefined, streakDays: number): { date: string; streakDays: number } {
  const today = new Date();
  const todayKey = today.toISOString().slice(0, 10);
  if (!lastStudyDate) {
    return { date: todayKey, streakDays: 1 };
  }

  if (lastStudyDate === todayKey) {
    return { date: todayKey, streakDays };
  }

  const prev = new Date(`${lastStudyDate}T00:00:00.000Z`);
  const daysDiff = Math.floor((today.getTime() - prev.getTime()) / 86_400_000);

  if (daysDiff === 1) {
    return { date: todayKey, streakDays: streakDays + 1 };
  }

  return { date: todayKey, streakDays: 1 };
}

function nextMastery(current: number | undefined, status: SpeechStatus): number {
  const currentValue = current ?? 0;
  if (status === "pass") {
    return Math.min(1, Number((currentValue + 0.12).toFixed(2)));
  }
  if (status === "almost") {
    return Math.min(1, Number((currentValue + 0.05).toFixed(2)));
  }

  return Math.max(0, Number((currentValue - 0.08).toFixed(2)));
}

export async function recordAttempt(input: AttemptInput): Promise<void> {
  const db = getPool();
  if (!db) {
    const snapshot = getOrCreateMemorySnapshot(input.learnerId);
    snapshot.attempts.unshift({ ...input, createdAt: Date.now() });
    snapshot.mastery[input.lessonItemId] = nextMastery(snapshot.mastery[input.lessonItemId], input.status);
    const streak = computeNewStreak(snapshot.lastStudyDate, snapshot.streakDays);
    snapshot.lastStudyDate = streak.date;
    snapshot.streakDays = streak.streakDays;
    return;
  }

  await initSchemaIfNeeded();

  await db.query(
    `INSERT INTO attempts (learner_id, lesson_item_id, unit_id, status, confidence, transcript, feedback)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.learnerId,
      input.lessonItemId,
      input.unitId,
      input.status,
      input.confidence,
      input.transcript,
      input.feedback
    ]
  );

  const progressResult = await db.query(
    `SELECT streak_days, last_study_date, mastery_json
     FROM learner_progress
     WHERE learner_id = $1`,
    [input.learnerId]
  );

  const row = progressResult.rows[0] as
    | { streak_days: number; last_study_date: string | null; mastery_json: Record<string, number> }
    | undefined;

  const existingMastery = row?.mastery_json ?? {};
  existingMastery[input.lessonItemId] = nextMastery(existingMastery[input.lessonItemId], input.status);

  const streak = computeNewStreak(row?.last_study_date ?? undefined, row?.streak_days ?? 0);

  await db.query(
    `INSERT INTO learner_progress (learner_id, streak_days, last_study_date, mastery_json)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (learner_id)
     DO UPDATE SET streak_days = EXCLUDED.streak_days,
                   last_study_date = EXCLUDED.last_study_date,
                   mastery_json = EXCLUDED.mastery_json`,
    [input.learnerId, streak.streakDays, streak.date, JSON.stringify(existingMastery)]
  );
}

export async function getProgressSummary(learnerId: string): Promise<ProgressSummary> {
  const db = getPool();

  if (!db) {
    const snapshot = getOrCreateMemorySnapshot(learnerId);
    const completedItems = Object.values(snapshot.mastery).filter((score) => score >= 0.8).length;

    const unitProgress = Array.from({ length: 6 }, (_, i) => i + 1).map((unitId) => {
      const unitLessons = lessonItems.filter((item) => item.unit === unitId);
      const completed = unitLessons.filter((item) => (snapshot.mastery[item.id] ?? 0) >= 0.8).length;
      return {
        unitId,
        completed,
        total: unitLessons.length,
        unlocked: unitId === 1 || completedItems >= (unitId - 1) * 10
      };
    });

    const failures = snapshot.attempts.filter((attempt) => attempt.status === "retry");
    const weakPhrases = lessonItems
      .map((item) => {
        const recentFailures = failures.filter((attempt) => attempt.lessonItemId === item.id).length;
        return {
          lessonItemId: item.id,
          englishText: item.english_text,
          romanizedGujarati: item.romanized_gujarati,
          recentFailures
        };
      })
      .filter((item) => item.recentFailures > 0)
      .sort((a, b) => b.recentFailures - a.recentFailures)
      .slice(0, 5);

    return {
      learnerId,
      streakDays: snapshot.streakDays,
      completedItems,
      totalItems: lessonItems.length,
      unitProgress,
      weakPhrases
    };
  }

  await initSchemaIfNeeded();

  const [progressResult, attemptResult] = await Promise.all([
    db.query(`SELECT streak_days, mastery_json FROM learner_progress WHERE learner_id = $1`, [learnerId]),
    db.query(
      `SELECT lesson_item_id, status
       FROM attempts
       WHERE learner_id = $1
       ORDER BY created_at DESC
       LIMIT 300`,
      [learnerId]
    )
  ]);

  const progressRow = progressResult.rows[0] as
    | { streak_days: number; mastery_json: Record<string, number> }
    | undefined;

  const mastery = progressRow?.mastery_json ?? {};
  const completedItems = Object.values(mastery).filter((score) => score >= 0.8).length;

  const unitProgress = Array.from({ length: 6 }, (_, i) => i + 1).map((unitId) => {
    const unitLessons = lessonItems.filter((item) => item.unit === unitId);
    const completed = unitLessons.filter((item) => (mastery[item.id] ?? 0) >= 0.8).length;

    return {
      unitId,
      completed,
      total: unitLessons.length,
      unlocked: unitId === 1 || completedItems >= (unitId - 1) * 10
    };
  });

  const retryCounter = new Map<string, number>();
  for (const row of attemptResult.rows as Array<{ lesson_item_id: string; status: SpeechStatus }>) {
    if (row.status === "retry") {
      retryCounter.set(row.lesson_item_id, (retryCounter.get(row.lesson_item_id) ?? 0) + 1);
    }
  }

  const weakPhrases = [...retryCounter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([lessonItemId, recentFailures]) => {
      const item = lessonItems.find((lesson) => lesson.id === lessonItemId);
      return {
        lessonItemId,
        englishText: item?.english_text ?? "Unknown phrase",
        romanizedGujarati: item?.romanized_gujarati ?? "Unknown",
        recentFailures
      };
    });

  return {
    learnerId,
    streakDays: progressRow?.streak_days ?? 0,
    completedItems,
    totalItems: lessonItems.length,
    unitProgress,
    weakPhrases
  };
}

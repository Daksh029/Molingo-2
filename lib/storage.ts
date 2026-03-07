import { Pool } from "pg";
import { lessonItems } from "@/lib/curriculum";
import { getQuizCheckpointIdsForUnit, UNIT_IDS } from "@/lib/progression";
import { AttemptInput, ProgressSummary, QuizResultInput, SpeechStatus } from "@/lib/types";

type AttemptRecord = AttemptInput & {
  createdAt: number;
};

type LearnerSnapshot = {
  attempts: AttemptRecord[];
  quizMastery: Record<string, boolean>;
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
      quiz_mastery_json JSONB NOT NULL DEFAULT '{}'
    );
  `);

  await db.query(`
    ALTER TABLE learner_progress
    ADD COLUMN IF NOT EXISTS quiz_mastery_json JSONB NOT NULL DEFAULT '{}';
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
    quizMastery: {},
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

function buildUnitProgress(quizMastery: Record<string, boolean>): ProgressSummary["unitProgress"] {
  const unitProgress: ProgressSummary["unitProgress"] = [];
  let previousUnitCompleted = true;

  for (let i = 0; i < UNIT_IDS.length; i += 1) {
    const unitId = UNIT_IDS[i];
    const checkpointIds = getQuizCheckpointIdsForUnit(unitId);
    const completed = checkpointIds.filter((checkpointId) => quizMastery[checkpointId]).length;
    const total = checkpointIds.length;
    const unlocked = i === 0 ? true : previousUnitCompleted;

    unitProgress.push({
      unitId,
      completed,
      total,
      unlocked
    });

    previousUnitCompleted = completed >= total;
  }

  return unitProgress;
}

function countCompletedCheckpoints(unitProgress: ProgressSummary["unitProgress"]): number {
  return unitProgress.reduce((sum, entry) => sum + entry.completed, 0);
}

function countTotalCheckpoints(unitProgress: ProgressSummary["unitProgress"]): number {
  return unitProgress.reduce((sum, entry) => sum + entry.total, 0);
}

export async function recordAttempt(input: AttemptInput): Promise<void> {
  const db = getPool();

  if (!db) {
    const snapshot = getOrCreateMemorySnapshot(input.learnerId);
    snapshot.attempts.unshift({ ...input, createdAt: Date.now() });
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
    `SELECT streak_days, last_study_date
     FROM learner_progress
     WHERE learner_id = $1`,
    [input.learnerId]
  );

  const row = progressResult.rows[0] as
    | {
        streak_days: number;
        last_study_date: string | null;
      }
    | undefined;

  const streak = computeNewStreak(row?.last_study_date ?? undefined, row?.streak_days ?? 0);

  await db.query(
    `INSERT INTO learner_progress (learner_id, streak_days, last_study_date)
     VALUES ($1, $2, $3)
     ON CONFLICT (learner_id)
     DO UPDATE SET streak_days = EXCLUDED.streak_days,
                   last_study_date = EXCLUDED.last_study_date`,
    [input.learnerId, streak.streakDays, streak.date]
  );
}

export async function recordQuizResult(input: QuizResultInput): Promise<void> {
  const db = getPool();

  if (!db) {
    const snapshot = getOrCreateMemorySnapshot(input.learnerId);
    if (input.isCorrect) {
      snapshot.quizMastery[input.sourceLessonItemId] = true;
    }

    const streak = computeNewStreak(snapshot.lastStudyDate, snapshot.streakDays);
    snapshot.lastStudyDate = streak.date;
    snapshot.streakDays = streak.streakDays;
    return;
  }

  await initSchemaIfNeeded();

  const progressResult = await db.query(
    `SELECT streak_days, last_study_date, quiz_mastery_json
     FROM learner_progress
     WHERE learner_id = $1`,
    [input.learnerId]
  );

  const row = progressResult.rows[0] as
    | {
        streak_days: number;
        last_study_date: string | null;
        quiz_mastery_json: Record<string, boolean>;
      }
    | undefined;

  const existingQuizMastery = row?.quiz_mastery_json ?? {};
  if (input.isCorrect) {
    existingQuizMastery[input.sourceLessonItemId] = true;
  }

  const streak = computeNewStreak(row?.last_study_date ?? undefined, row?.streak_days ?? 0);

  await db.query(
    `INSERT INTO learner_progress (learner_id, streak_days, last_study_date, quiz_mastery_json)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (learner_id)
     DO UPDATE SET streak_days = EXCLUDED.streak_days,
                   last_study_date = EXCLUDED.last_study_date,
                   quiz_mastery_json = EXCLUDED.quiz_mastery_json`,
    [input.learnerId, streak.streakDays, streak.date, JSON.stringify(existingQuizMastery)]
  );
}

export async function getProgressSummary(learnerId: string): Promise<ProgressSummary> {
  const db = getPool();

  if (!db) {
    const snapshot = getOrCreateMemorySnapshot(learnerId);
    const unitProgress = buildUnitProgress(snapshot.quizMastery);

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
      completedItems: countCompletedCheckpoints(unitProgress),
      totalItems: countTotalCheckpoints(unitProgress),
      unitProgress,
      weakPhrases
    };
  }

  await initSchemaIfNeeded();

  const [progressResult, attemptResult] = await Promise.all([
    db.query(`SELECT streak_days, quiz_mastery_json FROM learner_progress WHERE learner_id = $1`, [learnerId]),
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
    | {
        streak_days: number;
        quiz_mastery_json: Record<string, boolean>;
      }
    | undefined;

  const quizMastery = progressRow?.quiz_mastery_json ?? {};
  const unitProgress = buildUnitProgress(quizMastery);

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
    completedItems: countCompletedCheckpoints(unitProgress),
    totalItems: countTotalCheckpoints(unitProgress),
    unitProgress,
    weakPhrases
  };
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { getLessonById } from "@/lib/curriculum";
import { getLearnerIdFromHeaders } from "@/lib/identity";
import { recordQuizResult } from "@/lib/storage";

const quizSchema = z.object({
  lessonItemId: z.string().min(1),
  unitId: z.number().int().min(1).max(6),
  isCorrect: z.boolean()
});

export async function POST(request: Request) {
  try {
    const learnerId = getLearnerIdFromHeaders(request.headers);
    const payload = quizSchema.parse(await request.json());

    const lesson = getLessonById(payload.lessonItemId);
    if (!lesson) {
      return NextResponse.json({ error: "Unknown lesson item" }, { status: 404 });
    }

    if (lesson.unit !== payload.unitId) {
      return NextResponse.json({ error: "Lesson and unit mismatch" }, { status: 400 });
    }

    await recordQuizResult({
      learnerId,
      unitId: payload.unitId,
      sourceLessonItemId: payload.lessonItemId,
      isCorrect: payload.isCorrect
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save quiz result";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

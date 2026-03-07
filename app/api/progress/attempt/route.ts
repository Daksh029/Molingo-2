import { NextResponse } from "next/server";
import { z } from "zod";
import { getLessonById } from "@/lib/curriculum";
import { getLearnerIdFromHeaders } from "@/lib/identity";
import { recordAttempt } from "@/lib/storage";

const attemptSchema = z.object({
  lessonItemId: z.string().min(1),
  unitId: z.number().int().min(1).max(6),
  status: z.enum(["pass", "almost", "retry"]),
  confidence: z.number().min(0).max(1),
  transcript: z.string(),
  feedback: z.string()
});

export async function POST(request: Request) {
  try {
    const learnerId = getLearnerIdFromHeaders(request.headers);
    const payload = attemptSchema.parse(await request.json());

    const lesson = getLessonById(payload.lessonItemId);
    if (!lesson) {
      return NextResponse.json({ error: "Unknown lesson item" }, { status: 404 });
    }

    await recordAttempt({
      learnerId,
      ...payload
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save attempt";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

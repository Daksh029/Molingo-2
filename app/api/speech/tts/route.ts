import { NextResponse } from "next/server";
import { z } from "zod";
import { getLessonById } from "@/lib/curriculum";
import { synthesizeGujaratiSpeech } from "@/lib/openai";

const ttsSchema = z.object({
  lessonItemId: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const { lessonItemId } = ttsSchema.parse(await request.json());
    const lesson = getLessonById(lessonItemId);

    if (!lesson) {
      return NextResponse.json({ error: "Unknown lesson item" }, { status: 404 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        {
          error: "OPENAI_API_KEY is missing. Client should use browser speech synthesis fallback."
        },
        { status: 503 }
      );
    }

    const audio = await synthesizeGujaratiSpeech(lesson.target_audio_text);
    return new NextResponse(audio, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "TTS failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

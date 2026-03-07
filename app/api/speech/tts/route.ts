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
      const silent = new Uint8Array([73, 68, 51, 3, 0, 0, 0, 0, 0, 0]);
      return new NextResponse(silent, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store"
        }
      });
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

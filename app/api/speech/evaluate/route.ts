import { NextResponse } from "next/server";
import { z } from "zod";
import { getLessonById } from "@/lib/curriculum";
import { evaluatePronunciation } from "@/lib/scoring";
import { transcribeAudioFromBase64 } from "@/lib/openai";

const evaluateSchema = z.object({
  lessonItemId: z.string().min(1),
  audioBase64: z.string().optional(),
  mimeType: z.string().optional().default("audio/webm"),
  mockTranscript: z.string().optional()
});

export async function POST(request: Request) {
  try {
    const body = evaluateSchema.parse(await request.json());
    const lesson = getLessonById(body.lessonItemId);
    if (!lesson) {
      return NextResponse.json({ error: "Unknown lesson item" }, { status: 404 });
    }

    let transcript = body.mockTranscript?.trim();

    if (!transcript) {
      if (!body.audioBase64) {
        return NextResponse.json({ error: "audioBase64 or mockTranscript is required" }, { status: 400 });
      }

      if (process.env.OPENAI_API_KEY) {
        transcript = await transcribeAudioFromBase64(body.audioBase64, body.mimeType);
      } else {
        transcript = lesson.romanized_gujarati;
      }
    }

    const evaluation = evaluatePronunciation(body.lessonItemId, transcript);

    return NextResponse.json({
      ...evaluation,
      transcript
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

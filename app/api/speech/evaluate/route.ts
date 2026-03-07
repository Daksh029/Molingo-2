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

    if (body.audioBase64 && process.env.OPENAI_API_KEY) {
      try {
        transcript = await transcribeAudioFromBase64(body.audioBase64, body.mimeType, lesson.romanized_gujarati);
      } catch (error) {
        if (!transcript) {
          throw error;
        }
      }
    }

    if (!transcript) {
      if (!body.audioBase64 && !body.mockTranscript) {
        return NextResponse.json({ error: "audioBase64 or mockTranscript is required" }, { status: 400 });
      }

      if (!process.env.OPENAI_API_KEY && !body.mockTranscript) {
        return NextResponse.json(
          {
            error:
              "Speech scoring requires OPENAI_API_KEY or browser transcript fallback. Use a Chromium browser and retry."
          },
          { status: 503 }
        );
      }
    }

    if (!transcript) {
      return NextResponse.json({ error: "Could not capture a transcript. Try speaking again." }, { status: 400 });
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

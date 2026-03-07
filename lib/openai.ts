const OPENAI_BASE_URL = "https://api.openai.com/v1";

function getApiKey(): string {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
  return key;
}

export async function transcribeAudioFromBase64(
  audioBase64: string,
  mimeType: string,
  phraseHint?: string
): Promise<string> {
  const apiKey = getApiKey();
  const byteChars = Buffer.from(audioBase64, "base64");
  const formData = new FormData();
  const ext = mimeType.includes("webm") ? "webm" : "wav";
  formData.append("file", new Blob([byteChars], { type: mimeType }), `speech.${ext}`);
  formData.append("model", "gpt-4o-mini-transcribe");
  if (phraseHint) {
    formData.append("prompt", `Expected Gujarati phrase (romanized): ${phraseHint}`);
  }

  const response = await fetch(`${OPENAI_BASE_URL}/audio/transcriptions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: formData
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI transcription failed: ${response.status} ${body}`);
  }

  const data = (await response.json()) as { text?: string };
  if (!data.text) {
    throw new Error("OpenAI transcription returned no text");
  }

  return data.text;
}

export async function synthesizeGujaratiSpeech(text: string): Promise<ArrayBuffer> {
  const apiKey = getApiKey();
  const response = await fetch(`${OPENAI_BASE_URL}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: "sage",
      format: "mp3",
      input: text
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI TTS failed: ${response.status} ${body}`);
  }

  return response.arrayBuffer();
}

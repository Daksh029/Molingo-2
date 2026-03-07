"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LessonItem, SpeechStatus, Unit } from "@/lib/types";
import { generateLocalLearnerId } from "@/lib/identity";

type EvalResponse = {
  status: SpeechStatus;
  confidence: number;
  transcript: string;
  feedback: string;
  nextAction: "continue" | "retry";
};

function getLearnerId(): string {
  const key = "molingo_learner_id";
  if (typeof window === "undefined") {
    return "molingo-local-learner";
  }

  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const fresh = generateLocalLearnerId();
  window.localStorage.setItem(key, fresh);
  return fresh;
}

export function LessonPlayer({ unit, items }: { unit: Unit; items: LessonItem[] }) {
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<EvalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const current = items[index];
  const learnerId = useMemo(() => getLearnerId(), []);

  const enqueueAttempt = useCallback((payload: object) => {
    const storageKey = "molingo_attempt_queue";
    const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as object[];
    existing.push(payload);
    window.localStorage.setItem(storageKey, JSON.stringify(existing));
    setQueueCount(existing.length);
  }, []);

  const flushQueue = useCallback(async () => {
    const storageKey = "molingo_attempt_queue";
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setQueueCount(0);
      return;
    }

    const queue = JSON.parse(raw) as object[];
    if (!queue.length) {
      setQueueCount(0);
      return;
    }

    const remaining: object[] = [];
    for (const attempt of queue) {
      try {
        const response = await fetch("/api/progress/attempt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-learner-id": learnerId
          },
          body: JSON.stringify(attempt)
        });
        if (!response.ok) {
          remaining.push(attempt);
        }
      } catch {
        remaining.push(attempt);
      }
    }

    window.localStorage.setItem(storageKey, JSON.stringify(remaining));
    setQueueCount(remaining.length);
  }, [learnerId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pending = JSON.parse(window.localStorage.getItem("molingo_attempt_queue") ?? "[]") as object[];
    setQueueCount(pending.length);

    void flushQueue();
    const handler = () => {
      void flushQueue();
    };

    window.addEventListener("online", handler);
    return () => {
      window.removeEventListener("online", handler);
    };
  }, [flushQueue]);

  const playTargetAudio = useCallback(async () => {
    try {
      const res = await fetch("/api/speech/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonItemId: current.id })
      });
      if (!res.ok) {
        throw new Error("Unable to play audio right now.");
      }
      const arrayBuffer = await res.arrayBuffer();
      const blob = new Blob([arrayBuffer], { type: "audio/mpeg" });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      void audio.play();
      audio.onended = () => URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio playback failed.");
    }
  }, [current.id]);

  const startRecording = useCallback(async () => {
    setError(null);
    setResult(null);

    if (typeof window === "undefined" || !("MediaRecorder" in window)) {
      setError("This browser does not support voice recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const base64 = await blobToBase64(blob);

        try {
          const evalRes = await fetch("/api/speech/evaluate", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-learner-id": learnerId
            },
            body: JSON.stringify({
              lessonItemId: current.id,
              audioBase64: base64,
              mimeType: "audio/webm"
            })
          });

          const data = (await evalRes.json()) as EvalResponse;
          setResult(data);

          const attemptPayload = {
            lessonItemId: current.id,
            unitId: current.unit,
            status: data.status,
            confidence: data.confidence,
            transcript: data.transcript,
            feedback: data.feedback
          };

          try {
            const saveRes = await fetch("/api/progress/attempt", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-learner-id": learnerId
              },
              body: JSON.stringify(attemptPayload)
            });

            if (!saveRes.ok) {
              enqueueAttempt(attemptPayload);
            }
          } catch {
            enqueueAttempt(attemptPayload);
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not evaluate pronunciation.");
        } finally {
          stream.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission is required for speaking practice.");
    }
  }, [current.id, current.unit, enqueueAttempt, learnerId]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      return;
    }

    recorder.stop();
    setRecording(false);
  }, []);

  const nextLesson = useCallback(() => {
    setResult(null);
    setError(null);
    setIndex((prev) => Math.min(prev + 1, items.length - 1));
  }, [items.length]);

  return (
    <section className="molingo-card animate-pop" style={{ padding: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>
          {unit.theme} with {unit.mascot}
        </h2>
        <div style={{ fontWeight: 700 }}>Step {index + 1} / {items.length}</div>
      </div>

      <div style={{ marginTop: 14, marginBottom: 14, height: 12, background: "#eff4f7", borderRadius: 999 }}>
        <div
          style={{
            width: `${((index + 1) / items.length) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: unit.color,
            transition: "width 0.25s ease"
          }}
        />
      </div>

      <div
        style={{
          padding: 18,
          borderRadius: 16,
          background: "linear-gradient(180deg, #fff 0%, #f4fbff 100%)",
          border: "2px solid rgba(31, 50, 66, 0.08)"
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Say in Gujarati</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{current.english_text}</div>
        <div style={{ marginTop: 8, fontSize: 20, color: "#2b70c9", fontWeight: 700 }}>{current.romanized_gujarati}</div>
        <div style={{ marginTop: 8, opacity: 0.76 }}>Coach tip: {current.coach_tip}</div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={() => void playTargetAudio()}
          style={buttonStyle("#1cb0f6")}
          type="button"
        >
          Play Audio
        </button>

        {!recording ? (
          <button onClick={() => void startRecording()} style={buttonStyle("#43b04a")} type="button">
            Record & Speak
          </button>
        ) : (
          <button onClick={stopRecording} style={buttonStyle("#ff4b4b")} type="button">
            Stop Recording
          </button>
        )}

        <button
          onClick={nextLesson}
          style={buttonStyle("#ff9600")}
          type="button"
          disabled={index === items.length - 1}
        >
          Continue
        </button>
      </div>

      {error ? (
        <p style={{ color: "#ff4b4b", fontWeight: 700, marginTop: 14 }}>{error}</p>
      ) : null}

      {result ? (
        <div
          style={{
            marginTop: 14,
            borderRadius: 14,
            padding: 14,
            border: "2px solid rgba(31, 50, 66, 0.12)",
            background: result.status === "pass" ? "#e5f9ea" : result.status === "almost" ? "#fff3dd" : "#ffe7e7"
          }}
        >
          <div style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>
            {result.status} ({Math.round(result.confidence * 100)}%)
          </div>
          <p style={{ margin: "8px 0 2px" }}>{result.feedback}</p>
          <div style={{ fontSize: 14, opacity: 0.75 }}>Heard: {result.transcript || "(no speech captured)"}</div>
        </div>
      ) : null}

      <div style={{ marginTop: 16, fontSize: 14, opacity: 0.75 }}>
        Offline queue: {queueCount} unsynced attempts.
      </div>
    </section>
  );
}

function buttonStyle(color: string): React.CSSProperties {
  return {
    background: color,
    color: "white",
    border: "none",
    borderRadius: 14,
    padding: "11px 16px",
    fontSize: 16,
    fontWeight: 800,
    cursor: "pointer"
  };
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

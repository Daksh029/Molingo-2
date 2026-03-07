"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildLessonFlow } from "@/lib/lesson-flow";
import { LessonItem, SpeechStatus, Unit } from "@/lib/types";

type EvalResponse = {
  status: SpeechStatus;
  confidence: number;
  transcript: string;
  feedback: string;
  nextAction: "continue" | "retry";
};

type SpeechRecognitionResultLike = {
  0: { transcript: string };
  length: number;
  isFinal: boolean;
};

type SpeechRecognitionEventLike = Event & {
  results: ArrayLike<SpeechRecognitionResultLike>;
};

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

type ConfettiPiece = {
  id: string;
  left: number;
  delay: number;
  duration: number;
  drift: number;
  size: number;
  color: string;
};

const mascotEmoji: Record<number, string> = {
  1: "🦦",
  2: "🐼",
  3: "🦊",
  4: "🐰",
  5: "🐨",
  6: "🐧"
};

const praiseLines = [
  "Great job Morgan!",
  "Very good Morgan!",
  "Congratulations Morgan!",
  "Outstanding work Morgan!",
  "You crushed it Morgan!",
  "Brilliant effort Morgan!"
] as const;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") {
    return null;
  }

  const w = window as Window & {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };

  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return window.btoa(binary);
}

function randomPraiseForMorgan(): string {
  return praiseLines[Math.floor(Math.random() * praiseLines.length)];
}

function createConfetti(seed: number, count = 44): ConfettiPiece[] {
  const colors = ["#ff4b4b", "#ffd85f", "#1cb0f6", "#43b04a", "#ce82ff", "#ff9600"];

  return Array.from({ length: count }, (_, index) => ({
    id: `${seed}-${index}`,
    left: Math.random() * 100,
    delay: Math.random() * 0.5,
    duration: 1.6 + Math.random() * 1.3,
    drift: (Math.random() - 0.5) * 180,
    size: 6 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)]
  }));
}

export function LessonPlayer({ unit, items }: { unit: Unit; items: LessonItem[] }) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [recording, setRecording] = useState(false);
  const [result, setResult] = useState<EvalResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState(0);
  const [quizQueueCount, setQuizQueueCount] = useState(0);
  const [quizSelected, setQuizSelected] = useState<string | null>(null);
  const [quizSolved, setQuizSolved] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationLine, setCelebrationLine] = useState<string>("Great job Morgan!");
  const [confettiSeed, setConfettiSeed] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const speechRecognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const transitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const browserTranscriptRef = useRef("");
  const chunksRef = useRef<Blob[]>([]);

  const steps = useMemo(() => buildLessonFlow(items, 5), [items]);
  const currentStep = steps[index];
  const currentLessonItem = currentStep?.kind === "learn" ? currentStep.item : null;
  const confettiPieces = useMemo(() => createConfetti(confettiSeed), [confettiSeed]);
  const learnerId = "molingo-local-learner";

  const routeToNextPath = useCallback(() => {
    const nextUnitId = unit.id + 1;
    if (nextUnitId <= 6) {
      router.push(`/learn/${nextUnitId}`);
    } else {
      router.push("/");
    }
  }, [router, unit.id]);

  const enqueueAttempt = useCallback((payload: object) => {
    const storageKey = "molingo_attempt_queue";
    const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as object[];
    existing.push(payload);
    window.localStorage.setItem(storageKey, JSON.stringify(existing));
    setQueueCount(existing.length);
  }, []);

  const enqueueQuizResult = useCallback((payload: object) => {
    const storageKey = "molingo_quiz_queue";
    const existing = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]") as object[];
    existing.push(payload);
    window.localStorage.setItem(storageKey, JSON.stringify(existing));
    setQuizQueueCount(existing.length);
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

  const flushQuizQueue = useCallback(async () => {
    const storageKey = "molingo_quiz_queue";
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      setQuizQueueCount(0);
      return;
    }

    const queue = JSON.parse(raw) as object[];
    if (!queue.length) {
      setQuizQueueCount(0);
      return;
    }

    const remaining: object[] = [];
    for (const quizPayload of queue) {
      try {
        const response = await fetch("/api/progress/quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-learner-id": learnerId
          },
          body: JSON.stringify(quizPayload)
        });

        if (!response.ok) {
          remaining.push(quizPayload);
        }
      } catch {
        remaining.push(quizPayload);
      }
    }

    window.localStorage.setItem(storageKey, JSON.stringify(remaining));
    setQuizQueueCount(remaining.length);
  }, [learnerId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const pending = JSON.parse(window.localStorage.getItem("molingo_attempt_queue") ?? "[]") as object[];
    const pendingQuiz = JSON.parse(window.localStorage.getItem("molingo_quiz_queue") ?? "[]") as object[];

    setQueueCount(pending.length);
    setQuizQueueCount(pendingQuiz.length);
    void flushQueue();
    void flushQuizQueue();

    const handler = () => {
      void flushQueue();
      void flushQuizQueue();
    };

    window.addEventListener("online", handler);
    return () => {
      window.removeEventListener("online", handler);
    };
  }, [flushQueue, flushQuizQueue]);

  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return;
    }

    window.speechSynthesis.getVoices();
  }, []);

  useEffect(
    () => () => {
      transitionTimeoutRef.current && clearTimeout(transitionTimeoutRef.current);
      speechRecognitionRef.current?.stop();
      mediaRecorderRef.current?.stop();
      audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    },
    []
  );

  const browserSpeak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      throw new Error("Audio is unavailable in this browser.");
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "gu-IN";
    utterance.rate = 0.92;
    utterance.pitch = 1.04;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, []);

  const playTargetAudio = useCallback(() => {
    if (!currentLessonItem || showCelebration) {
      return;
    }

    setError(null);

    try {
      browserSpeak(currentLessonItem.target_audio_text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Audio playback failed.");
    }
  }, [browserSpeak, currentLessonItem, showCelebration]);

  const submitQuizProgress = useCallback(
    async (lessonItemId: string, isCorrect: boolean) => {
      const payload = {
        lessonItemId,
        unitId: unit.id,
        isCorrect
      };

      try {
        const response = await fetch("/api/progress/quiz", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-learner-id": learnerId
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          enqueueQuizResult(payload);
        }
      } catch {
        enqueueQuizResult(payload);
      }
    },
    [enqueueQuizResult, learnerId, unit.id]
  );

  const startSpeechRecognition = useCallback(() => {
    const ctor = getRecognitionCtor();
    if (!ctor) {
      speechRecognitionRef.current = null;
      browserTranscriptRef.current = "";
      return;
    }

    const recognition = new ctor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.lang = "gu-IN";
    recognition.onresult = (event) => {
      const transcripts: string[] = [];
      for (let i = 0; i < event.results.length; i += 1) {
        const candidate = event.results[i]?.[0]?.transcript;
        if (candidate) {
          transcripts.push(candidate);
        }
      }
      browserTranscriptRef.current = transcripts.join(" ").trim();
    };
    recognition.start();
    speechRecognitionRef.current = recognition;
  }, []);

  const submitEvaluation = useCallback(
    async (lesson: LessonItem, audioBase64?: string, mockTranscript?: string) => {
      const payload: {
        lessonItemId: string;
        mimeType: string;
        audioBase64?: string;
        mockTranscript?: string;
      } = {
        lessonItemId: lesson.id,
        mimeType: "audio/webm"
      };

      if (audioBase64) {
        payload.audioBase64 = audioBase64;
      }
      if (mockTranscript && mockTranscript.trim()) {
        payload.mockTranscript = mockTranscript.trim();
      }

      if (!payload.audioBase64 && !payload.mockTranscript) {
        throw new Error("No speech input captured. Please try again.");
      }

      const evalRes = await fetch("/api/speech/evaluate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-learner-id": learnerId
        },
        body: JSON.stringify(payload)
      });

      const body = (await evalRes.json()) as EvalResponse | { error?: string };
      if (!evalRes.ok) {
        throw new Error((body as { error?: string }).error ?? "Could not evaluate pronunciation.");
      }

      const data = body as EvalResponse;
      setResult(data);

      const attemptPayload = {
        lessonItemId: lesson.id,
        unitId: lesson.unit,
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
    },
    [enqueueAttempt, learnerId]
  );

  const startRecording = useCallback(async () => {
    if (!currentLessonItem || showCelebration) {
      return;
    }

    setError(null);
    setResult(null);
    browserTranscriptRef.current = "";
    chunksRef.current = [];

    startSpeechRecognition();

    if (typeof window === "undefined" || !("MediaRecorder" in window)) {
      setError("Audio recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStreamRef.current = stream;
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        try {
          speechRecognitionRef.current?.stop();
          await new Promise((resolve) => setTimeout(resolve, 300));

          let audioBase64: string | undefined;
          if (chunksRef.current.length > 0) {
            const blob = new Blob(chunksRef.current, { type: "audio/webm" });
            audioBase64 = await blobToBase64(blob);
          }

          const transcript = browserTranscriptRef.current.trim();
          await submitEvaluation(currentLessonItem, audioBase64, transcript);
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not evaluate pronunciation.");
        } finally {
          audioStreamRef.current?.getTracks().forEach((track) => track.stop());
          audioStreamRef.current = null;
          setRecording(false);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("Microphone permission is required for speaking practice.");
    }
  }, [currentLessonItem, showCelebration, startSpeechRecognition, submitEvaluation]);

  const stopRecording = useCallback(() => {
    speechRecognitionRef.current?.stop();

    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      setRecording(false);
      return;
    }

    if (recorder.state !== "inactive") {
      recorder.stop();
    } else {
      setRecording(false);
    }
  }, []);

  const chooseQuizAnswer = useCallback(
    (choice: string) => {
      if (!currentStep || currentStep.kind !== "quiz" || showCelebration) {
        return;
      }

      setError(null);
      setQuizSelected(choice);
      const isCorrect = choice === currentStep.correctAnswer;
      void submitQuizProgress(currentStep.sourceItemId, isCorrect);

      if (isCorrect) {
        setQuizSolved(true);
        setQuizFeedback("Correct. You nailed this checkpoint.");
      } else {
        setQuizSolved(false);
        setQuizFeedback(`Not quite. Correct answer: ${currentStep.correctAnswer}`);
      }
    },
    [currentStep, showCelebration, submitQuizProgress]
  );

  const clearStepFeedback = useCallback(() => {
    setError(null);
    setResult(null);
    setQuizSelected(null);
    setQuizSolved(false);
    setQuizFeedback(null);
  }, []);

  const goToStep = useCallback(
    (targetIndex: number) => {
      if (showCelebration) {
        return;
      }

      clearStepFeedback();
      const clamped = Math.max(0, Math.min(targetIndex, steps.length - 1));
      setIndex(clamped);
    },
    [clearStepFeedback, showCelebration, steps.length]
  );

  const goBack = useCallback(() => {
    goToStep(index - 1);
  }, [goToStep, index]);

  const nextStep = useCallback(() => {
    if (showCelebration) {
      return;
    }

    clearStepFeedback();

    if (index >= steps.length - 1) {
      const isFinalCorrectQuiz = currentStep?.kind === "quiz" && quizSolved;

      if (isFinalCorrectQuiz) {
        setCelebrationLine(randomPraiseForMorgan());
        setConfettiSeed((prev) => prev + 1);
        setShowCelebration(true);
        transitionTimeoutRef.current && clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = setTimeout(() => {
          routeToNextPath();
        }, 2400);
        return;
      }

      routeToNextPath();
      return;
    }

    setIndex((prev) => Math.min(prev + 1, steps.length - 1));
  }, [clearStepFeedback, currentStep, index, quizSolved, routeToNextPath, showCelebration, steps.length]);

  if (!currentStep) {
    return (
      <section className="molingo-card animate-pop" style={{ padding: 20 }}>
        <h2 style={{ marginTop: 0 }}>No lesson steps available.</h2>
      </section>
    );
  }

  const canContinue = currentStep.kind === "learn" || quizSolved;
  const mascot = mascotEmoji[unit.id] ?? "🐾";

  return (
    <section className="molingo-card animate-pop lesson-shell" style={{ padding: 20, position: "relative", overflow: "hidden" }}>
      {showCelebration ? (
        <div className="celebration-overlay">
          <div className="celebration-confetti-layer">
            {confettiPieces.map((piece) => (
              <span
                key={piece.id}
                className="celebration-confetti"
                style={{
                  left: `${piece.left}%`,
                  width: piece.size,
                  height: piece.size * 0.6,
                  background: piece.color,
                  animationDelay: `${piece.delay}s`,
                  animationDuration: `${piece.duration}s`,
                  ["--confetti-drift" as string]: `${piece.drift}px`
                }}
              />
            ))}
          </div>
          <div className="molingo-card celebration-card animate-pop">
            <div style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }}>🎉</div>
            <h3 style={{ margin: 0 }}>Path Completed</h3>
            <p style={{ margin: "8px 0 0", fontSize: 22, fontWeight: 900 }}>{celebrationLine}</p>
            <p style={{ margin: "8px 0 0", opacity: 0.75 }}>Loading your next path...</p>
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ margin: 0 }}>
          {unit.theme} with {unit.mascot}
        </h2>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <Chip tone={unit.color} label={`Step ${index + 1}/${steps.length}`} />
        </div>
      </div>

      <div style={{ marginTop: 14, marginBottom: 14, height: 12, background: "#eff4f7", borderRadius: 999 }}>
        <div
          className="lesson-progress-fill"
          style={{
            width: `${((index + 1) / steps.length) * 100}%`,
            height: "100%",
            borderRadius: 999,
            background: unit.color,
            transition: "width 0.25s ease"
          }}
        />
      </div>

      <div className="step-navigator-wrap">
        <div style={{ fontSize: 13, fontWeight: 800, opacity: 0.78, marginBottom: 8 }}>
          Jump to question (green = test checkpoint)
        </div>
        <div className="step-navigator-grid">
          {steps.map((step, stepIndex) => {
            const isCurrent = stepIndex === index;
            const isQuiz = step.kind === "quiz";
            const navClass = [
              "step-nav-btn",
              isQuiz ? "step-nav-quiz" : "",
              isCurrent ? "step-nav-current" : ""
            ]
              .join(" ")
              .trim();

            return (
              <button
                key={step.id}
                type="button"
                className={navClass}
                onClick={() => goToStep(stepIndex)}
                disabled={showCelebration}
                title={isQuiz ? `Question ${stepIndex + 1}: test checkpoint` : `Question ${stepIndex + 1}`}
              >
                {stepIndex + 1}
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="lesson-mascot-panel"
        style={{
          borderRadius: 18,
          padding: 14,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "linear-gradient(120deg, #fffaf0 0%, #eef9ff 100%)",
          border: "2px solid rgba(31, 50, 66, 0.1)"
        }}
      >
        <div className="mascot-bounce" style={{ fontSize: 52, lineHeight: 1 }}>
          {mascot}
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>{unit.mascot} is here to coach you.</div>
          <div style={{ opacity: 0.78 }}>
            {currentStep.kind === "learn"
              ? "Listen, repeat, and nail the pronunciation."
              : "Checkpoint quiz: pick the correct Gujarati phrase."}
          </div>
        </div>
      </div>

      <div key={currentStep.id} className="lesson-step-pop">
        {currentStep.kind === "learn" ? (
          <div
            className="question-card"
            style={{
              padding: 18,
              borderRadius: 16,
              background: "linear-gradient(180deg, #fff 0%, #f4fbff 100%)",
              border: "2px solid rgba(31, 50, 66, 0.08)"
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Say in Gujarati</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>{currentStep.item.english_text}</div>
            <div style={{ marginTop: 8, fontSize: 20, color: "#2b70c9", fontWeight: 700 }}>
              {currentStep.item.romanized_gujarati}
            </div>
            <div style={{ marginTop: 8, opacity: 0.76 }}>Coach tip: {currentStep.item.coach_tip}</div>
          </div>
        ) : (
          <div
            className="question-card"
            style={{
              padding: 18,
              borderRadius: 16,
              background: "linear-gradient(180deg, #fff 0%, #f4fbff 100%)",
              border: "2px solid rgba(31, 50, 66, 0.08)"
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.7, marginBottom: 8 }}>Checkpoint Quiz</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{currentStep.prompt}</div>
            <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
              {currentStep.choices.map((choice) => {
                const selected = choice === quizSelected;
                const correct = choice === currentStep.correctAnswer;
                const bg = selected ? (correct ? "#e5f9ea" : "#ffe7e7") : "#ffffff";
                const quizClass = selected ? (correct ? "quiz-option quiz-correct" : "quiz-option quiz-wrong") : "quiz-option";

                return (
                  <button
                    key={choice}
                    type="button"
                    onClick={() => chooseQuizAnswer(choice)}
                    className={quizClass}
                    style={{
                      borderRadius: 12,
                      border: "2px solid rgba(31, 50, 66, 0.12)",
                      padding: "11px 12px",
                      textAlign: "left",
                      fontSize: 18,
                      fontWeight: 700,
                      background: bg,
                      cursor: "pointer"
                    }}
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            {quizFeedback ? <p style={{ marginBottom: 0, fontWeight: 700 }}>{quizFeedback}</p> : null}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
        <button
          onClick={goBack}
          className="molingo-btn"
          style={buttonStyle("#2b70c9")}
          type="button"
          disabled={index === 0 || showCelebration}
        >
          Back
        </button>

        {currentStep.kind === "learn" ? (
          <>
            <button onClick={playTargetAudio} className="molingo-btn" style={buttonStyle("#1cb0f6")} type="button">
              Play Audio
            </button>

            {!recording ? (
              <button onClick={() => void startRecording()} className="molingo-btn" style={buttonStyle("#43b04a")} type="button">
                Record & Speak
              </button>
            ) : (
              <button onClick={stopRecording} className="molingo-btn" style={buttonStyle("#ff4b4b")} type="button">
                Stop Recording
              </button>
            )}
          </>
        ) : null}

        <button
          onClick={nextStep}
          className="molingo-btn"
          style={buttonStyle("#ff9600")}
          type="button"
          disabled={!canContinue || showCelebration}
        >
          {index === steps.length - 1 ? (unit.id < 6 ? "Continue to Next Path" : "Finish") : "Continue"}
        </button>
      </div>

      {error ? <p style={{ color: "#ff4b4b", fontWeight: 700, marginTop: 14 }}>{error}</p> : null}

      {result ? (
        <div
          className="feedback-card"
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
        Offline queue: {queueCount} speech items, {quizQueueCount} quiz items.
      </div>
    </section>
  );
}

function Chip({ label, tone }: { label: string; tone: string }) {
  return (
    <div
      style={{
        borderRadius: 999,
        padding: "5px 10px",
        fontWeight: 800,
        color: "white",
        background: tone,
        fontSize: 13
      }}
    >
      {label}
    </div>
  );
}

function buttonStyle(color: string): CSSProperties {
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

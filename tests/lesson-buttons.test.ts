// @vitest-environment jsdom
import { Blob as NodeBlob } from "node:buffer";
import { createElement } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LessonPlayer } from "@/components/LessonPlayer";
import { units, getLessonsByUnit } from "@/lib/curriculum";
import { buildLessonFlow } from "@/lib/lesson-flow";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh: vi.fn() }) }));

function openChapter(id = 1) {
  return render(createElement(LessonPlayer, { unit: units[id - 1], items: getLessonsByUnit(id) }));
}
const button = (name: string) => screen.getByRole("button", { name }) as HTMLButtonElement;

beforeEach(() => {
  push.mockReset();
  localStorage.clear();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  vi.stubGlobal("speechSynthesis", { getVoices: () => [], cancel: vi.fn(), speak: vi.fn() });
  vi.stubGlobal("SpeechSynthesisUtterance", class { constructor(public text: string) {} });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn() } });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("lesson buttons without an external API", () => {
  for (const unit of units) {
    it(`navigates every step and handles quiz choices in chapter ${unit.id}`, async () => {
      openChapter(unit.id);
      expect(button("Back").disabled).toBe(true);
      fireEvent.click(button("Continue"));
      expect(screen.getByText("Step 2/24")).toBeTruthy();
      fireEvent.click(button("Back"));
      expect(screen.getByText("Step 1/24")).toBeTruthy();
      const flow = buildLessonFlow(getLessonsByUnit(unit.id));
      for (let index = 0; index < flow.length; index++) {
        fireEvent.click(button(String(index + 1)));
        expect(screen.getByText(`Step ${index + 1}/${flow.length}`)).toBeTruthy();
        const step = flow[index];
        if (step.kind !== "quiz") continue;
        const continueName = index === flow.length - 1 ? (unit.id < 6 ? "Continue to Next Path" : "Finish") : "Continue";
        expect(button(continueName).disabled).toBe(true);
        fireEvent.click(button(step.choices.find(choice => choice !== step.correctAnswer)!));
        await waitFor(() => expect(screen.queryByText("Saving checkpoint…")).toBeNull());
        expect(screen.getByRole("status").textContent).toContain("Not quite");
        expect(button(continueName).disabled).toBe(true);
        fireEvent.click(button(step.correctAnswer));
        await waitFor(() => expect(button(continueName).disabled).toBe(false));
        expect(button(step.correctAnswer).disabled).toBe(true);
      }
    });
  }

  it("plays browser audio without calling an external speech API", () => {
    openChapter();
    fireEvent.click(button("Play Audio"));
    expect(speechSynthesis.speak).toHaveBeenCalledOnce();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows playback errors rather than throwing", () => {
    vi.stubGlobal("speechSynthesis", undefined);
    openChapter();
    fireEvent.click(button("Play Audio"));
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("reports unsupported recording and leaves navigation usable", async () => {
    openChapter();
    fireEvent.click(button("Record & Speak"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("not supported"));
    expect(button("Continue").disabled).toBe(false);
    expect(button("Record & Speak").disabled).toBe(false);
  });

  it("handles denied microphone permission and permits retry", async () => {
    vi.stubGlobal("MediaRecorder", class {});
    navigator.mediaDevices.getUserMedia = vi.fn().mockRejectedValue(new DOMException("Denied", "NotAllowedError"));
    openChapter();
    fireEvent.click(button("Record & Speak"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("Microphone permission"));
    expect(button("Record & Speak").disabled).toBe(false);
    expect(button("Continue").disabled).toBe(false);
  });

  it("locks navigation during capture, stops the microphone, and handles missing speech input", async () => {
    const stopTrack = vi.fn();
    const stream = { getTracks: () => [{ stop: stopTrack }] };
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(stream);
    vi.stubGlobal("MediaRecorder", class {
      state = "inactive";
      onstop: (() => void) | null = null;
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; this.onstop?.(); }
    });
    // Browser speech recognition may exist but fail on startup.
    vi.stubGlobal("webkitSpeechRecognition", class { start() { throw new Error("Unavailable"); } stop() {} });
    openChapter();
    fireEvent.click(button("Record & Speak"));
    await waitFor(() => expect(button("Stop Recording")).toBeTruthy());
    expect(button("Continue").disabled).toBe(true);
    expect(button("6").disabled).toBe(true);
    fireEvent.click(button("Stop Recording"));
    expect(stopTrack).toHaveBeenCalled();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No speech input"));
    expect(button("Continue").disabled).toBe(false);
  });

  it("shows a missing-service message after recording and allows retry or continuing", async () => {
    vi.stubGlobal("Blob", NodeBlob);
    const stopTrack = vi.fn();
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    vi.stubGlobal("MediaRecorder", class {
      state = "inactive";
      onstop: (() => void) | null = null;
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      start() { this.state = "recording"; }
      stop() {
        this.state = "inactive";
        this.ondataavailable?.({ data: new Blob(["test audio"], { type: "audio/webm" }) });
        this.onstop?.();
      }
    });
    vi.mocked(fetch).mockResolvedValue({ ok: false, json: async () => ({ error: "Speech scoring is not connected yet." }) } as Response);
    openChapter();
    fireEvent.click(button("Record & Speak"));
    await waitFor(() => expect(button("Stop Recording")).toBeTruthy());
    fireEvent.click(button("Stop Recording"));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("not connected yet"));
    expect(stopTrack).toHaveBeenCalled();
    expect(button("Record & Speak").disabled).toBe(false);
    expect(button("Continue").disabled).toBe(false);
  });

  it("releases the microphone when leaving a lesson", async () => {
    const stopTrack = vi.fn();
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue({ getTracks: () => [{ stop: stopTrack }] });
    vi.stubGlobal("MediaRecorder", class {
      state = "inactive"; onstop: (() => void) | null = null;
      start() { this.state = "recording"; }
      stop() { this.state = "inactive"; this.onstop?.(); }
    });
    const view = openChapter();
    fireEvent.click(button("Record & Speak"));
    await waitFor(() => expect(button("Stop Recording")).toBeTruthy());
    view.unmount();
    expect(stopTrack).toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("queues quiz results when saving fails and still allows continuing", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("Offline"));
    openChapter();
    fireEvent.click(button("6"));
    const quiz = buildLessonFlow(getLessonsByUnit(1))[5];
    if (quiz.kind !== "quiz") throw new Error("Expected quiz");
    fireEvent.click(button(quiz.correctAnswer));
    await waitFor(() => expect(button("Continue").disabled).toBe(false));
    expect(JSON.parse(localStorage.getItem("molingo_quiz_queue")!)).toHaveLength(1);
    fireEvent.click(button("Continue"));
    expect(screen.getByText("Step 7/24")).toBeTruthy();
  });

  for (const id of [1, 6]) {
    it(`finishes chapter ${id} and routes to ${id === 6 ? "home" : "the next chapter"}`, async () => {
      openChapter(id);
      fireEvent.click(button("24"));
      const quiz = buildLessonFlow(getLessonsByUnit(id))[23];
      if (quiz.kind !== "quiz") throw new Error("Expected quiz");
      fireEvent.click(button(quiz.correctAnswer));
      const label = id === 6 ? "Finish" : "Continue to Next Path";
      await waitFor(() => expect(button(label).disabled).toBe(false));
      vi.useFakeTimers();
      fireEvent.click(button(label));
      expect(screen.getByText("Path Completed")).toBeTruthy();
      await act(async () => { vi.advanceTimersByTime(2400); });
      expect(push).toHaveBeenCalledWith(id === 6 ? "/" : "/learn/2");
    });
  }
});

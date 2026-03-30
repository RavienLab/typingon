import { create } from "zustand";
import type { Keystroke, WpmPoint } from "@/lib/typing/types";

/* ---------------- TYPES ---------------- */

export type PracticeMode = "english" | "numbers" | "code" | "hindi" | "marathi";

export type TypingResult = {
  stats: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    errors: number;
    durationMs: number;
  };
  practiceMode: PracticeMode;
  paragraph: string;
  keystrokes: Keystroke[];
};

type TypingState = {
  text: string;
  index: number;
  keystrokes: Keystroke[];
  errors: number;
  backspaces: number;
  startTime: number | null;
  finished: boolean;
  wpmTimeline: WpmPoint[];

  // 🆕 ATTEMPT (EXAM INTEGRITY)
  attemptId: string | null;
  setAttemptId: (id: string) => void;
  clearAttemptId: () => void;

  // UX
  focused: boolean;
  strictMode: boolean;
  flashInvalid: boolean;

  // keyboard feedback
  lastKey: string | null;
  lastCorrect: boolean | null;

  // RESULT
  lastResult: TypingResult | null;

  startTest: (text: string) => void;
  restartTest: () => void;
  input: (key: string) => void;
  setFocused: (v: boolean) => void;
  setLastResult: (r: TypingResult) => void;
  reset: () => void;
};

/* ---------------- CONSTANTS ---------------- */

const IGNORED_KEYS = new Set([
  "Shift",
  "Alt",
  "Control",
  "Meta",
  "Fn",
  "CapsLock",
  "Tab",
  "Escape",
  "ArrowUp",
  "ArrowDown", 
  "ArrowLeft",
  "ArrowRight",
]);

/* ---------------- STORE ---------------- */

export const useTypingStore = create<TypingState>((set, get) => ({
  text: "",
  index: 0,
  keystrokes: [],
  errors: 0,
  backspaces: 0,
  startTime: null,
  finished: false,
  wpmTimeline: [],

  // 🆕 Attempt
  attemptId: null,
  setAttemptId: (id) => set({ attemptId: id }),
  clearAttemptId: () => set({ attemptId: null }),

  focused: false,
  strictMode: false,
  flashInvalid: false,

  lastKey: null,
  lastCorrect: null,

  lastResult: null,

  /* ---------- START TEST ---------- */
  startTest: (text) =>
    set({
      text,
      index: 0,
      keystrokes: [],
      errors: 0,
      backspaces: 0,
      startTime: Date.now(),
      finished: false,
      wpmTimeline: [],
      flashInvalid: false,
      focused: true,
      lastKey: null,
      lastCorrect: null,
      attemptId: null, // 🔥 new test = new attempt
    }),

  restartTest: () => {
    const state = get();
    if (state.text) {
      state.startTest(state.text);
    }
  },

  setFocused: (v) => set({ focused: v }),

  setLastResult: (r) => set({ lastResult: r }),

  /* ---------- INPUT ---------- */

  input: (key) => {
    const {
      text,
      index,
      keystrokes,
      errors,
      backspaces,
      startTime,
      finished,
      focused,
      strictMode,
      wpmTimeline,
    } = get();

    if (!text || startTime === null || finished || !focused) return;

    if (
      IGNORED_KEYS.has(key) ||
      key.startsWith("F") ||
      (key.length > 1 && key !== "Backspace" && key !== "Enter")
    ) {
      set({ flashInvalid: true });
      setTimeout(() => set({ flashInvalid: false }), 120);
      return;
    }

    /* ----- BACKSPACE ----- */
    if (key === "Backspace") {
      if (keystrokes.length === 0) return;

      set({
        keystrokes: keystrokes.slice(0, -1),
        index: Math.max(0, index - 1),
        backspaces: backspaces + 1,
        lastKey: "Backspace",
        lastCorrect: true,
      });

      return;
    }

    if (index >= text.length) return;

    // auto skip newline
    if (text[index] === "\n") {
      set({ index: index + 1 });
      return;
    }

    const expected = text[index];
    const correct = key === expected;
    const now = Date.now();

    /* ----- STRICT MODE ----- */
    if (strictMode && !correct) {
      set({
        errors: errors + 1,
        flashInvalid: true,
        lastKey: key,
        lastCorrect: false,
      });

      setTimeout(() => set({ flashInvalid: false }), 120);
      return;
    }

    /* ----- RELAXED MODE ----- */

    const newKeystrokes: Keystroke[] = [
      ...keystrokes,
      { key, time: now, correct },
    ];

    const elapsedMs = now - startTime;
    const minutes = elapsedMs / 60000;
    const correctCount = newKeystrokes.filter((k) => k.correct).length;
    const wpm = minutes > 0 ? correctCount / 5 / minutes : 0;

    const nextIndex = index + 1;
    const done = nextIndex >= text.length;

    set({
      index: nextIndex,
      keystrokes: newKeystrokes,
      errors: correct ? errors : errors + 1,
      finished: done,
      lastKey: key,
      lastCorrect: correct,
      wpmTimeline: [...wpmTimeline, { t: elapsedMs, wpm: Math.round(wpm) }],
    });
  },

  /* ---------- RESET ---------- */

  reset: () =>
    set({
      text: "",
      index: 0,
      keystrokes: [],
      errors: 0,
      backspaces: 0,
      startTime: null,
      finished: false,
      wpmTimeline: [],
      flashInvalid: false,
      focused: false,
      lastKey: null,
      lastCorrect: null,
      lastResult: null,
      attemptId: null, // 🔥 clear attempt
    }),
}));

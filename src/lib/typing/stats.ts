/* ===============================
   Types
================================ */

export type InputType = "words" | "numbers" | "symbols" | "mixed";

export type ModeStats = {
  runs: number;
  errors: number;
  timeMs: number;
};

type StatsStore = Record<InputType, ModeStats>;

const STATS_KEY = "typingon:stats:v1";

/* ===============================
   Existing stats calculation
   (UNCHANGED)
================================ */

export function calculateStats(
  keystrokes: { time: number; correct: boolean }[],
  startTime: number
) {
  const durationMs =
    keystrokes.length > 0
      ? keystrokes[keystrokes.length - 1].time - startTime
      : 0;

  const minutes = durationMs / 60000;

  const chars = keystrokes.length;
  const correct = keystrokes.filter((k) => k.correct).length;

  const rawWpm = minutes > 0 ? chars / 5 / minutes : 0;
  const wpm = minutes > 0 ? correct / 5 / minutes : 0;
  const accuracy = chars > 0 ? (correct / chars) * 100 : 100;

  return {
    rawWpm: Math.round(rawWpm),
    wpm: Math.round(wpm),
    accuracy: Math.round(accuracy),
  };
}

/* ===============================
   Per-mode persistent stats
================================ */

function getEmptyStore(): StatsStore {
  return {
    words: { runs: 0, errors: 0, timeMs: 0 },
    numbers: { runs: 0, errors: 0, timeMs: 0 },
    symbols: { runs: 0, errors: 0, timeMs: 0 },
    mixed: { runs: 0, errors: 0, timeMs: 0 },
  };
}

export function loadModeStats(): StatsStore {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (!raw) return getEmptyStore();

    const parsed = JSON.parse(raw);
    return { ...getEmptyStore(), ...parsed };
  } catch {
    return getEmptyStore();
  }
}

export function saveModeRun(
  inputType: InputType,
  data: {
    errors: number;
    durationMs: number;
  }
) {
  const stats = loadModeStats();

  stats[inputType].runs += 1;
  stats[inputType].errors += data.errors;
  stats[inputType].timeMs += data.durationMs;

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

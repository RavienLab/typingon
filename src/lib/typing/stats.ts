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
  startTime: number,
) {
  // ✅ filter only valid keystrokes
  const validKeystrokes = keystrokes.filter(
    (k) => typeof k.correct === "boolean",
  );

  const totalChars = validKeystrokes.length;
  const correctChars = validKeystrokes.filter((k) => k.correct).length;

  // ✅ safer duration calculation
  const durationMs =
    totalChars > 0
      ? validKeystrokes[validKeystrokes.length - 1].time - startTime
      : 0;

  // 🚨 anti-cheat: too fast = invalid
  if (durationMs < 5000) {
    return {
      rawWpm: 0,
      wpm: 0,
      accuracy: 0,
    };
  }

  const minutes = durationMs / 60000;

  // ✅ proper WPM formulas
  const rawWpm = minutes > 0 ? totalChars / 5 / minutes : 0;
  const netWpm = minutes > 0 ? correctChars / 5 / minutes : 0;

  const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 100;

  // 🚨 sanity check (should never happen)
  if (rawWpm < netWpm) {
    return {
      rawWpm: 0,
      wpm: 0,
      accuracy: 0,
    };
  }

  // ❗ DO NOT round here (keep precision)
  return {
    rawWpm,
    wpm: netWpm,
    accuracy,
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
  },
) {
  const stats = loadModeStats();

  stats[inputType].runs += 1;
  stats[inputType].errors += data.errors;
  stats[inputType].timeMs += data.durationMs;

  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

export type Keystroke = {
  time: number;
  correct: boolean;
};

export type LiveStats = {
  wpm: number;
  rawWpm: number;
  accuracy: number;
  elapsedMs: number;
};

export function deriveStats(
  keystrokes: Keystroke[],
  elapsedMs: number,
  committedChars?: number
): LiveStats {
  if (!elapsedMs || elapsedMs <= 0) {
    return {
      wpm: 0,
      rawWpm: 0,
      accuracy: 100,
      elapsedMs: 0,
    };
  }

  const minutes = elapsedMs / 1000 / 60;

  const totalTyped =
    typeof committedChars === "number"
      ? committedChars
      : keystrokes.length;

  const correctTyped = keystrokes.filter((k) => k.correct).length;

  const rawWpm = minutes > 0 ? totalTyped / 5 / minutes : 0;
  const wpm = minutes > 0 ? correctTyped / 5 / minutes : 0;

  const accuracy =
    totalTyped > 0 ? (correctTyped / totalTyped) * 100 : 100;

  return {
    wpm: Math.round(wpm),
    rawWpm: Math.round(rawWpm),
    accuracy: Math.round(accuracy),
    elapsedMs,
  };
}
import { FINGER_MAP, FingerCode } from "./fingerMap";

type Bucket = {
  total: number;
  correct: number;
};

export function computeFingerAccuracy(keystrokes: any[]) {
  const buckets: Record<FingerCode, Bucket> = {
    LP: { total: 0, correct: 0 },
    LR: { total: 0, correct: 0 },
    LM: { total: 0, correct: 0 },
    LI: { total: 0, correct: 0 },

    RI: { total: 0, correct: 0 },
    RM: { total: 0, correct: 0 },
    RR: { total: 0, correct: 0 },
    RP: { total: 0, correct: 0 },

    THUMB: { total: 0, correct: 0 },
  };

  for (const k of keystrokes) {
    const key = k.key?.toLowerCase();
    const finger = FINGER_MAP[key];

    if (!finger) continue;

    buckets[finger].total += 1;
    if (k.correct) buckets[finger].correct += 1;
  }

  const result: Record<FingerCode, number> = {} as Record<
    FingerCode,
    number
  >;

  for (const finger in buckets) {
    const b = buckets[finger as FingerCode];

    result[finger as FingerCode] =
      b.total === 0
        ? 100
        : Math.round((b.correct / b.total) * 100);
  }

  return result;
}

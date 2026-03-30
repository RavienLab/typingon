export function analyzeSession(
  wpmTimeline: { t: number; wpm: number }[],
  keystrokes: { key: string; time: number; correct: boolean }[]
) {
  if (wpmTimeline.length < 10) return null;

  const speeds = wpmTimeline.map((p) => p.wpm);
  const start = speeds.slice(0, Math.floor(speeds.length * 0.3));
  const end = speeds.slice(Math.floor(speeds.length * 0.7));

  const avgStart =
    start.reduce((a, b) => a + b, 0) / start.length;
  const avgEnd = end.reduce((a, b) => a + b, 0) / end.length;

  const fatigue =
    avgEnd < avgStart * 0.85
      ? "fatigue"
      : "stable";

  const variance =
    speeds.reduce((a, b) => a + Math.abs(b - avgStart), 0) /
    speeds.length;

  const consistency =
    variance > 15 ? "unstable" : "steady";

  let hesitation = 0;
  for (let i = 1; i < keystrokes.length; i++) {
    if (!keystrokes[i - 1].correct) {
      const gap =
        keystrokes[i].time - keystrokes[i - 1].time;
      if (gap > 300) hesitation++;
    }
  }

  const confidence =
    hesitation > 5 ? "low" : "high";

  return { fatigue, consistency, confidence };
}

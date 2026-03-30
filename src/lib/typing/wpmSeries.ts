export function deriveWpmSeries(replay: { time: number }[]) {
  if (!replay.length) return [];

  const start = replay[0].time;
  const buckets: Record<number, number> = {};

  for (const k of replay) {
    const second = Math.floor((k.time - start) / 1000);
    buckets[second] = (buckets[second] || 0) + 1;
  }

  const result = [];

  for (const s of Object.keys(buckets)) {
    const chars = buckets[Number(s)];
    const wpm = Math.round((chars / 5) * 60);
    result.push({ second: Number(s), wpm });
  }

  return result;
}
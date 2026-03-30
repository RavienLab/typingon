export function generateHeatmap(keystrokes: any[]) {
  const map: Record<string, number> = {};

  for (const k of keystrokes) {
    if (!k.correct) {
      map[k.key] = (map[k.key] || 0) + 1;
    }
  }

  return map;
}

export function normalizeHeatmap(map: Record<string, number>) {
  const max = Math.max(...Object.values(map), 1);

  const normalized: Record<string, number> = {};

  for (const key in map) {
    normalized[key] = map[key] / max; // 0 → 1
  }

  return normalized;
}

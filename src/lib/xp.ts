export function calculateXP(wpm: number, accuracy: number) {
  const base = Math.round(wpm * 2);
  const accBonus = Math.round(accuracy);
  return base + accBonus;
}

export function levelFromXP(xp: number) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

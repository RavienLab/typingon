export function getDailyStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // Ensure newest first
  const sorted = [...dates].sort().reverse();

  let streak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1]);
    const curr = new Date(sorted[i]);

    prev.setDate(prev.getDate() - 1);

    if (prev.toISOString().slice(0, 10) === curr.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

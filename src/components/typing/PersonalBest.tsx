export function PersonalBest({ wpm }: { wpm: number }) {
  const best = Number(localStorage.getItem("bestWpm") || 0);

  if (wpm > best) {
    localStorage.setItem("bestWpm", String(wpm));
    return <div className="text-green-400">🏆 New personal best!</div>;
  }

  return <div className="text-white/40">Best: {best} wpm</div>;
}

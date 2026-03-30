type AggregateWordStat = {
  count: number;
  errors: number;
  totalDuration: number;
};

export function getWeakWords(
  stats: Record<string, AggregateWordStat>,
  limit = 6
): string[] {
  return Object.entries(stats)
    .filter(([_, raw]) => Number(raw.count) >= 3)
    .map(([word, raw]) => {
      const count = Number(raw.count) || 1;
      const errors = Number(raw.errors) || 0;
      const totalDuration = Number(raw.totalDuration) || 0;

      return {
        word,
        score: errors / count + totalDuration / count / 1000,
      };
    })

    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((w) => w.word);
}

export function generateAdaptiveParagraph(weakWords: string[]): string {
  if (weakWords.length === 0) {
    return "Focus on accuracy and rhythm. Improvement comes naturally with calm repetition.";
  }

  const fillers = [
    "typing requires patience",
    "accuracy builds confidence",
    "rhythm matters more than speed",
    "flow comes from consistency",
  ];

  const words = [...weakWords, ...fillers]
    .sort(() => 0.5 - Math.random())
    .join(" ");

  return words.charAt(0).toUpperCase() + words.slice(1) + ".";
}

export function generatePracticeText(
  weakKeys: string[],
  length = 200
) {
  const commonWords = [
    "time",
    "people",
    "there",
    "because",
    "other",
    "which",
    "their",
    "about",
    "would",
    "could",
    "should",
    "these",
    "those",
    "where",
    "after",
    "before",
  ];

  const allChars =
    "abcdefghijklmnopqrstuvwxyz     .....,,,;;!!??";

  let text = "";

  for (let i = 0; i < length; i++) {
    if (Math.random() < 0.35 && weakKeys.length > 0) {
      // Inject weak characters aggressively
      text +=
        weakKeys[Math.floor(Math.random() * weakKeys.length)];
    } else if (Math.random() < 0.6) {
      text += allChars[Math.floor(Math.random() * allChars.length)];
    } else {
      const word =
        commonWords[Math.floor(Math.random() * commonWords.length)];
      text += word + " ";
      i += word.length;
    }
  }

  return text.replace(/\s+/g, " ").trim();
}

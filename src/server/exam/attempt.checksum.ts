import crypto from "crypto";

export function computeAttemptChecksum(
  keystrokes: any[],
  stats: {
    wpm: number;
    rawWpm: number;
    accuracy: number;
    errors: number;
    totalChars: number;
  }
) {
  const payload = JSON.stringify({ keystrokes, stats });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

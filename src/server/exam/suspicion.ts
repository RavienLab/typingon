import { Attempt, AttemptEvent } from "@prisma/client";

export function analyzeSuspicion(
  attempt: Attempt,
  events: AttemptEvent[]
) {
  const flags: string[] = [];

  const pauses = events.filter((e) => e.type === "paused");
  const focusLost = events.filter((e) => e.type === "focus_lost");

  if (pauses.length > 3) {
    flags.push("Excessive pauses");
  }

  if (focusLost.length > 2) {
    flags.push("Frequent tab switching");
  }

  if (attempt.durationMs && attempt.durationMs < 10000) {
    flags.push("Unrealistically fast completion");
  }

  return flags;
}
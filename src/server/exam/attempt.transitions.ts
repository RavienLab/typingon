import { AttemptStatus } from "@prisma/client";

const ALLOWED: Record<AttemptStatus, AttemptStatus[]> = {
  created: ["started", "aborted"],
  started: ["paused", "finished", "aborted"],
  paused: ["resumed", "aborted"],
  resumed: ["paused", "finished", "aborted"],
  finished: ["verified"],
  verified: [],
  aborted: [],
  invalidated: [],
};

export function assertTransition(
  from: AttemptStatus,
  to: AttemptStatus,
) {
  if (!ALLOWED[from]?.includes(to)) {
    throw new Error(`Invalid attempt transition: ${from} → ${to}`);
  }
}

import { prisma } from "@/server/db";
import { Prisma, AttemptStatus, AttemptEventType } from "@prisma/client";
import { assertTransition } from "./attempt.transitions";

export async function transitionAttempt(
  attemptId: string,
  next: AttemptStatus,
  meta?: Record<string, any>,
) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      select: { status: true },
    });

    if (!attempt) {
      throw new Error("Attempt not found");
    }

    // 🔒 Single source of truth
    assertTransition(attempt.status, next);

    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        status: next,
        ...(next === "started" && { startedAt: new Date() }),
        ...(next === "finished" && { endedAt: new Date() }),
      },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId,
        type: next as AttemptEventType,
        meta,
      },
    });
  });
}

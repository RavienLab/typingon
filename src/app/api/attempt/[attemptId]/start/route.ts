import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptStatus, AttemptEventType } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: { attemptId: string } }
) {
  const { attemptId } = params;

  await prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
    });

    if (!attempt || attempt.status !== AttemptStatus.created) {
      throw new Error("Invalid attempt state");
    }

    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.started,
        startedAt: new Date(),
      },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId,
        type: AttemptEventType.started,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

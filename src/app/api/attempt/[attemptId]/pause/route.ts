import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptStatus, AttemptEventType } from "@prisma/client";

export async function POST(
  _req: Request,
  { params }: { params: { attemptId: string } },
) {
  const { attemptId } = params;

  await prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      select: { status: true },
    });

    if (
      !attempt ||
      (attempt.status !== AttemptStatus.started &&
        attempt.status !== AttemptStatus.resumed)
    ) {
      throw new Error("Attempt cannot be paused");
    }

    await tx.attempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.paused },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId,
        type: AttemptEventType.paused,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

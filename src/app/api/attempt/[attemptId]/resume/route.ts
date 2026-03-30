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
      select: { status: true },
    });

    if (!attempt || attempt.status !== AttemptStatus.paused) {
      throw new Error("Attempt cannot be resumed");
    }

    await tx.attempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.resumed },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId,
        type: AttemptEventType.resumed,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

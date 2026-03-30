import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptStatus, AttemptEventType } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { attemptId: string } },
) {
  const { attemptId } = params;
  const body = await req.json().catch(() => ({}));

  await prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      select: { status: true },
    });

    if (
      !attempt ||
      attempt.status === AttemptStatus.finished ||
      attempt.status === AttemptStatus.aborted
    ) {
      return;
    }

    await tx.attempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.aborted },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId,
        type: AttemptEventType.aborted,
        meta: body,
      },
    });
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptStatus } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { attemptId: string } }
) {
  const { attemptId } = params;
  const { sequenceStart, sequenceEnd, data } = await req.json();

  if (
    typeof sequenceStart !== "number" ||
    typeof sequenceEnd !== "number" ||
    !Array.isArray(data)
  ) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    select: { status: true },
  });

  if (!attempt || attempt.status !== AttemptStatus.started) {
    return NextResponse.json(
      { error: "Attempt not active" },
      { status: 403 }
    );
  }

  // ---------------- SEQUENCE + TIMING VALIDATION ----------------

  const lastChunk = await prisma.keystrokeChunk.findFirst({
    where: { attemptId },
    orderBy: { sequenceEnd: "desc" },
  });

  let invalidReason: string | null = null;

  // Sequence integrity
  if (lastChunk) {
    if (sequenceStart !== lastChunk.sequenceEnd + 1) {
      invalidReason = "Sequence tampering detected";
    }
  } else {
    if (sequenceStart !== 0) {
      invalidReason = "Invalid initial sequence";
    }
  }

  // Timing sanity
  if (!invalidReason) {
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];

      if (
        typeof prev?.t !== "number" ||
        typeof curr?.t !== "number"
      ) {
        invalidReason = "Malformed timing data";
        break;
      }

      const diff = curr.t - prev.t;

      // 5ms between keystrokes is unrealistic
      if (diff < 5) {
        invalidReason = "Unnatural typing speed detected";
        break;
      }
    }
  }

  // ---------------- HANDLE INVALIDATION ----------------

  if (invalidReason) {
    await prisma.$transaction(async (tx) => {
      await tx.attempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.invalidated },
      });

      // 🔥 Auto-invalidate certificate if it exists
      await tx.certificate.updateMany({
        where: { attemptId },
        data: {
          verificationHash: "INVALIDATED",
        },
      });
    });

    return NextResponse.json(
      { error: invalidReason },
      { status: 400 }
    );
  }

  // ---------------- STORE VALID CHUNK ----------------

  await prisma.keystrokeChunk.create({
    data: {
      attemptId,
      sequenceStart,
      sequenceEnd,
      data,
    },
  });

  return NextResponse.json({ ok: true });
}
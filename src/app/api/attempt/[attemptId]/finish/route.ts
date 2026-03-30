import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptStatus } from "@prisma/client";
import crypto from "crypto";

export async function POST(
  _: Request,
  { params }: { params: { attemptId: string } }
) {
  const { attemptId } = params;

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      include: {
        keystrokes: true,
      },
    });

    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    if (attempt.status !== "started" && attempt.status !== "resumed") {
      return NextResponse.json(
        { error: "Attempt not in finishable state" },
        { status: 400 }
      );
    }

    // ---------------- DERIVE STATS ----------------
    let totalChars = 0;
    let errors = 0;

    for (const chunk of attempt.keystrokes) {
      for (const k of chunk.data as any[]) {
        totalChars++;
        if (!k.ok) errors++;
      }
    }

    const durationMs =
      attempt.startedAt &&
      Date.now() - attempt.startedAt.getTime();

    const minutes = (durationMs ?? 1) / 60000;
    const rawWpm = totalChars / 5 / minutes;
    const wpm = (totalChars - errors) / 5 / minutes;
    const accuracy =
      totalChars === 0 ? 100 : ((totalChars - errors) / totalChars) * 100;

    // ---------------- CHECKSUM ----------------
    const checksumPayload = JSON.stringify({
      totalChars,
      errors,
      durationMs,
      rawWpm,
      wpm,
      accuracy,
    });

    const checksum = crypto
      .createHash("sha256")
      .update(checksumPayload)
      .digest("hex");

    // ---------------- WRITE ----------------
    await tx.attempt.update({
      where: { id: attemptId },
      data: {
        status: AttemptStatus.finished,
        endedAt: new Date(),
        durationMs,
      },
    });

    await tx.attemptResult.create({
      data: {
        attemptId,
        totalChars,
        errors,
        rawWpm,
        wpm,
        accuracy,
        checksum,
      },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId,
        type: "finished",
      },
    });

    return NextResponse.json({ ok: true });
  });
}

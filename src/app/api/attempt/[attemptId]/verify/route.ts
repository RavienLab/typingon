import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import crypto from "crypto";
import { AttemptStatus } from "@prisma/client";

export async function POST(
  _: Request,
  { params }: { params: { attemptId: string } },
) {
  const { attemptId } = params;

  return prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.findUnique({
      where: { id: attemptId },
      include: {
        keystrokes: true,
        result: true,
      },
    });

    if (!attempt || !attempt.result) {
      return NextResponse.json({ error: "Invalid attempt" }, { status: 404 });
    }

    if (attempt.status !== "finished") {
      return NextResponse.json(
        { error: "Attempt not finishable" },
        { status: 400 },
      );
    }

    // 🔁 Recompute checksum
    let totalChars = 0;
    let errors = 0;

    for (const chunk of attempt.keystrokes) {
      for (const k of chunk.data as any[]) {
        totalChars++;
        if (!k.ok) errors++;
      }
    }

    const minutes = (attempt.durationMs ?? 1) / 60000;
    const rawWpm = totalChars / 5 / minutes;
    const wpm = (totalChars - errors) / 5 / minutes;
    const accuracy =
      totalChars === 0 ? 100 : ((totalChars - errors) / totalChars) * 100;

    const payload = JSON.stringify({
      totalChars,
      errors,
      rawWpm,
      wpm,
      accuracy,
      durationMs: attempt.durationMs,
    });

    const checksum = crypto.createHash("sha256").update(payload).digest("hex");

    if (checksum !== attempt.result.checksum) {
      await tx.attempt.update({
        where: { id: attemptId },
        data: { status: AttemptStatus.invalidated },
      });

      // 🔥 Invalidate certificate if exists
      await tx.certificate.updateMany({
        where: { attemptId },
        data: {
          verificationHash: "INVALIDATED",
        },
      });

      return NextResponse.json({ valid: false });
    }

    await tx.attempt.update({
      where: { id: attemptId },
      data: { status: AttemptStatus.verified },
    });

    await tx.attemptAudit.create({
      data: {
        attemptId,
        action: "verified",
        actorRole: "system",
      },
    });

    return NextResponse.json({ valid: true });
  });
}

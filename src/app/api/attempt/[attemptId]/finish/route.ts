import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptStatus } from "@prisma/client";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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
      },
    });
    const session = await getServerSession(authOptions);

    // 1. attempt exists
    if (!attempt) {
      return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
    }

    // 2. ownership check
    if (!session?.user?.id || attempt.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 🔥 3. ADD HERE
    if (attempt.status === "finished") {
      return NextResponse.json({ error: "Already finished" }, { status: 409 });
    }

    // 4. existing check
    if (attempt.status !== "started" && attempt.status !== "resumed") {
      return NextResponse.json(
        { error: "Attempt not in finishable state" },
        { status: 400 },
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
      attempt.startedAt && Date.now() - attempt.startedAt.getTime();

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

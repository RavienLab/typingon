import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const start = Date.now();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const { wpm, accuracy, durationMs = 0, attemptId } = body;

  // basic type checks
  if (typeof wpm !== "number" || typeof accuracy !== "number") {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // stricter anti-cheat rules
  if (wpm <= 0 || wpm > 180) {
    return NextResponse.json({ error: "Suspicious WPM" }, { status: 400 });
  }

  if (accuracy < 0 || accuracy > 100) {
    return NextResponse.json({ error: "Invalid accuracy" }, { status: 400 });
  }

  // unrealistic combo detection
  if (wpm > 120 && accuracy < 85) {
    return NextResponse.json(
      { error: "Invalid score combination" },
      { status: 400 },
    );
  }

  // too short = fake
  if (durationMs < 15000) {
    return NextResponse.json({ error: "Test too short" }, { status: 400 });
  }

  // duplicate protection
  if (!attemptId) {
    return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
  }

  const existingAttempt = await prisma.typingResult.findFirst({
    where: { attemptId },
  });

  if (existingAttempt) {
    return NextResponse.json(
      { error: "Duplicate submission" },
      { status: 400 },
    );
  }

  const userId = session.user.id;
  const username = session.user.name || "User";

  const {
    rawWpm,
    errors,
    backspaces = 0,
    practiceMode = "english",
    paragraph = "",
    keystrokes = [],
    wpmTimeline = [],
  } = body;

  const baseXP = 20;
  const speedBonus = Math.floor(wpm / 10);
  const accuracyBonus = Math.floor(accuracy / 10);
  const earnedXP = baseXP + speedBonus + accuracyBonus;

  await prisma.$transaction(async (tx) => {
    // ✅ Save result
    await tx.typingResult.create({
      data: {
        attemptId,
        userId,
        wpm,
        rawWpm,
        accuracy,
        errors,
        backspaces,
        durationMs,
        practiceMode,
        paragraph,
        keystrokes,
        wpmTimeline,
      },
    });

    // ✅ Leaderboard
    const existing = await tx.leaderboardEntry.findUnique({
      where: { userId },
    });

    if (!existing) {
      await tx.leaderboardEntry.create({
        data: {
          userId,
          username,
          bestWpm: wpm,
          avgWpm: wpm,
          accuracy,
          tests: 1,
        },
      });
    } else {
      const newTests = existing.tests + 1;

      await tx.leaderboardEntry.update({
        where: { userId },
        data: {
          bestWpm: Math.max(existing.bestWpm, wpm),
          avgWpm: Math.round(
            (existing.avgWpm * existing.tests + wpm) / newTests,
          ),
          accuracy: (existing.accuracy * existing.tests + accuracy) / newTests,
          tests: newTests,
        },
      });
    }

    // 🔥 get current best first
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { personalBest: true, xp: true },
    });

    const newXP = (user?.xp ?? 0) + earnedXP;
    const newLevel = Math.floor(newXP / 1000) + 1;

    await tx.user.update({
      where: { id: userId },
      data: {
        xp: newXP,
        level: newLevel,
        personalBest: Math.max(user?.personalBest ?? 0, wpm),
        lastActive: new Date(),
      },
    });
  });
  return NextResponse.json({
    success: true,
    xpEarned: earnedXP,
  });
}

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

  if (
    typeof body.wpm !== "number" ||
    typeof body.accuracy !== "number" ||
    body.wpm <= 0 ||
    body.accuracy < 0 ||
    body.accuracy > 100
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  if (body.wpm > 300) {
    return NextResponse.json({ error: "Unrealistic WPM" }, { status: 400 });
  }

  const userId = session.user.id;
  const username = session.user.name || "User";

  const {
    wpm,
    rawWpm,
    accuracy,
    errors,
    backspaces = 0,
    durationMs = 0,
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

    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        xp: { increment: earnedXP },
        personalBest: Math.max(user?.personalBest ?? 0, wpm),
        lastActive: new Date(),
      },
      select: { xp: true },
    });

    const newLevel = Math.floor(updated.xp / 1000) + 1;

    await tx.user.update({
      where: { id: userId },
      data: { level: newLevel },
    });
  });
  console.log("⏱️ API time:", Date.now() - start, "ms");
  return NextResponse.json({
    success: true,
    xpEarned: earnedXP,
  });
}

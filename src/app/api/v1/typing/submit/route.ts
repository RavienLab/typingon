import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { calculateStats } from "@/lib/typing/stats";
import { calculateXP, levelFromXP } from "@/lib/xp";
import { grantAchievement } from "@/lib/achievementEngine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, keystrokes, wpmTimeline, backspaces } =
    await req.json();

  if (
    typeof sessionId !== "string" ||
    !Array.isArray(keystrokes) ||
    !Array.isArray(wpmTimeline)
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // 🔥 Rate limit
  const recent = await prisma.typingResult.count({
    where: {
      userId,
      createdAt: {
        gt: new Date(Date.now() - 60_000),
      },
    },
  });

  if (recent >= 3) {
    return NextResponse.json(
      { error: "Too many submissions" },
      { status: 429 },
    );
  }

  // 🔒 Get session FIRST (not updateMany)
  const typingSession = await prisma.typingSession.findUnique({
    where: { id: sessionId },
  });

  if (!typingSession) {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  if (typingSession.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (typingSession.endedAt) {
    return NextResponse.json(
      { error: "Already submitted" },
      { status: 409 },
    );
  }

  // 🔒 Enforce server time (NOT client)
  const elapsed = Date.now() - typingSession.startedAt.getTime();

  if (elapsed < 5000) {
    return NextResponse.json(
      { error: "Session too short" },
      { status: 400 },
    );
  }

  // 🔐 Validate keystrokes
  for (const k of keystrokes) {
    if (
      typeof k.key !== "string" ||
      typeof k.time !== "number" ||
      typeof k.correct !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid keystrokes" },
        { status: 400 },
      );
    }
  }

  // 🧠 Bot detection
  const times = keystrokes.map((k: any) => k.time);
  const intervals = times.slice(1).map((t: number, i: number) => t - times[i]);

  if (intervals.length >= 5) {
    const avg =
      intervals.reduce((a, b) => a + b, 0) / intervals.length;

    const variance =
      intervals.reduce((acc, val) => acc + Math.abs(val - avg), 0) /
      intervals.length;

    if (avg < 30 || variance < 5) {
      return NextResponse.json(
        { error: "Bot detected" },
        { status: 400 },
      );
    }
  }

  // 📊 Use SERVER time
  const stats = calculateStats(
    keystrokes,
    typingSession.startedAt.getTime(),
  );

  if (stats.rawWpm < stats.wpm) {
    return NextResponse.json({ error: "Invalid stats" }, { status: 400 });
  }

  if (stats.wpm > 220 || stats.accuracy > 100) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  if (keystrokes.length < 10) {
    return NextResponse.json({ error: "Too short" }, { status: 400 });
  }

  let result: any;
  let streak = 0;

  await prisma.$transaction(async (tx) => {
    // 🔒 LOCK SESSION
    await tx.typingSession.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    result = await tx.typingResult.create({
      data: {
        sessionId,
        userId,
        wpm: stats.wpm,
        rawWpm: stats.rawWpm,
        accuracy: stats.accuracy,
        errors: keystrokes.filter((k: any) => !k.correct).length,
        backspaces,
        keystrokes,
        wpmTimeline,
      },
    });

    const user = await tx.user.findUnique({
      where: { id: userId },
    });

    if (!user) throw new Error("User not found");

    // 🏆 Leaderboard
    const prev = await tx.leaderboardEntry.findUnique({
      where: { userId },
    });

    if (!prev) {
      await tx.leaderboardEntry.create({
        data: {
          userId,
          username: user.name || "Anonymous",
          bestWpm: stats.wpm,
          avgWpm: stats.wpm,
          tests: 1,
        },
      });
    } else {
      const total = prev.tests + 1;
      const newAvg =
        (prev.avgWpm * prev.tests + stats.wpm) / total;

      await tx.leaderboardEntry.update({
        where: { userId },
        data: {
          bestWpm: Math.max(prev.bestWpm, stats.wpm),
          avgWpm: Math.round(newAvg),
          tests: total,
        },
      });
    }

    // 🔥 Streak logic (fixed)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const last = user.lastActive ? new Date(user.lastActive) : null;

    streak = user.currentStreak || 0;

    if (!last) {
      streak = 1;
    } else {
      const lastDay = new Date(last);
      lastDay.setHours(0, 0, 0, 0);

      const diffDays = Math.floor(
        (today.getTime() - lastDay.getTime()) /
          (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) streak += 1;
      else if (diffDays > 1) streak = 1;
    }

    const best = Math.max(user.bestStreak || 0, streak);
    const pb = Math.max(user.personalBest || 0, stats.wpm);

    const gainedXP = calculateXP(stats.wpm, stats.accuracy);
    const newXP = (user.xp || 0) + gainedXP;
    const newLevel = levelFromXP(newXP);

    await tx.user.update({
      where: { id: userId },
      data: {
        currentStreak: streak,
        bestStreak: best,
        lastActive: today,
        personalBest: pb,
        xp: newXP,
        level: newLevel,
      },
    });
  });

  // 🧠 Async (non-critical)
  grantAchievement(userId, "first_test").catch(() => {});

  return NextResponse.json({
    guest: false,
    sessionId,
    result,
    streak,
  });
}
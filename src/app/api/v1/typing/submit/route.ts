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
  const userId = session?.user?.id ?? null;

  // 🔒 BLOCK GUESTS COMPLETELY
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, keystrokes, startTime, backspaces, wpmTimeline } =
    await req.json();

  // ─────────────────────────────────────────────
  // 🧪 Basic payload validation
  // ─────────────────────────────────────────────
  if (
    typeof sessionId !== "string" ||
    !Array.isArray(keystrokes) ||
    !Array.isArray(wpmTimeline)
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // ─────────────────────────────────────────────
  // 🔥 Rate limit (only for logged users)
  // ─────────────────────────────────────────────
  if (userId) {
    const recent = await prisma.typingResult.count({
      where: {
        userId,
        createdAt: {
          gt: new Date(Date.now() - 60_000),
        },
      },
    });

    if (recent > 5) {
      return NextResponse.json(
        { error: "Too many submissions" },
        { status: 429 },
      );
    }
  }

  // ─────────────────────────────────────────────
  // 🔒 Load & validate session
  // ─────────────────────────────────────────────
  const typingSession = await prisma.typingSession.findUnique({
    where: { id: sessionId },
  });

  if (!typingSession) {
    return NextResponse.json({ error: "Invalid session" }, { status: 403 });
  }

  // If logged in, session must belong to user
  if (userId && typingSession.userId !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (typingSession.endedAt) {
    return NextResponse.json(
      { error: "Session already submitted" },
      { status: 409 },
    );
  }

  // Enforce real elapsed time
  const elapsed = Date.now() - typingSession.startedAt.getTime();
  if (elapsed < 5000) {
    return NextResponse.json(
      { error: "Session too short to be human" },
      { status: 400 },
    );
  }

  // ─────────────────────────────────────────────
  // 🔐 Keystroke integrity
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // 🧠 Human timing check
  // ─────────────────────────────────────────────
  const times = keystrokes.map((k: any) => k.time);
  const intervals = times.slice(1).map((t: number, i: number) => t - times[i]);

  if (intervals.length > 0) {
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    if (avg < 30) {
      return NextResponse.json({ error: "Bot detected" }, { status: 400 });
    }
  }

  // ─────────────────────────────────────────────
  // 📊 Compute stats
  // ─────────────────────────────────────────────
  const stats = calculateStats(keystrokes, startTime);

  if (stats.wpm > 220 || stats.accuracy > 100) {
    return NextResponse.json({ error: "Invalid result" }, { status: 400 });
  }

  if (keystrokes.length < 10) {
    return NextResponse.json({ error: "Too short" }, { status: 400 });
  }

  // ─────────────────────────────────────────────
  // 💾 Save result (guest-safe)
  // ─────────────────────────────────────────────
  const result = await prisma.typingResult.create({
    data: {
      sessionId,
      userId: userId ?? null, // ✅ PHASE 17 FIX
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      errors: keystrokes.filter((k: any) => !k.correct).length,
      backspaces,
      keystrokes,
      wpmTimeline,
    },
  });
  await prisma.dailyChallenge.updateMany({
    where: {
      userId: session?.user?.id,
      completed: false,
    },
    data: {
      completed: true,
    },
  });

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // ─────────────────────────────────────────────
    // 🏆 Leaderboard Upsert
    // ─────────────────────────────────────────────

    const previous = await prisma.leaderboardEntry.findUnique({
      where: { userId },
    });

    if (!previous) {
      await prisma.leaderboardEntry.create({
        data: {
          userId,
          username: user?.name || "Anonymous",
          bestWpm: stats.wpm,
          avgWpm: stats.wpm,
          tests: 1,
        },
      });
    } else {
      const totalTests = previous.tests + 1;

      const newAvg =
        (previous.avgWpm * previous.tests + stats.wpm) / totalTests;

      await prisma.leaderboardEntry.update({
        where: { userId },
        data: {
          bestWpm: Math.max(previous.bestWpm, stats.wpm),
          avgWpm: Math.round(newAvg),
          tests: totalTests,
        },
      });
    }

    const today = new Date();
    const last = user?.lastActive ? new Date(user.lastActive) : null;

    const isSameDay = last && last.toDateString() === today.toDateString();

    const isNextDay =
      last &&
      new Date(last.getTime() + 86400000).toDateString() ===
        today.toDateString();

    let streak = user?.currentStreak || 0;

    if (!last || isNextDay) streak += 1;
    if (!isSameDay && !isNextDay) streak = 1;

    const best = Math.max(user?.bestStreak || 0, streak);
    const pb = Math.max(user?.personalBest || 0, result.wpm);
    const gainedXP = calculateXP(stats.wpm, stats.accuracy);
    const newXP = (user?.xp || 0) + gainedXP;
    const newLevel = levelFromXP(newXP);

    // ─────────────────────────────────────────────
    // 🏅 Achievement Grants
    // ─────────────────────────────────────────────

    await grantAchievement(userId, "first_test");

    if (stats.wpm >= 80) {
      await grantAchievement(userId, "speed_80");
    }

    if (stats.accuracy === 100) {
      await grantAchievement(userId, "accuracy_100");
    }

    if (streak >= 7) {
      await grantAchievement(userId, "streak_7");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        currentStreak: streak,
        bestStreak: best,
        lastActive: today,
        personalBest: pb,
        xp: newXP,
        level: newLevel,
      },
    });
  }

  // ─────────────────────────────────────────────
  // 🔒 Close session
  // ─────────────────────────────────────────────
  await prisma.typingSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  // ─────────────────────────────────────────────
  // 🧠 Profile learning (logged users only)
  // ─────────────────────────────────────────────
  if (userId) {
    const mistakes = keystrokes
      .filter((k: any) => !k.correct)
      .map((k: any) => k.key);

    const existing = await prisma.typingProfile.findUnique({
      where: { userId },
    });

    if (!existing) {
      await prisma.typingProfile.create({
        data: {
          userId,
          avgWpm: stats.wpm,
          avgAcc: stats.accuracy,
          weakKeys: mistakes,
          sessions: 1,
        },
      });
    } else {
      const total = existing.sessions + 1;

      await prisma.typingProfile.update({
        where: { userId },
        data: {
          avgWpm: (existing.avgWpm * existing.sessions + stats.wpm) / total,
          avgAcc:
            (existing.avgAcc * existing.sessions + stats.accuracy) / total,
          weakKeys: [
            ...new Set([...(existing.weakKeys as string[]), ...mistakes]),
          ],
          sessions: total,
        },
      });
    }
  }

  return NextResponse.json({
    guest: false,
    sessionId,
    result,
  });
}

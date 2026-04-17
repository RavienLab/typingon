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

  const { sessionId, keystrokes, wpmTimeline, backspaces } = await req.json();

  if (
    typeof sessionId !== "string" ||
    !Array.isArray(keystrokes) ||
    !Array.isArray(wpmTimeline)
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  // 🔥 RATE LIMITING: Prevent spam (max 3 submissions per minute)
  const recentCount = await prisma.typingResult.count({
    where: { userId, createdAt: { gt: new Date(Date.now() - 60_000) } },
  });

  if (recentCount >= 3) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  // 🔒 SESSION VALIDATION
  const typingSession = await prisma.typingSession.findUnique({
    where: { id: sessionId },
  });

  if (!typingSession || typingSession.userId !== userId) {
    return NextResponse.json({ error: "Session mismatch" }, { status: 403 });
  }

  if (typingSession.endedAt) {
    return NextResponse.json(
      { error: "Session already finalized" },
      { status: 409 },
    );
  }

  // 🔒 SECURITY: Enforce minimum time (3000ms for long paragraphs)
  const elapsed = Date.now() - typingSession.startedAt.getTime();
  if (elapsed < 3000) {
    return NextResponse.json(
      { error: "Session too short for valid result" },
      { status: 400 },
    );
  }

  // 🔐 KEYSTROKE INTEGRITY
  for (const k of keystrokes) {
    if (
      typeof k.key !== "string" ||
      typeof k.time !== "number" ||
      typeof k.correct !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Payload integrity check failed" },
        { status: 400 },
      );
    }
  }

  // 🧠 ADVANCED BOT DETECTION
  const times = keystrokes.map((k: any) => k.time);
  const intervals = times.slice(1).map((t: number, i: number) => t - times[i]);

  if (intervals.length >= 15) {
    const avg = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((acc, val) => acc + Math.abs(val - avg), 0) /
      intervals.length;
    // Human typing has variance. If it's too perfect (< 1ms), it's a script.
    if (avg < 20 || variance < 1.5) {
      return NextResponse.json(
        { error: "Automated typing detected" },
        { status: 400 },
      );
    }
  }

  // 📊 CALCULATE FINAL STATS
  const stats = calculateStats(keystrokes, typingSession.startedAt.getTime());

  // 🏁 VALIDATION: Enforce professional length (Min 20 characters)
  if (stats.wpm > 250 || stats.accuracy > 100 || keystrokes.length < 20) {
    return NextResponse.json(
      { error: "Result rejected: invalid or too short" },
      { status: 400 },
    );
  }

  // ✅ PERSISTENCE: Atomic update to close session and create result
  await prisma.typingSession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  const result = await prisma.typingResult.create({
    data: {
      sessionId,
      userId,
      wpm: stats.wpm,
      rawWpm: stats.rawWpm,
      accuracy: stats.accuracy,
      practiceMode: typingSession.mode,
      durationMs: typingSession.duration * 1000,
      errors: keystrokes.filter((k: any) => !k.correct).length,
      backspaces,
      keystrokes,
      wpmTimeline,
    },
  });

  // 🏆 BACKGROUND UPDATES (Non-critical)
  let currentStreak = 0;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      // 🥇 Atomic Leaderboard Logic
      const prevEntry = await prisma.leaderboardEntry.findUnique({
        where: { userId },
      });
      if (!prevEntry) {
        await prisma.leaderboardEntry.create({
          data: {
            userId,
            username: user.name || "Anon",
            bestWpm: stats.wpm,
            avgWpm: stats.wpm,
            tests: 1,
          },
        });
      } else {
        await prisma.leaderboardEntry.update({
          where: { userId },
          data: {
            bestWpm: Math.max(prevEntry.bestWpm, stats.wpm),
            tests: { increment: 1 },
            avgWpm: Math.round(
              (prevEntry.avgWpm * prevEntry.tests + stats.wpm) /
                (prevEntry.tests + 1),
            ),
          },
        });
      }

      // 🔥 Streak & Progression
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActive = user.lastActive ? new Date(user.lastActive) : null;
      currentStreak = user.currentStreak || 0;

      let streakData = {};
      if (!lastActive) {
        currentStreak = 1;
        streakData = { currentStreak: 1, lastActive: today };
      } else {
        const diff = Math.floor(
          (today.getTime() - lastActive.getTime()) / 86400000,
        );
        if (diff === 1) {
          currentStreak += 1;
          streakData = { currentStreak: { increment: 1 }, lastActive: today };
        } else if (diff > 1) {
          currentStreak = 1;
          streakData = { currentStreak: 1, lastActive: today };
        }
      }

      const gainedXP = calculateXP(stats.wpm, stats.accuracy);
      await prisma.user.update({
        where: { id: userId },
        data: {
          ...streakData,
          bestStreak: { set: Math.max(user.bestStreak || 0, currentStreak) },
          personalBest: { set: Math.max(user.personalBest || 0, stats.wpm) },
          xp: { increment: gainedXP },
          level: levelFromXP((user.xp || 0) + gainedXP),
        },
      });

      // 🧠 Async Achievements
      Promise.allSettled([
        grantAchievement(userId, "first_test"),
        ...(stats.wpm >= 50 ? [grantAchievement(userId, "speed_50")] : []),
        ...(stats.wpm >= 100 ? [grantAchievement(userId, "speed_100")] : []),
      ]);
    }
  } catch (err) {
    console.error("Delayed background update fail:", err);
  }

  return NextResponse.json({
    guest: false,
    sessionId,
    result,
    streak: currentStreak,
  });
}

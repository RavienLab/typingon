import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

/* ---------------- FINGER MAPPING ---------------- */
// Maps every standard QWERTY key to a specific finger ID
const FINGER_MAP: Record<string, string> = {
  q: "LP",
  a: "LP",
  z: "LP",
  "1": "LP",
  Q: "LP",
  A: "LP",
  Z: "LP",
  "`": "LP",
  w: "LR",
  s: "LR",
  x: "LR",
  "2": "LR",
  W: "LR",
  S: "LR",
  X: "LR",
  e: "LM",
  d: "LM",
  c: "LM",
  "3": "LM",
  E: "LM",
  D: "LM",
  C: "LM",
  r: "LI",
  f: "LI",
  v: "LI",
  "4": "LI",
  t: "LI",
  g: "LI",
  b: "LI",
  "5": "LI",
  y: "RI",
  h: "RI",
  n: "RI",
  "6": "RI",
  u: "RI",
  j: "RI",
  m: "RI",
  "7": "RI",
  i: "RM",
  k: "RM",
  ",": "RM",
  "8": "RM",
  I: "RM",
  K: "RM",
  "<": "RM",
  o: "RR",
  l: "RR",
  ".": "RR",
  "9": "RR",
  O: "RR",
  L: "RR",
  ">": "RR",
  p: "RP",
  ";": "RP",
  "/": "RP",
  "0": "RP",
  "-": "RP",
  "=": "RP",
  "[": "RP",
  "]": "RP",
  "'": "RP",
  " ": "THUMB",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  // 1. Run all core database queries in parallel
  const [user, allResults, streakData, recentResults, achievements] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.typingResult.findMany({
        where: { userId },
        select: { wpm: true, accuracy: true },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { currentStreak: true },
      }),
      prisma.typingResult.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: true },
      }),
    ]);

  /* ---------------- FINGER ACCURACY CALCULATION ---------------- */
  // We analyze the keystroke logs from the 10 most recent tests
  const fingerStats: Record<string, { total: number; correct: number }> = {};

  recentResults.forEach((res) => {
    const keys = res.keystrokes as any[];
    if (!Array.isArray(keys)) return;

    keys.forEach((k) => {
      const fingerId = FINGER_MAP[k.key];
      if (!fingerId) return; // Skip keys not in our map (like Backspace/Shift)

      if (!fingerStats[fingerId]) {
        fingerStats[fingerId] = { total: 0, correct: 0 };
      }

      fingerStats[fingerId].total++;
      if (k.correct) {
        fingerStats[fingerId].correct++;
      }
    });
  });

  // Convert raw counts into percentages for the frontend
  const processedFingers: Record<string, number> = {};
  Object.entries(fingerStats).forEach(([id, data]) => {
    processedFingers[id] = Math.round((data.correct / data.total) * 100);
  });

  /* ---------------- RESPONSE ---------------- */
  return NextResponse.json({
    me: user,
    stats: allResults, // Used for Total Tests and Avg WPM calculation
    streak: streakData?.currentStreak || 0,
    recent: recentResults, // Used for the "Recent Activity" list
    xpData: {
      xp: user?.xp || 0,
      level: user?.level || 1,
    },
    achievements: achievements,
    fingers: processedFingers, // Real finger-accuracy data!
  });
}

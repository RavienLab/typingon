import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type") || "global";
  const limit = Number(searchParams.get("limit") || 50);

  let where: any = {};

  if (type === "daily") {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    where.updatedAt = { gte: start };
  }

  if (type === "weekly") {
    const start = new Date();
    start.setDate(start.getDate() - 7);
    where.updatedAt = { gte: start };
  }

  if (type === "monthly") {
    const start = new Date();
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    where.updatedAt = { gte: start };
  }

  const entries = await prisma.leaderboardEntry.findMany({
    where,
    take: limit,
    select: {
      userId: true,
      username: true,
      bestWpm: true,
      avgWpm: true,
      tests: true,
      accuracy: true,
      user: {
        select: {
          id: true,
          name: true,
          image: true,
        },
      },
    },
  });

  const ranked = entries
    .map((e) => {
      const accuracyNorm = (e.accuracy ?? 95) / 100;

      const score =
        e.avgWpm * 0.6 +
        e.bestWpm * 0.2 +
        e.avgWpm * accuracyNorm * 0.2;

      return {
        ...e,
        score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return NextResponse.json(
    ranked.map((e, i) => ({
      rank: i + 1,
      user: {
        id: e.userId,
        name: e.user?.name || e.username,
        image: e.user?.image || null,
      },
      wpm: e.bestWpm,
      avgWpm: e.avgWpm,
      tests: e.tests,
      score: Math.round(e.score),
    }))
  );
}
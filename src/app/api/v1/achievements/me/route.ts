import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const userId = session.user.id;

  const results = await prisma.typingResult.findMany({
    where: { userId },
  });

  const best = Math.max(...results.map(r => r.wpm), 0);
  const tests = results.length;

  const achievements = await prisma.achievement.findMany();

  for (const a of achievements) {
    let unlock = false;

    if (a.key === "first_test" && tests >= 1) unlock = true;
    if (a.key === "ten_tests" && tests >= 10) unlock = true;
    if (a.key === "speed_50" && best >= 50) unlock = true;
    if (a.key === "speed_80" && best >= 80) unlock = true;

    if (unlock) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: a.id,
          },
        },
        update: {},
        create: {
          userId,
          achievementId: a.id,
        },
      });
    }
  }

  const data = await prisma.userAchievement.findMany({
    where: { userId },
    include: {
      achievement: true,
    },
    orderBy: { unlockedAt: "desc" },
  });

  return NextResponse.json(data);
}
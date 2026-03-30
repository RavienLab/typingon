import { prisma } from "@/lib/prisma";

export async function grantAchievement(userId: string, key: string) {
  const achievement = await prisma.achievement.findUnique({
    where: { key },
  });

  if (!achievement) return;

  await prisma.userAchievement.upsert({
    where: {
      userId_achievementId: {
        userId,
        achievementId: achievement.id,
      },
    },
    update: {},
    create: {
      userId,
      achievementId: achievement.id,
    },
  });
}

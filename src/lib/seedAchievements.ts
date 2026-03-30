import { prisma } from "@/lib/prisma";
import { ACHIEVEMENTS } from "@/lib/achievements";

/**
 * 🧠 Production-safe seeding with versioning
 * - Creates missing achievements
 * - Updates existing ones
 * - Supports future changes without breaking users
 */
export async function seedAchievements() {
  for (const a of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: a.key },

      update: {
        title: a.title,
        icon: a.icon,
        description: a.description,
        version: a.version ?? 1,
      },

      create: {
        key: a.key,
        title: a.title,
        description: a.description,
        icon: a.icon,
        version: a.version ?? 1,
      },
    });
  }

  console.log("✅ Achievements synced (with versioning)");
}
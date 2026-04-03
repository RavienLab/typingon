import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { FINGER_MAP } from "@/lib/typing/fingerMap";

export const dynamic = "force-dynamic";

type FingerStat = {
  correct: number;
  total: number;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await prisma.typingResult.findMany({
    where: { userId },
    select: { keystrokes: true },
    orderBy: {
      createdAt: "desc",
    },
    take: 30, // ✅ limit recent data only
  });

  const stats: Record<string, FingerStat> = {};

  for (const r of results) {
    const keys = (r.keystrokes as any[]) || [];

    for (const k of keys) {
      const key = k?.key?.toLowerCase?.();
      if (!key) continue;

      const finger = FINGER_MAP[key];
      if (!finger) continue;

      if (!stats[finger]) {
        stats[finger] = { correct: 0, total: 0 };
      }

      stats[finger].total += 1;
      if (k.correct) stats[finger].correct += 1;
    }
  }

  const output: Record<string, number> = {};

  for (const finger in stats) {
    const s = stats[finger];
    output[finger] = s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0;
  }

  return NextResponse.json(output);
}

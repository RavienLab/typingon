import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(null);
  }

  const me = await prisma.leaderboardEntry.findUnique({
    where: { userId: session.user.id },
    select: { bestWpm: true },
  });

  if (!me) return NextResponse.json({ rank: null });

  const better = await prisma.leaderboardEntry.count({
    where: {
      bestWpm: { gt: me.bestWpm },
    },
  });

  return NextResponse.json({
    rank: better + 1,
  });
}

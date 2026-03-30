import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(null);
  }

  const better = await prisma.leaderboardEntry.count({
    where: {
      bestWpm: {
        gt: (
          await prisma.leaderboardEntry.findUnique({
            where: { userId: session.user.id },
          })
        )?.bestWpm || 0,
      },
    },
  });

  return NextResponse.json({
    rank: better + 1,
  });
}

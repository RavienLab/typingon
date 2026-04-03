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

  let data = [];

  try {
    data = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true,
      },
      orderBy: { unlockedAt: "desc" },
    });
  } catch (err) {
    console.error("DB ERROR (userAchievement):", err);
    return NextResponse.json([], { status: 200 });
  }

  return NextResponse.json(data);
}
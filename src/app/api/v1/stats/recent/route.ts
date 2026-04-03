import { prisma } from "@/server/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔥 PRO LOGIC
  const isPro = session.user.isPro === true;
  const limit = isPro ? 100 : 10;

  const results = await prisma.typingResult.findMany({
    where: { userId: session.user.id }, 
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      wpm: true,
      accuracy: true,
      practiceMode: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ results });
}

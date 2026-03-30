import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json([]);

  const results = await prisma.typingResult.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { wpm: true, createdAt: true },
  });

  return NextResponse.json(results);
}

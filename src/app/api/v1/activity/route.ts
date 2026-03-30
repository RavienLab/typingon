import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json([]);
  }

  const results = await prisma.typingResult.findMany({
    where: { userId: session.user.id },
    select: { createdAt: true },
  });

  const days = Array.from(
    new Set(results.map(r => r.createdAt.toISOString().slice(0, 10)))
  );

  return NextResponse.json(days);
}
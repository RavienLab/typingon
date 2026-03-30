import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(null);
  }

  const last = await prisma.typingResult.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    skip: 1,
    select: { wpm: true },
  });

  return NextResponse.json(last);
}
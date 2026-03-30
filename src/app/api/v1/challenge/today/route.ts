import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let challenge = await prisma.dailyChallenge.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: today,
      },
    },
  });

  if (!challenge) {
    const last = await prisma.typingResult.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    let seed = "asdfjkl;";

    if (last?.keystrokes && Array.isArray(last.keystrokes)) {
      seed = (last.keystrokes as any[])
        .filter(k => k && k.correct === false)
        .map(k => k.key)
        .slice(0, 20)
        .join("") || "asdfjkl;";
    }

    challenge = await prisma.dailyChallenge.create({
      data: {
        userId: session.user.id,
        date: today,
        seed,
      },
    });
  }

  return NextResponse.json(challenge);
}

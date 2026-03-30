import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(0);
  }

  const results = await prisma.typingResult.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!results.length) {
    return NextResponse.json(0);
  }

  // Convert timestamps → unique days
  const days = new Set(
    results.map((r) =>
      new Date(r.createdAt).toISOString().slice(0, 10)
    )
  );

  let streak = 0;
  const today = new Date();

  while (true) {
    const day = today.toISOString().slice(0, 10);

    if (days.has(day)) {
      streak++;
      today.setDate(today.getDate() - 1);
    } else {
      break;
    }
  }

  return NextResponse.json(streak);
}
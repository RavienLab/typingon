import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await prisma.typingResult.findMany({
    where: { userId },
    select: { keystrokes: true },
  });

  const map: Record<string, number> = {};

  for (const r of results) {
    const keys = r.keystrokes as any[];

    for (const k of keys) {
      if (!k.correct) {
        map[k.key] = (map[k.key] || 0) + 1;
      }
    }
  }

  return NextResponse.json(map);
}

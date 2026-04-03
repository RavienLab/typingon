import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const session = await getServerSession(authOptions);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { mode = "test", duration = 60, textType = "paragraph" } = body;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const used = session?.user?.id
    ? await prisma.typingSession.count({
        where: {
          userId: session.user.id,
          startedAt: { gt: today },
        },
      })
    : 0;

  if (!session?.user?.isPro && used >= 50) {
    return NextResponse.json({ error: "Daily limit reached" }, { status: 403 });
  }

  const filters: any[] = [];

  if (session?.user?.id) {
    filters.push({ userId: session.user.id });
  }

  filters.push({ ipAddress: ip });

  const recentSessions = await prisma.typingSession.count({
    where: {
      OR: filters,
      startedAt: {
        gt: new Date(Date.now() - 10000),
      },
    },
  });

  if (recentSessions > 10) {
    return NextResponse.json({ error: "Too many sessions" }, { status: 429 });
  }

  const typingSession = await prisma.typingSession.create({
    data: {
      userId: session?.user?.id ?? null,
      ipAddress: ip,
      mode,
      duration,
      textType,
    },
  });

  return NextResponse.json({ sessionId: typingSession.id });
}

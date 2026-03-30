import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const {
    mode = "test",
    duration = 60,
    textType = "paragraph",
  } = body;

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

  if (!session?.user?.isPro && used >= 1) {
    return NextResponse.json(
      { error: "Daily limit reached" },
      { status: 403 },
    );
  }

  const typingSession = await prisma.typingSession.create({
    data: {
      userId: session?.user?.id ?? null,
      mode,
      duration,
      textType,
    },
  });

  return NextResponse.json({ id: typingSession.id });
}

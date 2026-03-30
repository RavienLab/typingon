import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { AttemptEventType } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: { attemptId: string } }
) {
  const { attemptId } = params;
  const { visible } = await req.json();

  await prisma.attemptEvent.create({
    data: {
      attemptId,
      type: visible
        ? AttemptEventType.focus_gained
        : AttemptEventType.focus_lost,
      meta: {
        reason: "visibilitychange",
      },
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { ExamMode, AttemptStatus, AttemptEventType } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function POST(req: Request) {
  const body = await req.json();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { examId, fingerprint } = body;
  const userId = session.user.id;
  if (!examId || !userId) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: examId },
    include: {
      examParagraphs: {
        include: { paragraph: true },
      },
    },
  });

  if (!exam || !exam.published) {
    return NextResponse.json({ error: "Exam unavailable" }, { status: 403 });
  }

  // Pick paragraph (random or ordered)
  const selected =
    exam.examParagraphs[Math.floor(Math.random() * exam.examParagraphs.length)]
      .paragraph;

  const attempt = await prisma.$transaction(async (tx) => {
    const created = await tx.attempt.create({
      data: {
        examId: exam.id,
        userId,
        paragraphId: selected.id,
        status: AttemptStatus.created,

        mode: exam.mode,
        paragraphHash: selected.contentHash,

        clientFingerprint: fingerprint ?? "unknown",
        userAgent: req.headers.get("user-agent") ?? "unknown",
        ipAddress: req.headers.get("x-forwarded-for") ?? "0.0.0.0",
      },
    });

    await tx.attemptEvent.create({
      data: {
        attemptId: created.id,
        type: AttemptEventType.created,
      },
    });

    return created;
  });

  return NextResponse.json({ attemptId: attempt.id });
}

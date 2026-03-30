import { prisma } from "@/server/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { examId: string } }
) {
  const body = await req.json();

  const userId = body.userId; // replace with session later

  const exam = await prisma.exam.findUnique({
    where: { id: params.examId, published: true },
    include: {
      examParagraphs: {
        include: { paragraph: true },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!exam) {
    return NextResponse.json({ error: "Exam not found" }, { status: 404 });
  }

  const paragraph = exam.examParagraphs[0].paragraph;

  const attempt = await prisma.attempt.create({
    data: {
      examId: exam.id,
      userId,
      paragraphId: paragraph.id,
      paragraphHash: paragraph.contentHash,
      mode: exam.mode,
      status: "created",
      clientFingerprint: body.fingerprint ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? "",
      ipAddress: body.ip ?? "0.0.0.0",
    },
  });

  return NextResponse.json({
    attemptId: attempt.id,
    paragraph: paragraph.content,
    durationSeconds: exam.durationSeconds,
    mode: exam.mode,
  });
}

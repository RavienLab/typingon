import { prisma } from "@/server/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function POST(req: Request) {
  // 🔐 ROLE CHECK
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // ✅ Use FormData (Option A)
  const formData = await req.formData();

  const examId = formData.get("examId") as string | null;
  const status = formData.get("status") as string | null;
  const from = formData.get("from") as string | null;
  const to = formData.get("to") as string | null;

  const attempts = await prisma.attempt.findMany({
    where: {
      ...(examId && { examId }),
      ...(status && { status: status as any }),
      ...(from &&
        to && {
          createdAt: {
            gte: new Date(from),
            lte: new Date(to),
          },
        }),
    },
    include: {
      user: true,
      result: true,
      exam: true,
    },
  });

  const header =
    "Candidate,Exam,Mode,WPM,Accuracy,Errors,Status,Started,Finished\n";

  const rows = attempts
    .map((a) =>
      [
        a.user?.name ?? "",
        a.exam.title,
        a.mode,
        a.result?.wpm ?? "",
        a.result?.accuracy ?? "",
        a.result?.errors ?? "",
        a.status,
        a.startedAt?.toISOString() ?? "",
        a.endedAt?.toISOString() ?? "",
      ].join(",")
    )
    .join("\n");

  const csv = header + rows;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="results.csv"`,
    },
  });
}
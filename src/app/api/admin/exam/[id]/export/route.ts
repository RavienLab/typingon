import { prisma } from "@/server/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
export async function GET(
  _: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);

  // 🔒 Enforce admin role
  if (!session || session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Admins only" },
      { status: 403 }
    );
  }

  const examId = params.id;

  const attempts = await prisma.attempt.findMany({
    where: { examId },
    include: {
      result: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // Build CSV rows
  const header = [
    "Attempt ID",
    "User ID",
    "Status",
    "WPM",
    "Accuracy",
    "Errors",
    "Total Chars",
    "Duration (ms)",
    "Created At",
  ];

  const rows = attempts.map((a) => [
    a.id,
    a.userId,
    a.status,
    a.result?.wpm ?? "",
    a.result?.accuracy ?? "",
    a.result?.errors ?? "",
    a.result?.totalChars ?? "",
    a.durationMs ?? "",
    a.createdAt.toISOString(),
  ]);

  const csv =
    [header, ...rows]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value ?? "").replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="exam-${examId}.csv"`,
    },
  });
}

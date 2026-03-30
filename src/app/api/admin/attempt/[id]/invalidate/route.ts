import { NextResponse } from "next/server";
import { prisma } from "@/server/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AttemptStatus } from "@prisma/client";

export async function POST(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== "admin" && session.user.role !== "examiner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = params;

  const attempt = await prisma.attempt.findUnique({
    where: { id },
    include: { certificate: true },
  });

  if (!attempt) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.attempt.update({
      where: { id },
      data: { status: AttemptStatus.invalidated },
    });

    // 🔒 If certificate exists → revoke logic (optional future)
    if (attempt.certificate) {
      // If you add isRevoked later:
      // await tx.certificate.update({
      //   where: { attemptId: id },
      //   data: { isRevoked: true },
      // });
    }

    await tx.attemptAudit.create({
      data: {
        attemptId: id,
        action: "invalidated",
        actorId: session.user.id,
        actorRole:
          session.user.role === "admin"
            ? "admin"
            : session.user.role === "examiner"
              ? "examiner"
              : "system",
      },
    });
  });

  return NextResponse.json({ ok: true });
}

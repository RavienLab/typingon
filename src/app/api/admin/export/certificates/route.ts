import { prisma } from "@/server/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import archiver from "archiver";
import { PassThrough } from "stream";
import { generateCertificateBufferFromId } from "@/server/certificates/pdf";

export async function POST(req: Request) {
  // 🔐 ROLE CHECK
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "admin") {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const { examId } = body;

  if (!examId) {
    return new NextResponse("Exam ID required", { status: 400 });
  }

  const attempts = await prisma.attempt.findMany({
    where: {
      examId,
      status: "verified",
    },
    include: {
      user: true,
      certificate: true,
    },
  });

  const stream = new PassThrough();
  const archive = archiver("zip", { zlib: { level: 9 } });

  archive.pipe(stream);

  for (const attempt of attempts) {
    if (!attempt.certificate) continue;

    const pdfBuffer = await generateCertificateBufferFromId(
      attempt.certificate.certificateId,
    );

    archive.append(pdfBuffer, {
      name: `${attempt.user?.name ?? "candidate"}-${attempt.certificate.certificateId}.pdf`,
    });
  }

  await archive.finalize();

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="certificates.zip"`,
    },
  });
}

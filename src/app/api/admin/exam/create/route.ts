import { prisma } from "@/server/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions); 

  // 🔒 Require login
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 🔒 Require admin role
  if (session.user.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: Admins only" },
      { status: 403 }
    );
  }

  const body = await req.json();

  const {
    title,
    mode,
    durationSeconds,
    allowBackspace,
    paragraphIds,
  } = body;

  if (!title || !mode || !durationSeconds || !paragraphIds?.length) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const paragraphs = await prisma.paragraph.findMany({
    where: { id: { in: paragraphIds } },
  });

  if (paragraphs.length !== paragraphIds.length) {
    return NextResponse.json({ error: "Invalid paragraphs" }, { status: 400 });
  }

  const paragraphPoolHash = crypto
    .createHash("sha256")
    .update(paragraphs.map((p) => p.contentHash).join("|"))
    .digest("hex");

  const exam = await prisma.exam.create({
    data: {
      title,
      mode,
      durationSeconds,
      allowBackspace,
      paragraphPoolHash,
      createdById: session.user.id,
      examParagraphs: {
        create: paragraphIds.map((id: string, index: number) => ({
          paragraphId: id,
          orderIndex: index,
        })),
      },
    },
  });

  return NextResponse.json({ exam });
}

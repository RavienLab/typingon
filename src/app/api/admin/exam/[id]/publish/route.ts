import { prisma } from "@/server/db";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
  });

  if (!exam) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (exam.published) {
    return NextResponse.json({ error: "Already published" }, { status: 400 });
  }

  await prisma.exam.update({
    where: { id: params.id },
    data: { published: true },
  });

  return NextResponse.json({ success: true });
}

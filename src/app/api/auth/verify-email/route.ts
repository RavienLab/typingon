import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token } = await req.json();

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const record = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  await prisma.user.update({
    where: { email: record.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { token: tokenHash },
  });

  return NextResponse.json({ ok: true });
}
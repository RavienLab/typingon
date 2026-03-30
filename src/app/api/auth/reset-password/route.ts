import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { token, password } = await req.json();

  const tokenHash = createHash("sha256").update(token).digest("hex");

  const reset = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!reset || reset.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Invalid or expired token" },
      { status: 400 },
    );
  }

  const hash = await bcrypt.hash(password, 10);

  await prisma.user.update({
    where: { email: reset.email },
    data: {
      password: hash,
      passwordUpdatedAt: new Date(),
    },
  });

  await prisma.passwordResetToken.delete({
    where: { tokenHash },
  });

  return NextResponse.json({ ok: true });
}

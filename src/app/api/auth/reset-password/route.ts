import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256")
      .update(token)
      .digest("hex");

    const reset = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
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

    // 🧹 Delete token after use
    await prisma.passwordResetToken.delete({
      where: { tokenHash },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("RESET PASSWORD ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { resend } from "@/lib/email";
import { resetPasswordTemplate } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    const allowed = await rateLimit(`reset:${ip}`, 5, 60);

    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 🔒 Do NOT reveal if user exists
    if (!user) {
      return NextResponse.json({ ok: true });
    }

    // 🔐 Generate token
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 🧹 Remove old tokens
    await prisma.passwordResetToken.deleteMany({
      where: { email },
    });

    // 💾 Save new token
    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + 1000 * 60 * 30), // 30 min
      },
    });

    const link = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password/${token}`;

    // 🚨 IMPORTANT: THIS MUST MATCH RESEND RULES
    const response = await resend.emails.send({
      from: "TypingON <onboarding@resend.dev>", // ✅ SAFE FOR TESTING
      to: email,
      subject: "Reset your password",
      html: resetPasswordTemplate(link),
    });

    // 🧠 Debug log (VERY useful)
    console.log("Reset email response:", response);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("FORGOT PASSWORD ERROR:", err);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
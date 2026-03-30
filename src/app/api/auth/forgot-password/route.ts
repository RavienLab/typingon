import { prisma } from "@/lib/prisma";
import { randomBytes, createHash } from "crypto";
import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { resend } from "@/lib/email";
import { resetPasswordTemplate } from "@/lib/emailTemplates";

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";

  const allowed = await rateLimit(`reset:${ip}`, 5, 60);

  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { email } = await req.json();

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = randomBytes(32).toString("hex");

  const tokenHash = createHash("sha256").update(token).digest("hex");

  await prisma.passwordResetToken.deleteMany({
    where: { email },
  });

  await prisma.passwordResetToken.create({
    data: {
      email,
      tokenHash,
      expiresAt: new Date(Date.now() + 1000 * 60 * 30),
    },
  });

  const link = `${process.env.NEXTAUTH_URL}/reset-password/${token}`;

  await resend.emails.send({
    from: "TypingON <no-reply@typingon.com>",
    to: email,
    subject: "Reset your password",
    html: resetPasswordTemplate(link),
  });

  return NextResponse.json({ ok: true });
}
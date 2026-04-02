import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { randomBytes, createHash } from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();

    const exists = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (exists) {
      // 🔥 user exists but not verified
      if (!exists.emailVerified) {
        return NextResponse.json(
          { error: "Please verify your email. Check your inbox." },
          { status: 400 },
        );
      }

      // 🔥 already verified user
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // 🔐 Hash password
    const hash = await bcrypt.hash(password, 10);

    // 🧠 Create user (NOT VERIFIED)
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hash,
        name,
        image: "/avatar.png",
        emailVerified: null, // ✅ IMPORTANT
      },
    });
    // 🔐 Generate secure token
    const token = randomBytes(32).toString("hex");

    // 🔐 Hash it (store only hash)
    const tokenHash = createHash("sha256").update(token).digest("hex");

    // 💾 Store hash in DB
    await prisma.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: tokenHash,
        expires: new Date(Date.now() + 1000 * 60 * 60),
      },
    });

    // 🔗 Send original token in link
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify?token=${token}`;

    // 📩 Send email
    await resend.emails.send({
      from: "TypingON <onboarding@resend.dev>",
      to: normalizedEmail,
      subject: "Verify your email",
      html: `
        <div style="font-family:sans-serif">
          <h2>Welcome to TypingON 🚀</h2>
          <p>Click below to verify your email:</p>
          <a href="${verifyUrl}" style="padding:10px 20px;background:#2563eb;color:white;border-radius:6px;text-decoration:none;">
            Verify Email
          </a>
          <p>This link expires in 1 hour.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Verification email sent",
      id: user.id,
    });
  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

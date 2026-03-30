import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { email, password, name } = await req.json();
    // 🔍 Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 🔍 Check if user already exists
    const exists = await prisma.user.findUnique({
      where: { email },
    });

    if (exists) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 },
      );
    }

    // 🔐 Hash password
    const hash = await bcrypt.hash(password, 10);

    // 🧠 Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hash,
        name,
      },
    });

    // ✅ Success response
    return NextResponse.json({
      success: true,
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

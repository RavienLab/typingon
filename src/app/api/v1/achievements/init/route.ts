import { NextResponse } from "next/server";
import { seedAchievements } from "@/lib/seedAchievements";

export async function GET() {
  // 🔒 block in production
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await seedAchievements();

  return NextResponse.json({ ok: true, method: "GET" });
}

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  await seedAchievements();

  return NextResponse.json({ ok: true, method: "POST" });
}
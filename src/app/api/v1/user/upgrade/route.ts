import { prisma } from "@/lib/prisma"; // 🔥 Use the singleton path!
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Update DB
  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: { isPro: true },
  });

  return NextResponse.json({
    success: true,
    isPro: updatedUser.isPro,
  });
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
 
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("avatar") as File;

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  // convert image → base64
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const base64 =
    "data:" + file.type + ";base64," + buffer.toString("base64");

  const updatedUser = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      image: base64,
    },
    select: {
      image: true,
    },
  });

  return NextResponse.json(updatedUser);
}
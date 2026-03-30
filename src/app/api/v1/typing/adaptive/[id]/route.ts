import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { generateAdaptiveText } from "@/lib/typing/adaptiveText";
export const dynamic = "force-dynamic";


const BASE =
  "the quick brown fox jumps over the lazy dog typing makes you faster every day";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.typingProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) {
    return NextResponse.json({ text: BASE });
  }

  const weakKeys = profile.weakKeys as string[];

  const text = generateAdaptiveText(weakKeys, BASE);

  return NextResponse.json({ text, weakKeys });
}

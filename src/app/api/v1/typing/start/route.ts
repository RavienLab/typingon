import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  let ip = "unknown";

  // 🔥 THE FIX: We added to pick the string, not the array
  if (forwarded) {
    const ipArray = forwarded.split(",");
    const firstIp = ipArray; // 👈 MUST HAVE HERE
    if (typeof firstIp === "string") {
      ip = firstIp.trim();
    }
  }

  console.log("🚀 API HIT - IP is:", ip);

  const session = await getServerSession(authOptions);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  // 🔥 FIX 2: Your frontend sends "practiceMode", not "mode"
  const mode = body.practiceMode || body.mode || "english";
  const searchMode = mode.toLowerCase();
  const duration = body.duration || 60;

  try {
    // 1. Check database for paragraphs
    const totalParagraphs = await prisma.paragraph.count({
      where: { language: searchMode },
    });

    if (totalParagraphs === 0) {
      console.error(`❌ DB EMPTY for mode: ${searchMode}`);
      return NextResponse.json({ error: "No paragraphs found" }, { status: 404 });
    }

    // 2. Get random paragraph
    const randomIndex = Math.floor(Math.random() * totalParagraphs);
    const selectedParagraph = await prisma.paragraph.findFirst({
      where: { language: searchMode },
      skip: randomIndex,
    });

    if (!selectedParagraph) throw new Error("Fetch failed");

    // 3. Create the session
    const typingSession = await prisma.typingSession.create({
      data: {
        userId: session?.user?.id ?? null,
        ipAddress: ip,
        mode: searchMode,
        duration: Number(duration),
        textType: "paragraph",
      },
    });

    return NextResponse.json({
      sessionId: typingSession.id,
      paragraph: {
        id: selectedParagraph.id,
        text: selectedParagraph.content,
        difficulty: selectedParagraph.difficulty,
      },
    });
  } catch (err) {
    console.error("❌ SERVER CRASH:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/* ---------------- RATE LIMIT (ADDED) ---------------- */
const RATE_LIMIT_WINDOW = 10 * 1000; // 10 sec
const MAX_REQUESTS = 10;
const ipRequests = new Map<string, { count: number; time: number }>();

export async function POST(req: Request) {
  /* ---------------- IP FIX (UPDATED) ---------------- */
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  console.log(
    "🚀 API HIT - IP is:",
    ip,
  ); /* ---------------- RATE LIMIT CHECK (ADDED) ---------------- */

  const now = Date.now();
  const record = ipRequests.get(ip);

  if (record) {
    if (now - record.time < RATE_LIMIT_WINDOW) {
      if (record.count >= MAX_REQUESTS) {
        return NextResponse.json(
          { error: "Too many requests. Slow down." },
          { status: 429 },
        );
      }
      record.count += 1;
    } else {
      ipRequests.set(ip, { count: 1, time: now });
    }
  } else {
    ipRequests.set(ip, { count: 1, time: now });
  }

  const session = await getServerSession(authOptions);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const mode = body.practiceMode || body.mode || "english";
  const searchMode = mode.toLowerCase();
  const duration = body.duration || 60;

  try {
    /* ---------------- SESSION COOLDOWN (ADDED) ---------------- */
    const recentSession = await prisma.typingSession.findFirst({
      where: {
        OR: [{ userId: session?.user?.id ?? undefined }, { ipAddress: ip }],
        startedAt: {
          gt: new Date(Date.now() - 1000), // 3 sec cooldown
        },
      },
    });

    if (recentSession) {
      return NextResponse.json(
        { error: "You're creating sessions too fast" },
        { status: 429 },
      );
    } /* ---------------- ORIGINAL LOGIC (UNCHANGED) ---------------- */

    const totalParagraphs = await prisma.paragraph.count({
      where: { language: searchMode },
    });

    if (totalParagraphs === 0) {
      console.error(`❌ DB EMPTY for mode: ${searchMode}`);
      return NextResponse.json(
        { error: "No paragraphs found" },
        { status: 404 },
      );
    }

    /* ---------------- FETCH RANDOM PARAGRAPH (IMPROVED) ---------------- */

    const { excludeId, lastIds = [] } = body;

    // 1. Build filter
    const whereClause: any = {
      language: searchMode,
      ...(lastIds?.length || excludeId
        ? {
            id: {
              notIn: [...(lastIds || []), excludeId].filter(Boolean),
            },
          }
        : {}),
    };

    // 2. Count available paragraphs
    let count = await prisma.paragraph.count({
      where: whereClause,
    });

    // 3. Fallback if exclusion removes everything
    let finalWhere = whereClause;

    if (count === 0) {
      count = await prisma.paragraph.count({
        where: { language: searchMode },
      });

      finalWhere = { language: searchMode };
    }

    // 4. Random selection
    const randomIndex = Math.floor(Math.random() * count);

    const selectedParagraph = await prisma.paragraph.findFirst({
      where: finalWhere,
      skip: randomIndex,
    });

    if (!selectedParagraph) throw new Error("Fetch failed");

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
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

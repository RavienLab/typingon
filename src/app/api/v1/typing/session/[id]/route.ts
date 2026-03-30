import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { analyzeSession } from "@/lib/typing/analyzeSession";
export const dynamic = "force-dynamic";


type WpmPoint = { t: number; wpm: number };
type Keystroke = { key: string; time: number; correct: boolean };

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await prisma.typingSession.findUnique({
    where: { id: params.id },
    include: {
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!session || session.results.length === 0) {
    return NextResponse.json(
      { error: "Session not found" },
      { status: 404 }
    );
  }

  const result = session.results[0];

  // ─────────────────────────────────────────────
  // 🧼 Decode Prisma JSON safely
  // ─────────────────────────────────────────────

  const wpmTimeline: WpmPoint[] = Array.isArray(result.wpmTimeline)
    ? (result.wpmTimeline as WpmPoint[])
    : [];

  const keystrokes: Keystroke[] = Array.isArray(result.keystrokes)
    ? (result.keystrokes as Keystroke[])
    : [];

  // 🧠 Derive training insights
  const analysis =
    wpmTimeline.length > 0 && keystrokes.length > 0
      ? analyzeSession(wpmTimeline, keystrokes)
      : null;

  return NextResponse.json({
    sessionId: session.id,
    result,
    analysis,
  });
}

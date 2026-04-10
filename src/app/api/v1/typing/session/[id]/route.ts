import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { analyzeSession } from "@/lib/typing/analyzeSession";

export const dynamic = "force-dynamic";

type WpmPoint = { t: number; wpm: number };
type Keystroke = { key: string; time: number; correct: boolean };

export async function GET(
  req: Request,
  { params }: { params: { id: string } },
) {
  // 1. Fetch the session
  const session = await prisma.typingSession.findUnique({
    where: { id: params.id },
    include: {
      results: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  // 2. 🛡️ HARD 404: If the session ID itself doesn't exist in the DB
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // 3. 🟢 GRACEFUL 200: If the session exists but the user skipped/didn't finish it.
  // This prevents the terminal from turning red with 404 errors.
  if (session.results.length === 0) {
    return NextResponse.json(
      {
        status: "incomplete",
        sessionId: session.id,
        message: "This test was skipped or not submitted.",
      },
      { status: 200 },
    );
  }

  // 1. Extract the first result from the array
  // We use [result] destructuring to get the first item
  const [result] = session.results;

  // 2. Extra safety check for TypeScript
  if (!result) {
    return NextResponse.json({ status: "incomplete" }, { status: 200 });
  }

  // ─────────────────────────────────────────────
  // 🧼 Decode Prisma JSON safely with explicit casting
  // ─────────────────────────────────────────────

  // Prisma types Json fields as 'JsonValue'.
  // We cast them to 'any' then to our type to satisfy the compiler.
  const wpmTimeline = (result.wpmTimeline as any as WpmPoint[]) || [];
  const keystrokes = (result.keystrokes as any as Keystroke[]) || [];

  // 🧠 Derive training insights
  const analysis =
    wpmTimeline.length > 0 && keystrokes.length > 0
      ? analyzeSession(wpmTimeline, keystrokes)
      : null;

  return NextResponse.json({
    sessionId: session.id,
    status: "complete",
    result: {
      ...result,
      wpmTimeline, // Return the typed versions
      keystrokes,
    },
    analysis,
  });
}

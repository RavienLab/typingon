import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";


export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const result = await prisma.typingResult.findFirst({
    where: { sessionId: params.id },
    select: { keystrokes: true },
  });

  if (!result) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const heatmap: Record<
    string,
    { total: number; mistakes: number; accuracy: number }
  > = {};

  const keys = result.keystrokes as {
    key: string;
    correct: boolean;
  }[];

  for (const k of keys) {
    if (!k.key || k.key.length !== 1) continue; // ignore shift, enter, etc

    if (!heatmap[k.key]) {
      heatmap[k.key] = { total: 0, mistakes: 0, accuracy: 0 };
    }

    heatmap[k.key].total++;
    if (!k.correct) heatmap[k.key].mistakes++;
  }

  for (const key in heatmap) {
    const c = heatmap[key];
    c.accuracy = Math.round(
      ((c.total - c.mistakes) / c.total) * 100
    );
  }

  return NextResponse.json(heatmap);
}

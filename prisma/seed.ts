import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.create({
    data: {
      email: "demo@typingon.com",
      name: "Demo Typist",
    },
  });

  const session = await prisma.typingSession.create({
    data: {
      userId: user.id,
      mode: "test",
      duration: 60,
      textType: "paragraph",
    },
  });

  await prisma.typingResult.create({
    data: {
      sessionId: session.id,
      userId: user.id,
      wpm: 78,
      rawWpm: 82,
      accuracy: 96.4,
      errors: 4,
      backspaces: 12,
      keystrokes: [],
      wpmTimeline: [
        { t: 0, wpm: 0 },
        { t: 10000, wpm: 60 },
        { t: 20000, wpm: 72 },
        { t: 30000, wpm: 78 },
        { t: 60000, wpm: 78 },
      ],
    },
  });
}

main();

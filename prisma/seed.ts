import { PrismaClient, Language, Difficulty } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// Helper to create unique hashes for paragraphs
const getHash = (content: string) =>
  crypto.createHash("md5").update(content).digest("hex");

async function main() {
  console.log("🌱 Starting seeding...");

  // 1. CREATE DEMO USER
  const user = await prisma.user.upsert({
    where: { email: "demo@typingon.com" },
    update: {},
    create: {
      email: "demo@typingon.com",
      name: "Demo Typist",
      isPro: true,
      xp: 1250,
      level: 5,
    },
  });

  // 2. SEED PARAGRAPHS (Scaling the DB)
  const paragraphData = [
    // ENGLISH
    {
      content:
        "Talk is cheap. Show me the code. Software engineering is a discipline of masterfully organizing complexity.",
      language: Language.english,
      difficulty: Difficulty.medium,
    },
    {
      content:
        "Innovation distinguishes between a leader and a follower. Stay hungry, stay foolish.",
      language: Language.english,
      difficulty: Difficulty.easy,
    },
    // CODE
    {
      content:
        "export default function App() { return <div className='p-4'>Hello World</div>; }",
      language: Language.code,
      difficulty: Difficulty.medium,
    },
    {
      content:
        "const fetchData = async () => { const res = await fetch('/api/v1/user'); return res.json(); };",
      language: Language.code,
      difficulty: Difficulty.hard,
    },
    // NUMBERS
    {
      content:
        "Pi is 3.14159265 and the Speed of Light is 299,792,458 meters per second.",
      language: Language.numbers,
      difficulty: Difficulty.medium,
    },
    // MARATHI
    {
      content:
        "सातत्याने मेहनत केल्याने प्रगती होते. टायपिंगचा सराव आपल्याला अधिक कार्यक्षम बनवतो.",
      language: Language.marathi,
      difficulty: Difficulty.medium,
    },
    // HINDI
    {
      content:
        "सफलता का रहस्य केवल अभ्यास है। जितना अधिक आप प्रयास करेंगे, उतनी ही तेजी से आप सीखेंगे।",
      language: Language.hindi,
      difficulty: Difficulty.medium,
    },
  ];

  console.log("📝 Seeding paragraphs...");
  for (const p of paragraphData) {
    await prisma.paragraph.upsert({
      where: { contentHash: getHash(p.content) },
      update: {},
      create: {
        content: p.content,
        language: p.language,
        difficulty: p.difficulty,
        contentHash: getHash(p.content),
      },
    });
  }

  // 3. SEED ACHIEVEMENTS
  const achievements = [
    {
      key: "speed_50",
      title: "Road Runner",
      description: "Hit 50 WPM",
      icon: "🏃",
    },
    {
      key: "speed_100",
      title: "Sonic",
      description: "Hit 100 WPM",
      icon: "⚡",
    },
    {
      key: "daily_streak_7",
      title: "Week Warrior",
      description: "7 Day Streak",
      icon: "🔥",
    },
  ];

  for (const a of achievements) {
    await prisma.achievement.upsert({
      where: { key: a.key },
      update: {},
      create: a,
    });
  }

  // 4. CREATE A SAMPLE RESULT
  await prisma.typingResult.create({
    data: {
      userId: user.id,
      wpm: 78,
      rawWpm: 82,
      accuracy: 96.4,
      errors: 4,
      backspaces: 12,
      practiceMode: "english",
      createdAt: new Date(),
      wpmTimeline: JSON.stringify([
        { t: 0, wpm: 0 },
        { t: 10, wpm: 65 },
        { t: 30, wpm: 78 },
      ]),
    },
  });

  console.log("✅ Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

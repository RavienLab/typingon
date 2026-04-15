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
        "The quick brown fox jumps over the lazy dog while the sun slowly sets behind the quiet hills.",
      language: Language.english,
      difficulty: Difficulty.easy,
    },

    {
      content:
        "Typing consistently every day builds muscle memory and improves both speed and accuracy over time.",
      language: Language.english,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "A calm mind and steady rhythm will always outperform rushed typing filled with constant mistakes and corrections.",
      language: Language.english,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "Developers spend hours solving problems, reading code, debugging errors, and building systems that people rely on daily.",
      language: Language.english,
      difficulty: Difficulty.hard,
    },

    {
      content:
        "Discipline beats motivation because motivation fades, but disciplined habits continue even when you do not feel like trying.",
      language: Language.english,
      difficulty: Difficulty.hard,
    },
    // CODE
    {
      content: "function calculateSum(a, b) { return a + b; }",
      language: Language.code,
      difficulty: Difficulty.easy,
    },

    {
      content: "const user = { id: 1, name: 'Ravi', isActive: true };",
      language: Language.code,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "async function fetchUsers() { const res = await fetch('/api/users'); return res.json(); }",
      language: Language.code,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "useEffect(() => { const interval = setInterval(() => console.log('tick'), 1000); return () => clearInterval(interval); }, []);",
      language: Language.code,
      difficulty: Difficulty.hard,
    },

    {
      content:
        "try { const data = await prisma.user.findMany(); } catch (error) { console.error(error); }",
      language: Language.code,
      difficulty: Difficulty.hard,
    },
    // NUMBERS
    {
      content: "12345 67890 24680 13579 11223 44556 77889",
      language: Language.numbers,
      difficulty: Difficulty.easy,
    },

    {
      content:
        "The value of pi is approximately 3.1415926535 and it never ends or repeats.",
      language: Language.numbers,
      difficulty: Difficulty.medium,
    },

    {
      content: "98765 43210 10203 40506 70809 112358 132134",
      language: Language.numbers,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "Binary values include 1010 1100 1111 0001 and hexadecimal values include A1 B2 C3 D4.",
      language: Language.numbers,
      difficulty: Difficulty.hard,
    },
    // MARATHI
    {
      content: "दररोज टायपिंगचा सराव केल्याने गती आणि अचूकता दोन्ही सुधारतात.",
      language: Language.marathi,
      difficulty: Difficulty.easy,
    },

    {
      content:
        "शांत मनाने आणि लक्ष केंद्रित करून काम केल्यास यश मिळणे सोपे होते.",
      language: Language.marathi,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "वेळेचे योग्य नियोजन केल्याने प्रत्येक काम व्यवस्थित पूर्ण करता येते.",
      language: Language.marathi,
      difficulty: Difficulty.medium,
    },

    {
      content: "सतत प्रयत्न करत राहिल्यास कठीण गोष्टी देखील सहज साध्य होतात.",
      language: Language.marathi,
      difficulty: Difficulty.hard,
    },
    // HINDI
    {
      content:
        "नियमित अभ्यास करने से आपकी टाइपिंग गति और सटीकता दोनों में सुधार होता है।",
      language: Language.hindi,
      difficulty: Difficulty.easy,
    },

    {
      content: "धैर्य और ध्यान के साथ किया गया काम हमेशा बेहतर परिणाम देता है।",
      language: Language.hindi,
      difficulty: Difficulty.medium,
    },

    {
      content: "हर दिन थोड़ा अभ्यास करने से लंबे समय में बड़ी सफलता मिलती है।",
      language: Language.hindi,
      difficulty: Difficulty.medium,
    },

    {
      content:
        "समय का सही उपयोग करने वाला व्यक्ति जीवन में हमेशा आगे बढ़ता है।",
      language: Language.hindi,
      difficulty: Difficulty.hard,
    },
  ];
  console.log("🧹 Clearing old paragraphs...");
  await prisma.paragraph.deleteMany();

  console.log("📝 Seeding paragraphs...");
  for (const p of paragraphData) {
    await prisma.paragraph.create({
      data: {
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

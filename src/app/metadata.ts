import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TypingOn — Train. Measure. Master.",
  description:
    "TypingOn is a premium typing practice platform with real-time WPM, accuracy, mistake analysis, and global leaderboards.",
  keywords: [
    "typing test",
    "wpm test",
    "learn typing",
    "typing practice",
    "typing speed",
  ],
  openGraph: {
    title: "TypingOn",
    description:
      "A serious typing training platform with analytics and competition.",
    url: "https://typingon.com",
    siteName: "TypingOn",
    images: [
      {
        url: "/og.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
};

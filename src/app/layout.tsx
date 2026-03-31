import "./globals.css";
import { Providers } from "./providers";
import { MotionProvider } from "@/components/MotionProvider";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  icons: {
    icon: "/favicon.ico",
  },
  title: {
    default: "TypingOn — Train. Measure. Master.",
    template: "%s · TypingOn",
  },
  description:
    "TypingOn is a professional typing platform for developers and power users. Measure WPM, accuracy, and improve with daily practice.",
  keywords: [
    "typing test",
    "typing practice",
    "typing speed",
    "wpm test",
    "monkeytype alternative",
    "typing trainer",
    "developer typing",
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} bg-black text-white min-h-screen antialiased`}
      >
        <Providers>
          <MotionProvider>{children}</MotionProvider>
        </Providers>
      </body>
    </html>
  );
}

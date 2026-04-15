"use client";

import {
  Keyboard,
  Globe,
  Hash,
  Code2,
  Languages,
  ChevronDown,
  Check,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import StreakFlame from "@/components/StreakFlame";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import InstallButton from "@/components/InstallButton";
import { useParagraph } from "@/components/typing/ParagraphProvider";
import { useTypingStore } from "@/store/typingStore";

/* ---------------- TYPES & CONSTANTS ---------------- */

type PracticeMode = "english" | "numbers" | "code" | "hindi" | "marathi";

type ModeOption = {
  label: string;
  value: PracticeMode;
  icon: any;
};

const MODES: readonly ModeOption[] = [
  { label: "English", value: "english", icon: Globe },
  { label: "Numbers", value: "numbers", icon: Hash },
  { label: "Code", value: "code", icon: Code2 },
  { label: "Hindi (InScript)", value: "hindi", icon: Languages },
  { label: "Marathi (InScript)", value: "marathi", icon: Languages },
];

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();

  // 🌍 Language & Typing Logic
  // 🔥 nextParagraph added here
  const { practiceMode, setPracticeMode, nextParagraph } = useParagraph();
  const isTyping = useTypingStore((s) => s.index > 0 && !s.finished);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const { data: streak } = useQuery({
    queryKey: ["streak"],
    queryFn: async () => {
      const res = await fetch("/api/v1/streak");
      if (!res.ok) return 0;
      return res.json();
    },
    enabled: !!session,
    staleTime: 60_000,
  });

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const activeMode = (MODES.find((m) => m.value === practiceMode) ||
    MODES) as ModeOption;

  return (
    <div className="min-h-screen flex flex-col bg-[#0b1220] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1220]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto h-14 px-3 sm:px-6 flex items-center justify-between">
          {/* LEFT — LOGO & DROPDOWN */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link
              href="/"
              className="flex items-center gap-2 select-none shrink-0"
            >
              <Keyboard
                size={22}
                strokeWidth={2.2}
                className="text-blue-400 translate-y-[1px]"
              />
              <div className="flex items-center">
                <span className="text-lg font-extrabold tracking-tight text-white">
                  Typing
                </span>
                <span className="text-lg font-semibold tracking-tight text-blue-400 ml-0.5">
                  ON
                </span>
              </div>
            </Link>

            {/* 🔥 NEW DROPDOWN + LANGUAGE REFRESH BUTTON PILL */}
            <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/5">
              {/* 1. ICON SELECTOR (Dropdown Trigger) */}
              <div className="relative">
                <button
                  disabled={isTyping}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`
                      flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all
                      ${isTyping ? "opacity-30 cursor-not-allowed" : "hover:bg-white/5 text-white/40 hover:text-white"}
                    `}
                >
                  <activeMode.icon size={16} />
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDropdownOpen && !isTyping && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <div className="absolute top-full left-0 mt-3 w-52 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2">
                      <div className="p-1">
                        {MODES.map((m) => (
                          <button
                            key={m.value}
                            onClick={() => {
                              setPracticeMode(m.value);
                              setIsDropdownOpen(false);
                              if (pathname !== "/test") router.push("/test");
                            }}
                            className={`
                                w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors
                                ${practiceMode === m.value ? "bg-blue-500/10 text-blue-400" : "text-white/50 hover:bg-white/5 hover:text-white"}
                              `}
                          >
                            <div className="flex items-center gap-2">
                              <m.icon size={14} />
                              {m.label}
                            </div>
                            {practiceMode === m.value && <Check size={12} />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* 2. 🔥 THE REFRESH BUTTON (The "English" Button) */}
              <button
                disabled={isTyping}
                onClick={() => {
                  if (pathname !== "/test") {
                    router.push("/test");
                    // Small delay to allow the test page to mount before firing the fetch
                    setTimeout(() => nextParagraph(), 150);
                  } else {
                    nextParagraph();
                  }
                }}
                className={`
    px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap
    ${
      isTyping
        ? "text-blue-400/50 cursor-not-allowed"
        : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white active:scale-95"
    }
  `}
              >
                {activeMode.label}
              </button>
            </div>
          </div>

          {/* CENTER — NAV */}
          <div className="hidden lg:block absolute left-1/2 -translate-x-1/2">
            <NavTabs />
          </div>

          {/* RIGHT — USER */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-fit">
            <InstallButton />
            {status === "authenticated" ? (
              <div className="flex items-center gap-3 text-sm text-white/70">
                <StreakFlame streak={streak} />
                <div className="flex items-center gap-2">
                  {session.user?.image ? (
                    <img
                      src={session.user.image}
                      onError={(e) => {
                        e.currentTarget.src = "/avatar.png";
                      }}
                      className="w-8 h-8 rounded-full object-cover border border-white/10"
                      alt="avatar"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-sm font-bold">
                      {session.user?.name?.charAt(0).toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="max-w-[60px] sm:max-w-[120px] truncate font-medium text-white/90">
                    {session.user?.name ?? session.user?.email?.split("@")}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs px-2 sm:px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/signin")}
                  className="px-3 sm:px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs sm:text-sm font-medium transition whitespace-nowrap"
                >
                  Log In
                </button>
                <button
                  onClick={() => router.push("/signup")}
                  className="px-3 sm:px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MOBILE NAV TABS */}
      <div className="lg:hidden border-b border-white/10 bg-[#0b1220]/80 backdrop-blur">
        <NavTabs />
      </div>

      <main className="flex-1 pb-10 sm:pb-12">{children}</main>

      {/* FOOTER */}
      <footer className="fixed bottom-0 left-0 w-full z-50 text-xs text-white/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex justify-end items-center gap-2">
          <span className="hidden sm:inline">
            © {new Date().getFullYear()} TypingON
          </span>
          <span className="opacity-30">·</span>
          <Link href="/privacy" className="hover:text-white transition">
            Privacy
          </Link>
          <span className="opacity-30">·</span>
          <Link href="/terms" className="hover:text-white transition">
            Terms
          </Link>
          <span className="opacity-30">·</span>
          <Link href="/contact" className="hover:text-white transition">
            Contact
          </Link>
        </div>
      </footer>
    </div>
  );
}

/* ---------------- NAV TABS ---------------- */

function NavTabs() {
  const pathname = usePathname();
  const tabs = [
    { label: "Practice", href: "/test" },
    { label: "Leaderboard", href: "/leaderboard" },
    { label: "Profile", href: "/profile" },
  ];

  return (
    <div className="flex gap-1 bg-white/5 rounded-lg p-1 text-xs sm:text-sm overflow-x-auto">
      {tabs.map((tab) => {
        const active =
          tab.href === "/test"
            ? pathname === "/" || pathname.startsWith("/test")
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-3 sm:px-4 py-1.5 whitespace-nowrap rounded-md transition ${active ? "bg-white/15 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

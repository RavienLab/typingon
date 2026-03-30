"use client";

import { Keyboard } from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import TypingAuthModal from "@/components/typing/TypingAuthModal";
import { useQuery } from "@tanstack/react-query";
import StreakFlame from "@/components/StreakFlame";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const router = useRouter();
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

  const [showAuth, setShowAuth] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#0b1220] text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0b1220]/80 backdrop-blur">
        <div className="max-w-7xl mx-auto h-14 px-6 flex items-center">
          {/* LEFT — LOGO */}
          <div className="flex items-center gap-2 select-none">
            <Keyboard
              size={22}
              strokeWidth={2.2}
              className="text-blue-400 translate-y-[1px]"
            />

            <span className="text-lg font-extrabold tracking-tight text-white">
              Typing
            </span>

            <span className="text-lg font-semibold tracking-tight text-blue-400">
              ON
            </span>
          </div>

          {/* CENTER — NAV */}
          <div className="mx-auto">
            <NavTabs />
          </div>

          {/* RIGHT — USER */}
          <div className="flex justify-end items-center gap-4 min-w-fit">
            {status === "authenticated" ? (
              // ✅ LOGGED-IN USER
              <div className="flex items-center gap-3 text-sm text-white/70">
                {/* 🔥 STREAK */}
                <div className="flex items-center gap-1">
                  <StreakFlame streak={streak} />
                </div>

                {/* 👤 AVATAR */}
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

                {/* 🧑 NAME */}
                <span className="max-w-[90px] truncate font-medium">
                  {session.user?.name ?? session.user?.email?.split("@")[0]}
                </span>

                {/* 🚪 LOGOUT */}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-xs px-3 py-1 rounded-md bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              // 👤 GUEST
              <div className="flex items-center gap-2">
                <button
                  onClick={() => router.push("/signin")}
                  className="px-4 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-medium transition"
                >
                  Log In
                </button>

                <button
                  onClick={() => router.push("/signup")}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold transition"
                >
                  Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main>{children}</main>

      <TypingAuthModal
        open={showAuth}
        onClose={() => setShowAuth(false)}
        onGuest={() => {
          setShowAuth(false);
        }}
      />
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
    <div className="flex gap-1 bg-white/5 rounded-lg p-1 text-sm">
      {tabs.map((tab) => {
        const active =
          tab.href === "/test"
            ? pathname === "/" || pathname.startsWith("/test")
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-4 py-1.5 rounded-md transition
        ${
          active
            ? "bg-white/15 text-white"
            : "text-white/60 hover:text-white hover:bg-white/10"
        }
      `}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

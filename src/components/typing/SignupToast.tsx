"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SignupToast() {
  const router = useRouter();
  const { status } = useSession();

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // if user is logged in → never show
    if (status === "authenticated") return;

    const tests = Number(localStorage.getItem("typing_tests") ?? "0");

    if (tests >= 5) {
      setVisible(true);
    }
  }, [status]);

  useEffect(() => {
    if (!visible) return;

    const t = setTimeout(() => setVisible(false), 8000);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="text-center text-sm text-white/60">
      Track your progress?{" "}
      <button
        onClick={() => router.push("/signin")}
        className="text-blue-400 hover:text-blue-300 font-semibold"
      >
        Create a free account
      </button>
    </div>
  );
}
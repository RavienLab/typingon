"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function ForgotPasswordContent() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, [params]);

  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleReset() {
    if (!isValidEmail) return;

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      alert("Failed to send reset email");
      return;
    }

    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">
      <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl w-full max-w-sm space-y-5 text-center shadow-xl border border-slate-800">
        <h1 className="text-lg sm:text-xl font-semibold">Reset Password</h1>

        {done ? (
          <p className="text-green-400 text-sm sm:text-base">
            Check your email
          </p>
        ) : (
          <>
            <input
              className="w-full p-2.5 sm:p-3 bg-slate-800 rounded-lg text-sm sm:text-base outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleReset}
              disabled={!isValidEmail}
              className="w-full bg-blue-600 hover:bg-blue-500 p-2.5 sm:p-3 rounded-lg font-semibold transition disabled:opacity-50"
            >
              Send Reset Link
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

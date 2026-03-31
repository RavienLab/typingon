"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const params = useSearchParams();

  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) setEmail(emailParam);
  }, [params]);

  // ✅ Email validation (used for button + logic)
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  async function handleReset() {
    const trimmedEmail = email.trim();

    // Validation
    if (!trimmedEmail) {
      alert("Email is required");
      return;
    }

    if (!isValidEmail) {
      alert("Enter a valid email");
      return;
    }

    await fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email: trimmedEmail }),
      headers: { "Content-Type": "application/json" },
    });

    // Save clean email
    localStorage.setItem("reset_email", trimmedEmail);

    setDone(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="bg-slate-900 p-8 rounded-xl w-80 space-y-4 text-center">
        <h1 className="text-xl font-bold">Reset Password</h1>

        {done ? (
          <p className="text-green-400">Check your email</p>
        ) : (
          <>
            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleReset}
              disabled={!isValidEmail}
              className="w-full bg-blue-600 p-2 rounded font-bold disabled:opacity-50"
            >
              Send Reset Link
            </button>
          </>
        )}
      </div>
    </div>
  );
}

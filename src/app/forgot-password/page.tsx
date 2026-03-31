"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  async function handleReset() {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
      headers: { "Content-Type": "application/json" },
    });

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
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Send Reset Link
            </button>
          </>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    await fetch("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="bg-slate-900 p-8 rounded-xl w-80 space-y-4 text-center">

        <h1 className="text-xl font-bold">Reset Password</h1>

        {sent ? (
          <p className="text-green-400 text-sm">
            If the email exists, a reset link has been sent.
          </p>
        ) : (
          <>
            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold"
            >
              Send Reset Link
            </button>
          </>
        )}

      </div>
    </div>
  );
}
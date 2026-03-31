"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";

export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState("");

  async function handleReset() {
    const trimmedPassword = password.trim();

    // Basic validation (don’t allow empty or weak input)
    if (!trimmedPassword) {
      alert("Password is required");
      return;
    }

    if (trimmedPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // ✅ FIXED
      },
      body: JSON.stringify({
        token,
        password: trimmedPassword,
      }),
    });

    if (res.ok) {
      router.replace("/signin"); // ✅ FIXED ROUTE
    } else {
      alert("Failed to reset password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="bg-slate-900 p-8 rounded-xl w-80 space-y-4 text-center">
        <h1 className="text-xl font-bold">Set New Password</h1>

        <input
          className="w-full p-2 bg-slate-800 rounded"
          placeholder="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
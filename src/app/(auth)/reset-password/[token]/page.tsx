"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function ResetPassword() {
  const { token } = useParams();
  const router = useRouter();
  const [password, setPassword] = useState("");

  async function handleReset() {
    const trimmedPassword = password.trim();

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
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        password: trimmedPassword,
      }),
    });

    if (res.ok) {
      const email = localStorage.getItem("reset_email");

      if (email) {
        await signIn("credentials", {
          email,
          password: trimmedPassword,
          redirect: true,
          callbackUrl: "/test",
        });
      } else {
        router.replace("/signin");
      }
    } else {
      alert("Failed to reset password");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">
      <div className="bg-slate-900 p-6 sm:p-8 rounded-xl w-full max-w-sm space-y-4 text-center">
        <h1 className="text-lg sm:text-xl font-bold">Set New Password</h1>

        <input
          className="w-full p-2.5 sm:p-3 bg-slate-800 rounded text-sm sm:text-base"
          placeholder="New Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-blue-600 hover:bg-blue-500 p-2.5 sm:p-3 rounded text-sm sm:text-base font-bold"
        >
          Reset Password
        </button>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();
  const params = useSearchParams();

  const reset = params.get("reset");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) return;

    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res?.ok) {
      alert("Invalid email or password");
    } else {
      router.replace("/test");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl w-80 space-y-5 text-center shadow-xl border border-slate-800"
      >
        <h1 className="text-2xl font-semibold">Welcome Back</h1>

        {reset === "success" && (
          <p className="text-green-400 text-sm">
            Password reset successful. Please log in.
          </p>
        )}

        <input
          className="w-full p-2.5 bg-slate-800 rounded-lg"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2.5 bg-slate-800 rounded-lg"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2.5 rounded-lg font-semibold"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <button
          onClick={() =>
            router.push(`/forgot-password?email=${encodeURIComponent(email)}`)
          }
          className="text-sm text-blue-400 hover:underline"
        >
          Forgot password?
        </button>

        <button
          onClick={() => router.push("/signup")}
          className="text-sm text-slate-400 hover:underline"
        >
          Don’t have an account? Create one
        </button>
      </motion.div>
    </div>
  );
}
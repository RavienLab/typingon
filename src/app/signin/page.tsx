"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function SignInPage() {
  const router = useRouter();

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
        className="bg-slate-900/80 p-8 rounded-2xl w-80 space-y-5 text-center"
      >
        <h1 className="text-xl font-bold">Welcome Back</h1>

        <input
          className="w-full p-2 bg-slate-800 rounded"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="w-full p-2 bg-slate-800 rounded"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 p-2 rounded"
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        <button
          onClick={() => router.push("/forgot-password")}
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
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("Invalid email or password");
    } else {
      router.replace("/test");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl w-full max-w-sm space-y-5 text-center shadow-xl border border-slate-800"
      >
        <h1 className="text-lg sm:text-xl font-bold">Welcome Back</h1>

        <input
          className="w-full p-2.5 sm:p-3 bg-slate-800 rounded-lg text-sm sm:text-base"
          placeholder="Email"
          onChange={(e) => {
            setEmail(e.target.value);
            setError("");
          }}
        />
        <div className="relative">
          <input
            className="w-full p-2.5 sm:p-3 pr-10 bg-slate-800 rounded-lg text-sm sm:text-base"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          onClick={handleLogin}
          disabled={!email || !password || loading}
          className="w-full bg-blue-600 hover:bg-blue-500 p-2.5 sm:p-3 rounded-lg text-sm sm:text-base font-semibold transition disabled:opacity-50 active:scale-95"
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

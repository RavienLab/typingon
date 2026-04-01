"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { signIn } from "next-auth/react";
import { Suspense } from "react";

type Step = "email" | "login" | "signup";

function AuthPageContent() {
    const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  const [internalStep, setInternalStep] = useState<Step>(
    mode === "signup" ? "signup" : "email",
  );

  const step = mode === "signup" ? "signup" : internalStep;
  const inputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ NEW: password toggle
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  useEffect(() => {
    return () => {
      setPassword("");
      setName("");
    };
  }, []);

  useEffect(() => {
    if (!searchParams.get("mode")) {
      setInternalStep("email");
      setEmail("");
    }
  }, [searchParams]);

  async function checkEmail() {
    if (!email.trim()) return;

    setLoading(true);

    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    setLoading(false);

    if (data.exists) setInternalStep("login");
    else setInternalStep("signup");
  }

  async function handleLogin() {
    if (!password) return;

    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    setLoading(false);

    if (!res?.ok) {
      alert("Invalid credentials");
    } else {
      router.replace("/test");
    }
  }

  async function handleSignup() {
    if (!name || !password) return;

    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email: email.trim(),
        password,
      }),
    });

    setLoading(false);

    if (res.ok) {
      router.replace("/test");
    } else {
      const data = await res.json();
      alert(data.error || "Signup failed");
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      if (step === "email") checkEmail();
      if (step === "login") handleLogin();
      if (step === "signup") handleSignup();
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      {/* ✅ FIXED: motion wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-slate-900/80 backdrop-blur-xl p-8 rounded-2xl w-80 space-y-5 text-center shadow-xl border border-slate-800"
      >
        <h1 className="text-2xl font-semibold tracking-tight">
          {step === "email"
            ? "Welcome"
            : step === "login"
              ? "Welcome Back"
              : "Create Account"}
        </h1>

        {/* EMAIL */}
        {step === "email" && (
          <>
            <input
              ref={inputRef}
              className="w-full p-2.5 bg-slate-800/70 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKey}
            />

            <button
              onClick={checkEmail}
              disabled={!email}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition p-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Checking..." : "Continue"}
            </button>
          </>
        )}

        {/* LOGIN */}
        {step === "login" && (
          <>
            <input
              className="w-full p-2.5 bg-slate-800/70 rounded-lg border border-slate-700"
              value={email}
              disabled
            />

            {/* ✅ PASSWORD TOGGLE */}
            <div className="relative">
              <input
                ref={inputRef}
                className="w-full p-2.5 pr-10 bg-slate-800/70 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKey}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={!password}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition p-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Processing..." : "Log In"}
            </button>
          </>
        )}

        {/* SIGNUP */}
        {step === "signup" && (
          <>
            <input
              ref={inputRef}
              className="w-full p-2.5 bg-slate-800/70 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKey}
            />

            {/* Locked email */}
            <input
              className="w-full p-2.5 bg-slate-800/70 rounded-lg border border-slate-700"
              value={email}
              disabled
            />

            {/* ✅ PASSWORD TOGGLE */}
            <div className="relative">
              <input
                className="w-full p-2.5 pr-10 bg-slate-800/70 rounded-lg border border-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                placeholder="Password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKey}
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPassword ? "🙈" : "👁"}
              </button>
            </div>

            <button
              onClick={handleSignup}
              disabled={!name || !password}
              className="w-full bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition p-2.5 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Account"}
            </button>
          </>
        )}

        {/* FORGOT PASSWORD */}
        {step === "login" && (
          <button
            onClick={() =>
              router.push(`/forgot-password?email=${encodeURIComponent(email)}`)
            }
            className="text-sm text-blue-400 hover:underline text-left"
          >
            Forgot password?
          </button>
        )}
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="text-center mt-10">Loading...</div>}>
      <AuthPageContent />
    </Suspense>
  );
}

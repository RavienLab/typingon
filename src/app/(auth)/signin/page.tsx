"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "login" | "signup">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const intent = localStorage.getItem("auth_intent");
    const savedEmail = localStorage.getItem("reset_email");

    if (savedEmail) {
      setEmail(savedEmail);
    }

    if (intent === "existing") {
      setStep(savedEmail ? "login" : "email");
    }

    if (intent === "new") {
      setStep(savedEmail ? "signup" : "email");
    }
  }, []);

  useEffect(() => {
    if (step !== "email" && !email) {
      setStep("email");
    }
  }, [step, email]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [step]);

  async function checkEmail() {
    setLoading(true);

    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (data.exists) {
      setStep("login");
    } else {
      setStep("signup");
    }

    setLoading(false);
  }

  async function handleLogin() {
    setLoading(true);

    const res = await signIn("credentials", {
      email: email.trim(),
      password,
      redirect: false,
    });

    if (res?.ok) {
      // 🔥 CLEAN STATE
      localStorage.removeItem("auth_intent");
      localStorage.removeItem("reset_email");

      router.replace("/test");
    } else {
      alert(res?.error || "Login failed");
    }

    setLoading(false);
  }

  async function handleSignup() {
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      // 🔥 CLEAN STATE
      localStorage.removeItem("auth_intent");
      localStorage.removeItem("reset_email");

      router.replace("/test");
    } else {
      const data = await res.json();
      alert(data.error || "Signup failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="bg-slate-900 p-8 rounded-xl w-80 space-y-4 text-center">
        <h1 className="text-xl font-bold">
          {step === "email"
            ? "Welcome"
            : step === "login"
              ? "Welcome Back"
              : "Create Account"}
        </h1>

        {/* EMAIL STEP */}
        {step === "email" && (
          <>
            <input
              ref={inputRef}
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") checkEmail();
              }}
            />

            <button
              onClick={checkEmail}
              disabled={!email || loading}
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Continue
            </button>
          </>
        )}

        {/* LOGIN STEP */}
        {step === "login" && (
          <>
            <p className="text-sm text-white/60 break-all">{email}</p>
            <input
              ref={inputRef}
              type={showPassword ? "text" : "password"}
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleLogin();
              }}
            />

            <button
              onClick={handleLogin}
              disabled={!password || loading}
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Log In
            </button>
          </>
        )}

        {/* SIGNUP STEP */}
        {step === "signup" && (
          <>
            <input
              ref={inputRef}
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSignup();
              }}
            />

            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Email"
              value={email}
              disabled
            />

            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSignup();
              }}
            />

            <button
              onClick={handleSignup}
              disabled={!name || !password || loading}
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Create Account
            </button>
          </>
        )}

        {/* 🔥 ALWAYS VISIBLE */}
        <div className="pt-2">
          <button
            onClick={() => {
              if (email) {
                localStorage.setItem("reset_email", email);
              }
              localStorage.setItem("auth_intent", "existing");
              router.push("/forgot-password");
            }}
            className="text-sm text-blue-400 hover:underline"
          >
            Forgot password?
          </button>
        </div>
      </div>
    </div>
  );
}

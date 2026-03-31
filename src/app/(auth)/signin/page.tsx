"use client";

import { useState } from "react";
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

  async function checkEmail() {
    setLoading(true);

    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
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
      email,
      password,
      redirect: false,
    });

    if (res?.ok) {
      router.replace("/test");
    } else {
      alert("Invalid credentials");
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
        email,
        password,
        redirect: false,
      });

      router.replace("/test");
    } else {
      alert("Signup failed");
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
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            <p className="text-sm text-white/60">{email}</p>

            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              disabled={!password || loading}
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Log In
            </button>

            <button
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-blue-400"
            >
              Forgot password?
            </button>
          </>
        )}

        {/* SIGNUP STEP */}
        {step === "signup" && (
          <>
            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
      </div>
    </div>
  );
}
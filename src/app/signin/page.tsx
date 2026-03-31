"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep] = useState<"email" | "login" | "signup">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const intent = localStorage.getItem("auth_intent");

    if (intent === "existing") setStep("login");
    if (intent === "new") setStep("signup");
  }, []);

  async function checkEmail() {
    const res = await fetch("/api/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email: email.trim() }),
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json();

    if (data.exists) setStep("login");
    else setStep("signup");
  }

  async function handleLogin() {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      localStorage.removeItem("auth_intent");
      router.replace("/test");
    }
  }

  async function handleSignup() {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      localStorage.removeItem("auth_intent");
      router.replace("/test");
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
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Continue
            </button>
          </>
        )}

        {step === "login" && (
          <>
            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleLogin}
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Log In
            </button>
          </>
        )}

        {step === "signup" && (
          <>
            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <input
              className="w-full p-2 bg-slate-800 rounded"
              placeholder="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button
              onClick={handleSignup}
              className="w-full bg-blue-600 p-2 rounded font-bold"
            >
              Create Account
            </button>
          </>
        )}

        {email && (
          <button
            onClick={() => {
              localStorage.setItem("reset_email", email);
              localStorage.setItem("auth_intent", "existing");
              router.push("/forgot-password");
            }}
            className="text-sm text-blue-400"
          >
            Forgot password?
          </button>
        )}

      </div>
    </div>
  );
}
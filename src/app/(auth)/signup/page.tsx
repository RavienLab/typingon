"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleSignup() {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (res.ok) {
      router.push("/signin");
    } else {
      alert("Signup failed");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] px-4">
      <div className="bg-slate-900/80 p-6 sm:p-8 rounded-2xl w-full max-w-sm space-y-4 text-center">
        <h1 className="text-lg sm:text-xl font-bold">Create Account</h1>

        <input
          className="w-full p-2.5 sm:p-3 bg-slate-800 rounded text-sm sm:text-base"
          placeholder="Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full p-2.5 sm:p-3 bg-slate-800 rounded text-sm sm:text-base"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            className="w-full p-2.5 sm:p-3 pr-10 bg-slate-800 rounded text-sm sm:text-base"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          onClick={handleSignup}
          className="w-full bg-blue-600 p-2.5 sm:p-3 rounded text-sm sm:text-base"
        >
          Create Account
        </button>
      </div>
    </div>
  );
}

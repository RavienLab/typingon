"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Eye, EyeOff } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const { status } = useSession();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/test");
    }
  }, [status, router]);

  async function handleRegister() {
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    if (res.ok) {
      // auto login after signup
      const login = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (login?.ok) {
        localStorage.removeItem("auth_intent"); // 🔥 ADD THIS
        router.replace("/test");
      }
    } else {
      alert("Registration failed");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220]">
      <div className="bg-slate-900 p-8 rounded-xl w-80 space-y-4 text-center">
        <h1 className="text-xl font-bold">Create Account</h1>

        <input
          className="w-full p-2 bg-slate-800 rounded"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          className="w-full p-2 bg-slate-800 rounded"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="relative">
          <input
            className="w-full p-2 pr-10 bg-slate-800 rounded"
            placeholder="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button
          disabled={loading || !email || !password || !name}
          onClick={handleRegister}
          className="w-full bg-blue-600 hover:bg-blue-500 p-2 rounded font-bold disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Account"}
        </button>

        <p className="text-sm text-white/50">
          Already have an account?{" "}
          <button
            onClick={() => {
              localStorage.setItem("auth_intent", "existing");
              router.push("/signin");
            }}
            className="text-blue-400 hover:underline"
          >
            Log In
          </button>
        </p>
        <button
          onClick={() => router.push("/forgot-password")}
          className="text-sm text-blue-400 hover:underline"
        >
          Forgot password?
        </button>
      </div>
    </div>
  );
}

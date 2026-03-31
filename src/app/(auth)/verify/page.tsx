"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyPage() {
  const params = useSearchParams();
  const token = params.get("token");

  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    if (!token) return;

    fetch(`/api/auth/verify?token=${token}`)
      .then(() => setStatus("success"))
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b1220] text-white">
      {status === "verifying" && <p>Verifying...</p>}
      {status === "success" && <p>Email verified ✅</p>}
      {status === "error" && <p>Verification failed ❌</p>}
    </div>
  );
}
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function VerifyEmailPage() {
  const { token } = useParams();
  const router = useRouter();

  useEffect(() => {
    async function verify() {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        body: JSON.stringify({ token }),
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        router.replace("/signin?verified=true");
      } else {
        alert("Invalid or expired link");
      }
    }

    verify();
  }, []);

  return <div className="text-center mt-20">Verifying...</div>;
}
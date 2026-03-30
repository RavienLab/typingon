"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignupSuccess() {
  const router = useRouter();

  useEffect(() => {
    const pending = sessionStorage.getItem("pendingSession");
    if (pending) {
      sessionStorage.removeItem("pendingSession");
      router.push(`/test/summary/${pending}`);
    } else {
      router.push("/");
    }
  }, []);  

  return <div className="p-10">Finalizing your account…</div>;
}
 
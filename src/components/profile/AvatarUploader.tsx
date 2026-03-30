"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

export default function AvatarUploader({
  image,
  name,
}: {
  image?: string;
  name?: string;
}) {
  const { update } = useSession(); // 🔥 REAL FIX
  const [avatar, setAvatar] = useState<string | null>(image ?? null);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    setAvatar(image ?? null);
  }, [image]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2_000_000) {
      alert("Max image size 2MB");
      return;
    }

    setLoading(true);

    const form = new FormData();
    form.append("avatar", file);

    try {
      const res = await fetch("/api/v1/user/avatar", {
        method: "POST",
        body: form,
      });

      const data = await res.json();

      if (data.image) {
        // ✅ instant UI
        setAvatar(data.image);

        // ✅ update session (navbar)
        update({ image: data.image }); // 🔥 no await

        // 🔥 THIS FIXES PROFILE PAGE
        queryClient.invalidateQueries({ queryKey: ["me"] });
      }
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <label className="relative cursor-pointer flex flex-col items-center gap-2">
      <input
        type="file"
        hidden
        accept="image/png,image/jpeg,image/webp"
        onChange={handleUpload}
      />
      <div className="w-20 h-20 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden text-3xl font-black">
        {avatar && avatar !== "" ? (
          <img
            src={avatar}
            onError={(e) => {
              e.currentTarget.src = "/avatar.png";
            }}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              loading ? "opacity-50" : "opacity-100"
            }`}
            alt="avatar"
          />
        ) : (
          <span className="text-white">
            {name?.charAt(0).toUpperCase() || "U"}
          </span>
        )}
      </div>

      <span className="text-sm text-blue-400 hover:underline">
        {loading ? "Uploading..." : "Change photo"}
      </span>
    </label>
  );
}

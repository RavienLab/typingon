"use client";

import { useState } from "react";

export default function ContactPage() {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit() {
    if (!message.trim()) return;
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-[#0b1220] text-white px-4 sm:px-6 py-12 flex items-center justify-center">
      <div className="bg-slate-900/80 backdrop-blur-xl p-6 sm:p-8 rounded-2xl w-full max-w-md space-y-5 shadow-xl border border-slate-800">
        <h1 className="text-xl sm:text-2xl font-semibold text-center">
          Contact Us
        </h1>

        {sent ? (
          <p className="text-green-400 text-center text-sm">
            Message sent successfully (demo)
          </p>
        ) : (
          <>
            <textarea
              className="w-full p-3 bg-slate-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button
              onClick={handleSubmit}
              className="w-full bg-blue-600 hover:bg-blue-500 p-2.5 rounded-lg font-semibold transition"
            >
              Send Message
            </button>
          </>
        )}
      </div>
    </div>
  );
}
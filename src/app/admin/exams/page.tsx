"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminExams() {
  const [exams, setExams] = useState([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/exam")
      .then((res) => res.json())
      .then((data) => setExams(data.exams));
  }, []);

  const handlePublish = async (id: string) => {
    await fetch(`/api/admin/exam/${id}/publish`, {
      method: "POST",
    });

    // 🔥 modern refresh instead of location.reload()
    router.refresh();
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Admin — Exam Management
      </h1>

      <div className="grid gap-4">
        {exams.map((exam: any) => (
          <div key={exam.id} className="p-4 border rounded-lg bg-slate-900">
            <div className="flex justify-between">
              <div>
                <Link
                  href={`/admin/exams/${exam.id}`}
                  className="font-semibold hover:underline"
                >
                  {exam.title}
                </Link>

                <div className="text-sm text-white/50">
                  Mode: {exam.mode} • {exam.durationSeconds}s
                </div>
              </div>

              <div>
                {exam.published ? (
                  <span className="text-emerald-400 text-sm">
                    Published
                  </span>
                ) : (
                  <button
                    onClick={() => handlePublish(exam.id)}
                    className="px-3 py-1 text-sm bg-blue-600 rounded"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
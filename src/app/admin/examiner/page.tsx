export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function ExaminerDashboard() {
  // 🔹 Summary Metrics
  const statusCounts = await prisma.attempt.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  const summary = {
    total: 0,
    verified: 0,
    invalidated: 0,
    aborted: 0,
    finished: 0,
  };

  for (const row of statusCounts) {
    summary.total += row._count.status;

    if (row.status === "verified") summary.verified = row._count.status;
    if (row.status === "invalidated") summary.invalidated = row._count.status;
    if (row.status === "aborted") summary.aborted = row._count.status;
    if (row.status === "finished") summary.finished = row._count.status;
  }

  // 🔹 Latest Attempts
  const attempts = await prisma.attempt.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: true,
      exam: true,
      result: true,
    },
  });

  return (
    <div className="p-10 space-y-10">
      <h1 className="text-2xl font-bold">Examiner Dashboard</h1>

      {/* 📊 SUMMARY CARDS */}
      <div className="grid grid-cols-5 gap-4">
        <Stat label="Total" value={summary.total} />
        <Stat
          label="Verified"
          value={summary.verified}
          color="text-green-500"
        />
        <Stat label="Finished" value={summary.finished} color="text-blue-500" />
        <Stat
          label="Invalidated"
          value={summary.invalidated}
          color="text-red-500"
        />
        <Stat label="Aborted" value={summary.aborted} color="text-yellow-500" />
      </div>

      {/* 📤 EXPORT CONTROLS */}
      <div className="flex gap-4">
        <form action="/api/admin/export/csv" method="POST">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Export CSV
          </button>
        </form>

        <form action="/api/admin/export/certificates" method="POST">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            Export Certificates (ZIP)
          </button>
        </form>
      </div>

      {/* 📋 ATTEMPT TABLE */}
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Candidate</th>
            <th className="text-left py-2">Exam</th>
            <th className="text-left py-2">Status</th>
            <th className="text-left py-2">WPM</th>
            <th className="text-left py-2">Accuracy</th>
            <th className="text-left py-2">View</th>
          </tr>
        </thead>

        <tbody>
          {attempts.map((a) => (
            <tr key={a.id} className="border-b">
              <td className="py-2">{a.user?.name}</td>
              <td className="py-2">{a.exam.title}</td>
              <td className="py-2">{a.status}</td>
              <td className="py-2">{a.result?.wpm ?? "-"}</td>
              <td className="py-2">{a.result?.accuracy ?? "-"}</td>
              <td className="py-2">
                <Link
                  href={`/admin/examiner/${a.id}`}
                  className="text-blue-500"
                >
                  Inspect
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Stat({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 p-4 rounded-lg">
      <div className="text-xs text-white/50 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

import { prisma } from "@/server/db";
import { notFound } from "next/navigation";

export default async function ExamDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const exam = await prisma.exam.findUnique({
    where: { id: params.id },
    include: {
      examParagraphs: {
        include: { paragraph: true },
      },
      attempts: {
        include: { result: true },
      },
    },
  });

  if (!exam) return notFound();

  const totalAttempts = exam.attempts.length;

  const finished = exam.attempts.filter(
    (a) => a.status === "finished"
  );

  const passRate =
    totalAttempts === 0
      ? 0
      : (finished.length / totalAttempts) * 100;

  const avgWpm =
    finished.reduce(
      (acc, a) => acc + (a.result?.wpm ?? 0),
      0
    ) / (finished.length || 1);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{exam.title}</h1>

      <div className="mb-6 text-sm text-white/60">
        Mode: {exam.mode} • Duration: {exam.durationSeconds}s
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Stat label="Attempts" value={totalAttempts} />
        <Stat label="Pass Rate" value={`${passRate.toFixed(1)}%`} />
        <Stat label="Avg WPM" value={avgWpm.toFixed(1)} />
      </div>

      <a
        href={`/api/admin/exam/${exam.id}/export`}
        className="inline-block px-4 py-2 bg-emerald-600 rounded text-sm"
      >
        Export CSV
      </a>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="p-4 border rounded bg-slate-900">
      <div className="text-xs text-white/50">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
